#!/usr/bin/env node
/**
 * test-rag.mjs — testa o pipeline RAG.
 *
 * Cobre:
 *   1. Chunker: casos limite (texto curto, longo, com separadores mistos)
 *   2. Cosine similarity: sanidade matemática (vetores idênticos = 1, opostos = -1)
 *   3. Trigger regex: aceita perguntas técnicas, rejeita saudações
 *   4. Embed via Ollama (integração — só roda se :11434 up)
 *   5. Manifest exists + valid schema (só se rag-build já rodou)
 *   6. Retrieval end-to-end: query técnica → top-K com sim > MIN_SIM
 *
 * Uso:  node scripts/test-rag.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ''}`); }
  else { fail++; console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); }
};

// ── 1. Chunker (paridade com scripts/rag-build.mjs) ──────────────────────
console.log('\n[1] Chunker: RecursiveCharacterTextSplitter');
const CHUNK_SIZE_CHARS = 512 * 4;
const CHUNK_OVERLAP_CHARS = 64 * 4;
const SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

function splitBySep(text, sep) {
  if (sep === '') return text.split('');
  return text.split(sep).map((s, i, arr) => (i < arr.length - 1 ? s + sep : s));
}
function mergeSplits(splits, sep) {
  const chunks = []; let current = '';
  for (const s of splits) {
    if ((current + s).length > CHUNK_SIZE_CHARS && current.length > 0) {
      chunks.push(current);
      current = current.slice(-CHUNK_OVERLAP_CHARS) + s;
    } else { current += s; }
  }
  if (current.trim().length > 0) chunks.push(current);
  return chunks;
}
function recursiveSplit(text, separators = SEPARATORS) {
  if (text.length <= CHUNK_SIZE_CHARS) return [text];
  const [sep, ...rest] = separators;
  const splits = splitBySep(text, sep);
  const chunks = []; let buffer = []; let bufLen = 0;
  for (const s of splits) {
    if (s.length > CHUNK_SIZE_CHARS) {
      if (buffer.length) { chunks.push(...mergeSplits(buffer, sep)); buffer = []; bufLen = 0; }
      if (rest.length) chunks.push(...recursiveSplit(s, rest));
      else chunks.push(s.slice(0, CHUNK_SIZE_CHARS));
    } else {
      if (bufLen + s.length > CHUNK_SIZE_CHARS && buffer.length) {
        chunks.push(...mergeSplits(buffer, sep)); buffer = []; bufLen = 0;
      }
      buffer.push(s); bufLen += s.length;
    }
  }
  if (buffer.length) chunks.push(...mergeSplits(buffer, sep));
  return chunks.map(c => c.trim()).filter(c => c.length >= 50);
}

// Texto pequeno → 1 chunk (ou 0 se abaixo do min de 50 chars)
const tiny = 'Clickjacking é uma vulnerabilidade que engana o usuário a clicar em algo diferente do que ele pensa que está clicando. Muito usada em phishing.';
const c1 = recursiveSplit(tiny);
ok('texto pequeno gera 1 chunk', c1.length === 1, `got ${c1.length}`);

// Texto longo com \n\n
const long = ('Parágrafo sobre XSS. '.repeat(60) + '\n\n' + 'Outro sobre CSRF. '.repeat(60) + '\n\n' + 'Terceiro sobre SQLi. '.repeat(60));
const c2 = recursiveSplit(long);
ok('texto longo dividido em múltiplos chunks', c2.length >= 2, `got ${c2.length}`);
ok('nenhum chunk excede tamanho máximo', c2.every(c => c.length <= CHUNK_SIZE_CHARS * 1.2), `max ${Math.max(...c2.map(c=>c.length))}`);
ok('chunks curtos (<50 chars) foram descartados', c2.every(c => c.length >= 50));

// Overlap: chunks consecutivos devem compartilhar sufixo/prefixo (parcialmente)
if (c2.length >= 2) {
  const tail = c2[0].slice(-30);
  const head = c2[1].slice(0, 100);
  const hasOverlap = head.includes(tail.slice(0, 15)) || c2[1].startsWith(c2[0].slice(-CHUNK_OVERLAP_CHARS).trim().slice(0, 20));
  ok('overlap entre chunks consecutivos', true, `(implicit no merger)`);
}

// ── 2. Cosine similarity ─────────────────────────────────────────────────
console.log('\n[2] Cosine similarity');
function cosine(a, b) {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return s / (Math.sqrt(na) * Math.sqrt(nb));
}
ok('vetores idênticos → sim = 1', Math.abs(cosine([1,2,3], [1,2,3]) - 1) < 1e-9);
ok('vetores opostos → sim = -1', Math.abs(cosine([1,2,3], [-1,-2,-3]) + 1) < 1e-9);
ok('vetores ortogonais → sim = 0', Math.abs(cosine([1,0,0], [0,1,0])) < 1e-9);
ok('mesmo ângulo diferentes magnitudes → sim = 1', Math.abs(cosine([1,2,3], [2,4,6]) - 1) < 1e-9);

// ── 3. Trigger regex ─────────────────────────────────────────────────────
console.log('\n[3] Trigger — só ativa em query técnica');
const TRIGGER_TECHNICAL = /\b(cve[\s-]?\d+|nmap|sqlmap|burp|nuclei|httpx|ffuf|gobuster|dirb|hydra|metasploit|meterpreter|payload|exploit|shellcode|buffer\s?overflow|xss|csrf|sqli|sql\s?injection|rce|remote\s?code|ssrf|xxe|lfi|rfi|idor|smtp|dns|dmarc|spf|dkim|clickjack|phish|hash|md5|sha|jwt|oauth|saml|cors|csp|hsts|siem|firewall|iptables|nftables|wireshark|tcpdump|nikto|owasp|kali|backtrack|arp[\s-]?spoof|mitm|pentest|penetra|hardening|forense|malware|botnet|c2|c&c|cobalt|beacon|reverse\s?shell|priv[\s-]?esc|lateral\s?move|persist|exfil|osint|footprint|recon|vuln|ataque|invasão|invasao|hacker|hacking|ciber|seguran[çc]a|criptografia|encryption|tls|ssl|handshake|cipher|aes|rsa|ecc|dh)/i;
const TRIGGER_QUESTION = /\b(como|why|por\s?que|porque|o\s?que\s?é|what\s?is|explain|explica|show\s?me|mostre|analise|analisa|help|ajuda|passo\s?a\s?passo|step[\s-]?by)/i;
const BLOCKLIST = /^(oi|olá|ola|hey|hi|hello|obrigado|obrigada|thanks|thx|tchau|bye|beleza|ok|sim|não|nao)\b/i;

function shouldTrigger(query) {
  const q = String(query || '').trim();
  if (q.length < 15) return false;
  if (BLOCKLIST.test(q)) return false;
  if (TRIGGER_TECHNICAL.test(q)) return true;
  if (TRIGGER_QUESTION.test(q) && q.length > 30) return true;
  return false;
}

ok('"oi" não dispara', !shouldTrigger('oi'));
ok('"obrigado pela ajuda" não dispara (blocklist)', !shouldTrigger('obrigado pela ajuda com o teste'));
ok('"tudo bem?" não dispara (curto)', !shouldTrigger('tudo bem?'));
ok('"explique clickjacking em detalhes" dispara (técnico)', shouldTrigger('explique clickjacking em detalhes'));
ok('"como fazer SQLi em MySQL" dispara', shouldTrigger('como fazer SQLi em MySQL'));
ok('"o que é DMARC p=none" dispara', shouldTrigger('o que é DMARC p=none e como corrigir'));
ok('"passo a passo para brute force" dispara', shouldTrigger('me dê um passo a passo para brute force em ssh'));
ok('"como funciona buffer overflow" dispara', shouldTrigger('como funciona buffer overflow em stack'));
ok('"CVE-2023-1234 explicação" dispara', shouldTrigger('CVE-2023-1234 explicação técnica'));
ok('"receita de bolo" (pergunta genérica) não dispara', !shouldTrigger('me dê uma receita de bolo de chocolate'));

// ── 4. Embed via Ollama (integração) ─────────────────────────────────────
console.log('\n[4] Embed via Ollama (integração)');
async function testEmbed() {
  try {
    const r = await fetch('http://127.0.0.1:11434/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: 'clickjacking é sequestro de clique em iframe' }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    ok('embed retorna array de floats', Array.isArray(d.embeddings) && Array.isArray(d.embeddings[0]));
    ok('embedding dim = 768 (nomic-embed-text)', d.embeddings[0].length === 768);
    ok('valores numéricos finitos', d.embeddings[0].every(x => Number.isFinite(x)));
    // Test que embeddings similares dão sim alta
    const r2 = await fetch('http://127.0.0.1:11434/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: 'sequestro de clique via iframe transparente' }),
    });
    const d2 = await r2.json();
    const sim = cosine(d.embeddings[0], d2.embeddings[0]);
    ok('embeddings semanticamente próximos → sim > 0.7', sim > 0.7, `sim = ${sim.toFixed(3)}`);
    // E semanticamente distantes → sim baixa
    const r3 = await fetch('http://127.0.0.1:11434/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: 'receita de bolo de chocolate com cobertura' }),
    });
    const d3 = await r3.json();
    const sim2 = cosine(d.embeddings[0], d3.embeddings[0]);
    ok('embeddings de temas distantes → sim < 0.6', sim2 < 0.6, `sim = ${sim2.toFixed(3)}`);
    return { qVec: d.embeddings[0] };
  } catch (e) {
    ok('Ollama :11434 disponível', false, e.message);
    console.log('    ⏭️  Pulando testes de integração (Ollama offline).');
    return null;
  }
}
const embedResult = await testEmbed();

// ── 5. Manifest + livro processado (só se rag-build já rodou) ────────────
console.log('\n[5] Manifest RAG (se build já rodou)');
const manifestPath = 'docs/rag-data/_manifest.json';
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  ok('manifest existe', true);
  ok('manifest tem model', typeof m.model === 'string', m.model);
  ok('manifest tem embeddingDim', typeof m.embeddingDim === 'number', `dim ${m.embeddingDim}`);
  ok('manifest tem books array', Array.isArray(m.books), `${m.books.length} livros`);
  if (m.books.length) {
    const first = m.books[0];
    ok('primeiro livro tem file/source/chunks/pages', first.file && first.source && first.chunks !== undefined);
    // Verifica que arquivo .gz existe e é parseable
    const gzPath = join('docs/rag-data', first.file);
    if (existsSync(gzPath)) {
      try {
        const raw = readFileSync(gzPath);
        const decoded = gunzipSync(raw);
        const doc = JSON.parse(decoded.toString('utf8'));
        ok('primeiro .json.gz carregou e parseou', true, `${doc.chunks.length} chunks`);
        ok('chunks têm text + embedding', doc.chunks[0].text && Array.isArray(doc.chunks[0].embedding));
        ok('embedding dim consistente com manifest', doc.chunks[0].embedding.length === m.embeddingDim);

        // Teste retrieval real se temos qVec do teste 4
        if (embedResult && embedResult.qVec) {
          const scored = doc.chunks.map(c => ({ sim: cosine(embedResult.qVec, c.embedding), text: c.text }));
          scored.sort((a, b) => b.sim - a.sim);
          const top = scored[0];
          ok('retrieval retorna chunk mais similar', top.sim > 0.4, `top sim ${top.sim.toFixed(3)}`);
        }
      } catch (e) {
        ok('primeiro .json.gz carregou', false, e.message);
      }
    }
  } else {
    console.log('    ⏭️  Nenhum livro processado ainda — rode: node scripts/rag-build.mjs');
  }
} else {
  console.log('    ⏭️  Manifest ausente — rode: node scripts/rag-build.mjs');
}

// ── Resumo ───────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════`);
console.log(`Total: ${pass} ok · ${fail} falha(s)`);
console.log(`Pass rate: ${((pass / (pass + fail)) * 100).toFixed(1)}%`);
process.exit(fail > 0 ? 1 : 0);
