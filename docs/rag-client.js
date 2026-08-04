/*
 * T3MP3ST — RAG Client (client-side retrieval)
 *
 * Overlay não-invasivo que adiciona busca RAG ao chat:
 *   1. No boot, carrega o manifest de docs/rag-data/_manifest.json
 *   2. Lazy-loads cada .json.gz sob demanda (por query, não tudo de uma vez)
 *   3. Intercepta o fluxo do chat: quando o usuário faz pergunta técnica,
 *      embeda a query via Ollama /api/embed, faz top-K cosine similarity em
 *      todos os chunks conhecidos, e injeta contexto no último user message.
 *
 * Preserva TUDO que já funciona — só monkey-patcha fetch(Ollama /api/chat)
 * para adicionar <context>...</context> no user message quando trigger dispara.
 *
 * Config: window.__t3rag.config = { model, topK, minSim, ollama }
 */
(function () {
  'use strict';
  if (window.__t3rag) return;

  var OLLAMA = 'http://127.0.0.1:11434';
  var EMBED_MODEL = 'nomic-embed-text';
  var MANIFEST_URL = '/rag-data/_manifest.json';
  var TOP_K = 5;
  var MIN_SIM = 0.35;      // abaixo disso, chunk é irrelevante
  var CACHE = {};          // filename → parsed chunks (com embedding)
  var MANIFEST = null;
  var ALL_LOADED = false;
  var QUERY_CACHE = {};    // query hash → top-K results (evita re-embedar iguais)

  // ─── Trigger regex: só ativa RAG em query técnica ────────────────────
  var TRIGGER_TECHNICAL = /\b(cve[\s-]?\d+|nmap|sqlmap|burp|nuclei|httpx|ffuf|gobuster|dirb|hydra|metasploit|meterpreter|payload|exploit|shellcode|buffer\s?overflow|xss|csrf|sqli|sql\s?injection|rce|remote\s?code|ssrf|xxe|lfi|rfi|idor|smtp|dns|dmarc|spf|dkim|clickjack|phish|hash|md5|sha|jwt|oauth|saml|cors|csp|hsts|siem|firewall|iptables|nftables|wireshark|tcpdump|nikto|owasp|kali|backtrack|arp[\s-]?spoof|mitm|pentest|penetra|hardening|forense|malware|botnet|c2|c&c|cobalt|beacon|reverse\s?shell|priv[\s-]?esc|lateral\s?move|persist|exfil|osint|footprint|recon|vuln|ataque|invasão|invasao|hacker|hacking|ciber|seguran[çc]a|criptografia|encryption|tls|ssl|handshake|cipher|aes|rsa|ecc|dh)/i;
  var TRIGGER_QUESTION = /\b(como|why|por\s?que|porque|o\s?que\s?é|what\s?is|explain|explica|show\s?me|mostre|analise|analisa|help|ajuda|passo\s?a\s?passo|step[\s-]?by)/i;
  var BLOCKLIST = /^(oi|olá|ola|hey|hi|hello|obrigado|obrigada|thanks|thx|tchau|bye|beleza|ok|sim|não|nao)\b/i;

  function shouldTrigger(query) {
    var q = String(query || '').trim();
    if (q.length < 15) return false;
    if (BLOCKLIST.test(q)) return false;
    // Se tem termo técnico → sempre dispara
    if (TRIGGER_TECHNICAL.test(q)) return true;
    // Se é pergunta ("como", "por que") → dispara também
    if (TRIGGER_QUESTION.test(q) && q.length > 30) return true;
    return false;
  }

  // ─── Cosine similarity ───────────────────────────────────────────────
  function cosine(a, b) {
    var s = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) {
      s += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return s / (Math.sqrt(na) * Math.sqrt(nb));
  }

  // ─── Embedding via Ollama ───────────────────────────────────────────
  async function embedQuery(text) {
    var r = await fetch(OLLAMA + '/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!r.ok) throw new Error('embed HTTP ' + r.status);
    var d = await r.json();
    return d.embeddings[0];
  }

  // ─── Load do manifest + livros (lazy) ────────────────────────────────
  async function loadManifest() {
    if (MANIFEST) return MANIFEST;
    try {
      var r = await fetch(MANIFEST_URL);
      if (!r.ok) throw new Error('manifest HTTP ' + r.status);
      MANIFEST = await r.json();
      console.log('[RAG] manifest carregado:', MANIFEST.books.length, 'livros');
      return MANIFEST;
    } catch (e) {
      console.warn('[RAG] manifest indisponível — RAG desativado:', e.message);
      MANIFEST = { books: [] };
      return MANIFEST;
    }
  }

  // Descompacta gzip usando DecompressionStream (browser nativo)
  async function fetchGzJson(url) {
    var r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (typeof DecompressionStream !== 'undefined') {
      var ds = r.body.pipeThrough(new DecompressionStream('gzip'));
      var text = await new Response(ds).text();
      return JSON.parse(text);
    } else {
      // fallback: pega bytes brutos e usa pako? não vamos depender — só browsers recentes
      throw new Error('DecompressionStream não disponível — atualize o browser');
    }
  }

  async function loadBook(file) {
    if (CACHE[file]) return CACHE[file];
    var url = '/rag-data/' + file;
    var data = await fetchGzJson(url);
    CACHE[file] = data;
    console.log('[RAG] livro carregado:', data.source, '·', data.chunks.length, 'chunks');
    return data;
  }

  async function loadAllBooks() {
    if (ALL_LOADED) return;
    var m = await loadManifest();
    // Carrega em série (evita saturar rede local)
    for (var i = 0; i < m.books.length; i++) {
      try { await loadBook(m.books[i].file); }
      catch (e) { console.warn('[RAG] falha ao carregar', m.books[i].file, e.message); }
    }
    ALL_LOADED = true;
  }

  // ─── Search: top-K global entre todos os livros carregados ──────────
  async function search(query, k) {
    k = k || TOP_K;
    var hash = hashCode(query + '|' + k);
    if (QUERY_CACHE[hash]) return QUERY_CACHE[hash];

    var qVec;
    try { qVec = await embedQuery(query); }
    catch (e) { console.warn('[RAG] embed query falhou:', e.message); return []; }

    var results = [];
    var books = Object.values(CACHE);
    for (var b = 0; b < books.length; b++) {
      var doc = books[b];
      for (var i = 0; i < doc.chunks.length; i++) {
        var c = doc.chunks[i];
        var sim = cosine(qVec, c.embedding);
        if (sim >= MIN_SIM) {
          results.push({ sim: sim, text: c.text, source: doc.source, chunkId: c.id });
        }
      }
    }
    results.sort(function (a, b) { return b.sim - a.sim; });
    var top = results.slice(0, k);
    QUERY_CACHE[hash] = top;
    return top;
  }

  function hashCode(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
    return h;
  }

  // ─── Formata contexto para injeção ───────────────────────────────────
  function formatContext(chunks) {
    if (!chunks.length) return '';
    var lines = ['<context>'];
    chunks.forEach(function (c, i) {
      lines.push('[' + (i + 1) + '] fonte: ' + c.source);
      lines.push(c.text.trim());
      lines.push('');
    });
    lines.push('</context>');
    lines.push('');
    return lines.join('\n');
  }

  // ─── Monkey-patch fetch para injetar contexto no /api/chat do Ollama ─
  var _origFetch = window.fetch;
  window.fetch = async function (input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var isChat = /\/api\/chat$/.test(url) || (init && init.body && /api\/chat/.test(url));
      if (!isChat || !init || !init.body) return _origFetch.apply(this, arguments);

      var body;
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body; }
      catch { return _origFetch.apply(this, arguments); }
      if (!body || !Array.isArray(body.messages)) return _origFetch.apply(this, arguments);

      // Só injeta em chamadas do chat principal (skip llmInterpret que também usa /api/chat)
      // Detecta: chat principal tem system prompt do Comandante; interpret tem outro
      var isMainChat = body.messages.some(function (m) {
        return m.role === 'system' && /COMANDANTE|Comandante/.test(String(m.content || ''));
      });
      if (!isMainChat) return _origFetch.apply(this, arguments);

      // Última mensagem user
      var lastUserIdx = -1;
      for (var i = body.messages.length - 1; i >= 0; i--) {
        if (body.messages[i].role === 'user') { lastUserIdx = i; break; }
      }
      if (lastUserIdx < 0) return _origFetch.apply(this, arguments);

      var lastUser = body.messages[lastUserIdx].content;
      if (!shouldTrigger(lastUser)) return _origFetch.apply(this, arguments);

      // Garante que os livros estão carregados
      if (!ALL_LOADED) {
        console.log('[RAG] carregando corpus…');
        await loadAllBooks();
      }
      if (!Object.keys(CACHE).length) return _origFetch.apply(this, arguments);

      // Retrieve
      var hits = await search(lastUser, TOP_K);
      if (!hits.length) {
        console.log('[RAG] nenhum chunk relevante (todos abaixo de sim=' + MIN_SIM + ')');
        return _origFetch.apply(this, arguments);
      }
      console.log('[RAG] top', hits.length, 'chunks · maior sim:', hits[0].sim.toFixed(3));

      // Injeta contexto no user message
      var ctx = formatContext(hits);
      body.messages[lastUserIdx] = {
        role: 'user',
        content: ctx + 'Pergunta: ' + lastUser + '\n\n(Cite [n] das fontes acima. Se contexto não bastar, diga "não sei" ao invés de inventar.)',
      };
      init = Object.assign({}, init, { body: JSON.stringify(body) });
      // Expose último retrieval pro debugger
      window.__t3rag.lastSearch = { query: lastUser, hits: hits };
    } catch (e) {
      console.warn('[RAG] injeção falhou:', e.message);
    }
    return _origFetch.apply(this, [input, init]);
  };

  // ─── API pública ─────────────────────────────────────────────────────
  window.__t3rag = {
    config: {
      get topK() { return TOP_K; },
      set topK(v) { TOP_K = v; },
      get minSim() { return MIN_SIM; },
      set minSim(v) { MIN_SIM = v; },
      get embedModel() { return EMBED_MODEL; },
      set embedModel(v) { EMBED_MODEL = v; },
    },
    loadManifest,
    loadBook,
    loadAllBooks,
    search,
    shouldTrigger,
    // Force disable
    disable: function () {
      window.fetch = _origFetch;
      console.log('[RAG] desativado — fetch original restaurado');
    },
    // Debug
    stats: function () {
      var chunks = 0;
      Object.values(CACHE).forEach(function (d) { chunks += d.chunks.length; });
      return {
        booksLoaded: Object.keys(CACHE).length,
        totalChunks: chunks,
        allLoaded: ALL_LOADED,
        manifestBooks: (MANIFEST && MANIFEST.books.length) || 0,
      };
    },
  };

  // Boot: só carrega manifest, chunks vêm sob demanda no 1º query técnico
  loadManifest();
  console.log('[RAG] client instalado · use window.__t3rag para controlar');
})();
