/*
 * T3MP3ST — Motor ReAct (Reason + Act) para o Chat
 * ──────────────────────────────────────────────────
 * Implementa o loop ReAct do LangGraph: o operador humano fala com o
 * COORDENADOR (OP_ADMIRALE) pelo Chat. O Coordenador raciocina, delega
 * para operadores especializados (Recon, Scanner, Explorer), executa
 * ferramentas REAIS do Arsenal via /api/tools/execute, observa a saída,
 * e repete até ter achados suficientes.
 *
 * Arquitetura:
 *   Operador (humano, no Chat)
 *       ↓ fala com
 *   Coordenador (LLM com system prompt de OP_ADMIRALE)
 *       ↓ delega para operadores via ferramentas
 *   Recon (curl, httpx, subfinder, whois, DNS)
 *   Scanner (nuclei, nmap, naabu, nikto, whatweb)
 *   Explorer (ffuf, katana, gobuster, dalfox)
 *       ↓ resulta em
 *   Achados estruturados → PDF profissional
 *
 * 100% reversível: remova o <script> tag.
 */
(function () {
  'use strict';
  if (window.__t3react) return;

  var OLLAMA = 'http://127.0.0.1:11434';
  var MAX_TURNS = 12;
  var MAX_OBS = 1800;

  // ═══════════════════════════════════════════════
  // Registro de ferramentas do Arsenal
  // ═══════════════════════════════════════════════
  var TOOLS = [
    { bin: 'curl',        op: 'recon',    desc: 'HTTP client — headers, body, robots.txt, paths', ex: 'curl -sSI https://TARGET' },
    { bin: 'httpx',       op: 'recon',    desc: 'HTTP probe rápido com detecção de tecnologia', ex: 'httpx -u https://TARGET -tech-detect -status-code -title -server -no-color' },
    { bin: 'subfinder',   op: 'recon',    desc: 'Enumeração passiva de subdomínios', ex: 'subfinder -d TARGET -silent' },
    { bin: 'katana',      op: 'recon',    desc: 'Web crawler para descobrir URLs', ex: 'katana -u https://TARGET -d 2 -silent' },
    { bin: 'whois',       op: 'recon',    desc: 'Info de registro do domínio', ex: 'whois TARGET' },
    { bin: 'dig',         op: 'recon',    desc: 'Consultas DNS (A, MX, TXT, DMARC)', ex: 'dig TARGET A +short' },
    { bin: 'amass',       op: 'recon',    desc: 'Enumeração profunda de subdomínios', ex: 'amass enum -passive -d TARGET' },
    { bin: 'dnsx',        op: 'recon',    desc: 'Toolkit DNS rápido', ex: 'dnsx -d TARGET -resp -a' },
    { bin: 'waybackurls', op: 'recon',    desc: 'URLs históricas do Wayback Machine', ex: 'waybackurls TARGET' },
    { bin: 'whatweb',     op: 'recon',    desc: 'Fingerprint de tecnologia web', ex: 'whatweb https://TARGET' },
    { bin: 'wafw00f',     op: 'recon',    desc: 'Detecção de WAF', ex: 'wafw00f https://TARGET' },
    { bin: 'nuclei',      op: 'scanner',  desc: 'Scanner de vulnerabilidades com templates', ex: 'nuclei -u https://TARGET -severity medium,high,critical -silent' },
    { bin: 'nmap',        op: 'scanner',  desc: 'Scanner de portas e serviços', ex: 'nmap -F TARGET' },
    { bin: 'naabu',       op: 'scanner',  desc: 'Scanner SYN rápido de portas', ex: 'naabu -host TARGET -top-ports 100 -silent' },
    { bin: 'nikto',       op: 'scanner',  desc: 'Scanner de vulnerabilidades web', ex: 'nikto -h https://TARGET -maxtime 60' },
    { bin: 'openssl',     op: 'scanner',  desc: 'Verificação TLS/SSL', ex: 'openssl s_client -connect TARGET:443 -servername TARGET -brief' },
    { bin: 'testssl.sh',  op: 'scanner',  desc: 'Teste TLS completo', ex: 'testssl.sh --quiet https://TARGET' },
    { bin: 'ffuf',        op: 'explorer', desc: 'Fuzzer de diretórios e parâmetros', ex: 'ffuf -u https://TARGET/FUZZ -w wordlist.txt -mc 200,301,403' },
    { bin: 'gobuster',    op: 'explorer', desc: 'Brute-force de diretórios', ex: 'gobuster dir -u https://TARGET -w wordlist.txt' },
    { bin: 'feroxbuster', op: 'explorer', desc: 'Descoberta recursiva de conteúdo', ex: 'feroxbuster -u https://TARGET -q' },
    { bin: 'dalfox',      op: 'explorer', desc: 'Scanner de XSS', ex: 'dalfox url https://TARGET/search?q=test' },
    { bin: 'sqlmap',      op: 'explorer', desc: 'Teste de SQL injection (SÓ com autorização explícita)', ex: 'sqlmap -u "https://TARGET/page?id=1" --batch --level=1' },
    { bin: 'gitleaks',    op: 'scanner',  desc: 'Scan de secrets em código', ex: 'gitleaks detect --source /path' },
    { bin: 'trufflehog',  op: 'scanner',  desc: 'Encontrar credenciais vazadas', ex: 'trufflehog filesystem /path' },
  ];

  // ═══════════════════════════════════════════════
  // Cache de ferramentas instaladas
  // ═══════════════════════════════════════════════
  var _inst = null;
  function getInstalled() {
    if (_inst) return Promise.resolve(_inst);
    return fetch('/api/arsenal/status')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        _inst = { curl: true, openssl: true };
        if (d && d.tools) {
          // tools pode ser array [{id, available}] ou objeto {id: {installed}}
          if (Array.isArray(d.tools)) {
            d.tools.forEach(function (t) {
              if (t && t.available) _inst[t.id || t.binary] = true;
            });
          } else {
            Object.keys(d.tools).forEach(function (k) {
              if (d.tools[k] && (d.tools[k].installed || d.tools[k].available)) _inst[k] = true;
            });
          }
        }
        return _inst;
      })
      .catch(function () { _inst = { curl: true, openssl: true }; return _inst; });
  }

  function availTools() {
    return TOOLS.filter(function (t) { return _inst && _inst[t.bin]; });
  }

  // ═══════════════════════════════════════════════
  // System prompt do COORDENADOR (OP_ADMIRALE)
  // ═══════════════════════════════════════════════
  function buildCoordinatorPrompt(host) {
    var tools = availTools();
    var byOp = { recon: [], scanner: [], explorer: [] };
    tools.forEach(function (t) { if (byOp[t.op]) byOp[t.op].push(t); });

    var toolBlock = '';
    var opNames = { recon: '🔍 RECON', scanner: '🎯 SCANNER', explorer: '📂 EXPLORER' };
    ['recon', 'scanner', 'explorer'].forEach(function (op) {
      if (!byOp[op].length) return;
      toolBlock += '\n### ' + opNames[op] + '\n';
      byOp[op].forEach(function (t) {
        toolBlock += '- `' + t.bin + '`: ' + t.desc + '\n  Ex: `' + t.ex.replace(/TARGET/g, host) + '`\n';
      });
    });

    return [
      'Você é o COORDENADOR (OP_ADMIRALE) do T3MP3ST — plataforma de segurança ofensiva autorizada.',
      'O operador humano (Claudio) fala com você pelo Chat. Você comanda operadores especializados.',
      '',
      '## Operadores Ativos (com ferramentas reais)',
      '- 🔍 **RECON** — reconhecimento, OSINT, fingerprint, DNS, subdomínios',
      '- 🎯 **SCANNER** — detecção de vulnerabilidades, portas, TLS, secrets',
      '- 📂 **EXPLORER** — descoberta de paths, fuzzing, XSS, SQLi',
      '',
      '## Operadores em Desenvolvimento (indisponíveis)',
      '- ⚔️ INFILTRATOR — movimento lateral (em breve)',
      '- 📤 EXFILTRATOR — extração de dados (em breve)',
      '- 👻 GHOST — anti-forense (em breve)',
      '',
      '## Ferramentas Disponíveis (' + tools.length + ')',
      toolBlock,
      '',
      '## Protocolo ReAct (Reason + Act)',
      'A cada turno, responda EXATAMENTE neste formato:',
      '',
      'THOUGHT: [seu raciocínio — qual operador delegar e por quê]',
      'ACTION: [comando shell ÚNICO para executar]',
      '',
      'Quando tiver achados suficientes, termine com:',
      '',
      'THOUGHT: [resumo da operação]',
      'FINAL:',
      '---',
      'ACHADO: [título curto do achado]',
      'SEVERIDADE: [CRÍTICO|ALTO|MÉDIO|BAIXO]',
      'EVIDÊNCIA: [o que foi observado, literal]',
      'RISCO: [como um atacante malicioso poderia explorar isso]',
      'CORREÇÃO: [o que fazer para fechar essa brecha]',
      '---',
      '(repita o bloco --- para cada achado)',
      '',
      '## POSTURA: 100% DEFENSIVA',
      'O objetivo é PROTEGER sistemas — encontrar brechas antes que atacantes encontrem.',
      'NUNCA destruir, derrubar, apagar dados, ou causar qualquer dano ao alvo.',
      'O relatório final deve ajudar o DONO do sistema a corrigir os problemas.',
      '',
      '## Sistema de Tiers (controle de segurança)',
      '- **Tier 1-2** (leitura, sondagem passiva): curl, httpx, subfinder, whois, dig → rodam AUTOMATICAMENTE',
      '- **Tier 3** (intrusivo): sqlmap, nuclei agressivo, brute-force → o backend pede APROVAÇÃO HUMANA',
      '- **BLOQUEADO** (nunca usar): metasploit, hydra, pacu, frida → causam dano real, proibidos',
      'Se você achar que precisa de uma ferramenta Tier 3, EXPLIQUE no THOUGHT por que e deixe o backend pedir aprovação.',
      '',
      '## Regras Invioláveis',
      '1. Só reporte o que OBSERVOU na saída da ferramenta. NUNCA fabrique.',
      '2. Responda em português (PT-BR).',
      '3. Comece por recon básico (headers, robots.txt, DNS). Aprofunde baseado nos achados.',
      '4. Se encontrar robots.txt, SIGA os paths e investigue os mais interessantes.',
      '5. Se uma ferramenta falhar (ENOENT), NÃO está instalada — use alternativa.',
      '6. Máximo ' + MAX_TURNS + ' ações. Após isso, FINAL obrigatório.',
      '7. Cada ACTION é UM comando. Sem pipes (|) ou encadeamento (&&).',
      '8. Quando delegar, diga qual operador: "Delegando ao RECON: ..." ou "Delegando ao SCANNER: ..."',
      '9. Após scan de portas, investigue serviços encontrados.',
      '10. Após encontrar paths expostos, acesse-os para ver o conteúdo.',
      '11. NUNCA execute comandos destrutivos (rm, drop, delete, shutdown, kill, etc.).',
      '12. Para cada achado, tente indicar: arquivo/path exato, o que corrigir, e o risco se não corrigir.',
      '',
      '## Formato do FINAL (achados)',
      'Cada achado deve ter:',
      '- ACHADO: título curto',
      '- SEVERIDADE: CRÍTICO|ALTO|MÉDIO|BAIXO',
      '- EVIDÊNCIA: o que foi observado (saída literal da ferramenta)',
      '- LOCAL: arquivo, path, header, ou config exata onde está o problema',
      '- RISCO: como um atacante malicioso poderia explorar isso',
      '- CORREÇÃO: o que fazer para fechar essa brecha (código/config concreta)',
      '',
      '## Alvo autorizado: ' + host,
    ].join('\n');
  }

  // ═══════════════════════════════════════════════
  // Parser do formato ReAct
  // ═══════════════════════════════════════════════
  function parseReact(text) {
    if (!text || !text.trim()) return { type: 'empty' };
    var t = text.trim();

    // FINAL
    var fi = t.search(/\bFINAL\s*:/i);
    if (fi !== -1) {
      var th = '';
      var tm = t.match(/THOUGHT\s*:\s*([\s\S]*?)(?=FINAL\s*:)/i);
      if (tm) th = tm[1].trim();
      return { type: 'final', thought: th, answer: t.substring(fi).replace(/^FINAL\s*:\s*/i, '').trim() };
    }

    // ACTION
    var am = t.match(/ACTION\s*:\s*`?([^`\n]+)`?/i);
    if (am) {
      var th2 = '';
      var tm2 = t.match(/THOUGHT\s*:\s*([\s\S]*?)(?=ACTION\s*:)/i);
      if (tm2) th2 = tm2[1].trim();
      return { type: 'action', thought: th2, command: am[1].trim() };
    }

    // Code block fallback
    var cb = t.match(/```(?:bash|sh|shell)?\s*\n?([\s\S]*?)```/);
    if (cb) {
      return { type: 'action', thought: t.replace(cb[0], '').trim(), command: cb[1].trim().split('\n')[0] };
    }

    return { type: 'thought_only', thought: t };
  }

  // ═══════════════════════════════════════════════
  // Extrair achados estruturados do FINAL
  // ═══════════════════════════════════════════════
  function extractFindings(finalText, host) {
    var findings = [];
    // Tenta formato estruturado (ACHADO/SEVERIDADE/EVIDÊNCIA/RISCO/CORREÇÃO)
    var blocks = finalText.split(/^---$/m).filter(function (b) { return b.trim(); });
    blocks.forEach(function (block) {
      var achado = (block.match(/ACHADO\s*:\s*(.+)/i) || [])[1];
      var sev = (block.match(/SEVERIDADE\s*:\s*(\S+)/i) || [])[1];
      var evidencia = (block.match(/EVIDÊNCIA\s*:\s*(.+)/i) || block.match(/EVIDENCIA\s*:\s*(.+)/i) || [])[1];
      var local = (block.match(/LOCAL\s*:\s*(.+)/i) || [])[1];
      var risco = (block.match(/RISCO\s*:\s*(.+)/i) || [])[1];
      var correcao = (block.match(/CORREÇÃO\s*:\s*(.+)/i) || block.match(/CORRECAO\s*:\s*(.+)/i) || [])[1];
      if (achado) {
        var sevMap = { 'CRÍTICO': 'ALTO', 'CRITICO': 'ALTO', 'ALTO': 'ALTO', 'HIGH': 'ALTO', 'CRITICAL': 'ALTO', 'MÉDIO': 'MÉDIO', 'MEDIO': 'MÉDIO', 'MEDIUM': 'MÉDIO', 'BAIXO': 'BAIXO', 'LOW': 'BAIXO', 'INFO': 'BAIXO' };
        findings.push({
          sev: sevMap[(sev || '').toUpperCase()] || 'MÉDIO',
          title: achado.trim(),
          msg: achado.trim(),
          evidence: (evidencia || '').trim(),
          location: (local || '').trim(),
          risk: (risco || '').trim(),
          fix: (correcao || '').trim(),
          phase: 'react',
        });
      }
    });

    // Fallback: formato lista simples (- [ALTO] descrição)
    if (!findings.length) {
      var lines = finalText.split('\n');
      lines.forEach(function (line) {
        var m = line.match(/\[(ALTO|MÉDIO|MEDIO|BAIXO|CRÍTICO|CRITICO|HIGH|MEDIUM|LOW|CRITICAL|INFO)\]\s*(.+)/i);
        if (m) {
          var sevMap2 = { 'ALTO': 'ALTO', 'HIGH': 'ALTO', 'CRÍTICO': 'ALTO', 'CRITICO': 'ALTO', 'CRITICAL': 'ALTO', 'MÉDIO': 'MÉDIO', 'MEDIO': 'MÉDIO', 'MEDIUM': 'MÉDIO', 'BAIXO': 'BAIXO', 'LOW': 'BAIXO', 'INFO': 'BAIXO' };
          findings.push({
            sev: sevMap2[m[1].toUpperCase()] || 'MÉDIO',
            title: m[2].trim(),
            msg: m[2].trim(),
            evidence: '',
            risk: '',
            fix: '',
            phase: 'react',
          });
        }
      });
    }
    return findings;
  }

  // ═══════════════════════════════════════════════
  // Execução de ferramentas (approval flow)
  // ═══════════════════════════════════════════════
  var approvalCache = {};

  function apiPost(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }, function () { return { status: r.status, json: null }; }); });
  }

  function runTool(command, target, timeout) {
    var body = { command: command, target: target };
    if (timeout) body.timeout = timeout;
    if (approvalCache[target]) body.approvalId = approvalCache[target];
    return apiPost('/api/tools/execute', body).then(function (r1) {
      if (r1.status === 200) return r1.json;
      var id = r1.json && r1.json.approval && r1.json.approval.id;
      if (r1.status === 403 && id) {
        return apiPost('/api/approvals/authorize-target', { target: target, approvalId: id })
          .then(function () {
            approvalCache[target] = id;
            var rb = { command: command, target: target, approvalId: id };
            if (timeout) rb.timeout = timeout;
            return apiPost('/api/tools/execute', rb);
          })
          .then(function (r3) { return r3.json || { success: false, error: 'sem resposta' }; });
      }
      return r1.json || { success: false, error: 'HTTP ' + r1.status };
    }).catch(function (e) { return { success: false, error: String((e && e.message) || e) }; });
  }

  function toolOut(res) {
    if (!res) return '(sem resposta)';
    if (res.output && String(res.output).trim()) return String(res.output).trim();
    if (res.stdout && String(res.stdout).trim()) return String(res.stdout).trim();
    if (res.error) return 'ERRO: ' + String(res.error).trim();
    return '(vazio)';
  }

  function trunc(text, max) {
    if (!text || text.length <= max) return text;
    var h = Math.floor(max / 2) - 30;
    return text.substring(0, h) + '\n\n[… ' + (text.length - max) + ' caracteres omitidos …]\n\n' + text.substring(text.length - h);
  }

  function hostOf(t) { return String(t).replace(/^https?:\/\//i, '').replace(/[\/:?#].*$/, ''); }
  function urlOf(t) { return /^https?:\/\//i.test(t) ? t : ('https://' + hostOf(t)); }

  // ═══════════════════════════════════════════════
  // LLM (Ollama direto, resposta completa)
  // ═══════════════════════════════════════════════
  function getModel() {
    try { var s = document.getElementById('t3cModel'); if (s && s.value) return s.value; } catch (e) {}
    return 'qwen2.5-coder:7b';
  }

  function llmChat(messages) {
    return fetch(OLLAMA + '/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: getModel(), messages: messages, stream: false })
    }).then(function (r) {
      if (!r.ok) throw new Error('Ollama HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      return (d.message && d.message.content) || '';
    });
  }

  // Fallback: servidor T3MP3ST (mensagem única, sem multi-turn)
  function llmFallback(messages) {
    var flat = messages.map(function (m) {
      return (m.role === 'system' ? '[SYSTEM] ' : m.role === 'user' ? '[USER] ' : '[ASSISTANT] ') + m.content;
    }).join('\n\n');
    return fetch('/api/llm/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: flat })
    }).then(function (r) { return r.json(); })
      .then(function (d) { return (d && d.response) || ''; });
  }

  function llm(messages) {
    return llmChat(messages).catch(function () { return llmFallback(messages); });
  }

  // ═══════════════════════════════════════════════
  // Enriquecimento: pede ao LLM risco + correção
  // para achados que não vieram estruturados
  // ═══════════════════════════════════════════════
  function enrichFindings(findings, host) {
    var needEnrich = findings.filter(function (f) { return !f.risk || !f.fix; });
    if (!needEnrich.length) return Promise.resolve(findings);

    var prompt = 'Para cada achado de segurança abaixo do alvo ' + host + ', forneça:\n' +
      '1. RISCO: como um atacante malicioso poderia explorar isso (1-2 frases)\n' +
      '2. CORREÇÃO: o que fazer para fechar essa brecha (1-2 frases)\n\n' +
      'Responda no formato:\n' +
      'N. RISCO: ... | CORREÇÃO: ...\n\n' +
      'Achados:\n' +
      needEnrich.map(function (f, i) { return (i + 1) + '. [' + f.sev + '] ' + f.title; }).join('\n');

    return llm([
      { role: 'system', content: 'Você é um analista de segurança. Responda conciso em PT-BR.' },
      { role: 'user', content: prompt },
    ]).then(function (resp) {
      var lines = resp.split('\n');
      var idx = 0;
      lines.forEach(function (line) {
        var m = line.match(/^\d+\.\s*RISCO\s*:\s*(.*?)\s*\|\s*CORRE[CÇ][AÃ]O\s*:\s*(.*)/i);
        if (m && idx < needEnrich.length) {
          needEnrich[idx].risk = m[1].trim();
          needEnrich[idx].fix = m[2].trim();
          idx++;
        }
      });
      return findings;
    }).catch(function () { return findings; });
  }

  // ═══════════════════════════════════════════════
  // LOOP ReAct PRINCIPAL
  // ═══════════════════════════════════════════════
  var _abort = false;

  function fullReconReact(rawTarget, step, userMessage) {
    var host = hostOf(rawTarget);
    var url = urlOf(rawTarget);
    var request = userMessage || ('Faça uma análise de segurança completa em ' + host);
    var messages = [];
    var actions = [];
    var turn = 0;
    _abort = false;

    function showStop(v) {
      try { var b = document.getElementById('t3cStop'); if (b) b.style.display = v ? '' : 'none'; } catch (e) {}
    }

    return getInstalled().then(function () {
      showStop(true);
      var tools = availTools();
      var opCount = { recon: 0, scanner: 0, explorer: 0 };
      tools.forEach(function (t) { if (opCount[t.op] !== undefined) opCount[t.op]++; });

      step('## 🤖 Coordenador OP_ADMIRALE ativado');
      step('');
      step('**Alvo autorizado:** `' + host + '`');
      step('**Operadores online:**');
      step('  🔍 RECON — ' + opCount.recon + ' ferramentas');
      step('  🎯 SCANNER — ' + opCount.scanner + ' ferramentas');
      step('  📂 EXPLORER — ' + opCount.explorer + ' ferramentas');
      step('  ⚔️ INFILTRATOR — _indisponível_');
      step('  📤 EXFILTRATOR — _indisponível_');
      step('  👻 GHOST — _indisponível_');
      step('');
      step('**Ferramentas ativas:** ' + tools.map(function (t) { return '`' + t.bin + '`'; }).join(' · '));
      step('**Modo:** ReAct (Reason + Act) · máx ' + MAX_TURNS + ' ações adaptativas');
      step('');
      step('---');
      step('');

      messages.push({ role: 'system', content: buildCoordinatorPrompt(host) });
      messages.push({ role: 'user', content: 'Alvo: ' + host + ' (' + url + ')\nPedido do operador: ' + request + '\n\nComece a operação. Use THOUGHT: e ACTION: a cada turno.' });

      function loop() {
        if (_abort) {
          step('');
          step('⏹ **Operação interrompida** pelo operador após ' + turn + ' ações.');
          _abort = false;
          showStop(false);
          return Promise.resolve({ findings: [], actions: actions, host: host, at: new Date().toISOString() });
        }

        if (turn >= MAX_TURNS) {
          step('');
          step('⚠️ Limite de **' + MAX_TURNS + ' ações** atingido.');
          messages.push({ role: 'user', content: 'Limite de ações atingido. Responda com THOUGHT: e depois FINAL: listando TODOS os achados no formato estruturado (ACHADO/SEVERIDADE/EVIDÊNCIA/RISCO/CORREÇÃO separados por ---).' });
        }

        return llm(messages).then(function (response) {
          if (!response) {
            step('❌ LLM não respondeu. Verifique se o Ollama está rodando (`ollama serve`).');
            return { findings: [], actions: actions, host: host, at: new Date().toISOString() };
          }

          messages.push({ role: 'assistant', content: response });
          var parsed = parseReact(response);

          // ── FINAL ──────────────────────────
          if (parsed.type === 'final') {
            step('');
            step('---');
            if (parsed.thought) {
              step('### 💭 Raciocínio Final do Coordenador');
              step(parsed.thought);
              step('');
            }
            step('## 📊 Relatório de Achados');
            step(parsed.answer);

            var findings = extractFindings(parsed.answer, host);
            step('');
            step('🔄 Enriquecendo achados com análise de risco e correção…');

            return enrichFindings(findings, host).then(function (enriched) {
              // Registra no Cofre de Evidências
              try {
                if (typeof window.addFinding === 'function') {
                  enriched.forEach(function (f) {
                    window.addFinding({
                      title: (f.title || f.msg || '').slice(0, 100),
                      severity: f.sev === 'ALTO' ? 'high' : f.sev === 'MÉDIO' ? 'medium' : 'low',
                      target: host,
                      category: 'react/' + f.phase,
                      evidence: f.evidence || f.msg,
                      source: 'chat-react-engine',
                      at: new Date().toISOString(),
                    });
                  });
                }
              } catch (e) {}

              step('');
              step('✅ **Operação ReAct finalizada** — ' + turn + ' ações executadas, ' + enriched.length + ' achados identificados.');
              step('');
              step('💾 ' + enriched.length + ' achados salvos no Cofre de Evidências.');

              _abort = false;
              showStop(false);
              return { findings: enriched, actions: actions, host: host, at: new Date().toISOString() };
            });
          }

          // ── ACTION ─────────────────────────
          if (parsed.type === 'action') {
            turn++;
            step('### 💭 Turno ' + turn + '/' + MAX_TURNS);
            if (parsed.thought) step(parsed.thought);
            step('');
            step('### ⚡ `' + parsed.command + '`');

            var actionRecord = {
              turn: turn,
              thought: parsed.thought,
              command: parsed.command,
              output: '',
              ts: new Date().toISOString(),
            };

            return runTool(parsed.command, host, 45000).then(function (result) {
              var output = toolOut(result);
              var truncated = trunc(output, MAX_OBS);
              actionRecord.output = output.substring(0, 5000);
              actions.push(actionRecord);

              step('```');
              step(truncated);
              step('```');
              step('');

              messages.push({
                role: 'user',
                content: 'OBSERVATION:\n' + truncated +
                  '\n\nContinue a operação. Responda com THOUGHT: + ACTION: para investigar mais, ou THOUGHT: + FINAL: com achados estruturados quando tiver evidência suficiente.'
              });

              return loop();
            });
          }

          // ── THOUGHT ONLY ───────────────────
          if (parsed.type === 'thought_only') {
            turn++;
            step('');
            step('💭 ' + parsed.thought);
            step('');
            messages.push({
              role: 'user',
              content: 'Forneça uma ACTION: com um comando shell para executar, ou FINAL: com seus achados se já terminou a operação.'
            });
            return loop();
          }

          // ── EMPTY ──────────────────────────
          turn++;
          step('⚠️ Coordenador não respondeu com formato esperado.');
          messages.push({
            role: 'user',
            content: 'Responda no formato: THOUGHT: [raciocínio] seguido de ACTION: [comando] ou FINAL: [achados].'
          });
          return loop();

        }).catch(function (e) {
          step('');
          step('❌ Erro na comunicação com o LLM: ' + (e && e.message || e));
          step('Verifique se o Ollama está rodando: `ollama serve`');
          _abort = false;
          showStop(false);
          return { findings: [], actions: actions, host: host, at: new Date().toISOString() };
        });
      }

      return loop();
    });
  }

  // ═══════════════════════════════════════════════
  // PDF ReAct — dossiê profissional com timeline
  // ═══════════════════════════════════════════════
  function buildReactPdfData(result) {
    return {
      host: result.host,
      findings: result.findings || [],
      actions: result.actions || [],
      at: result.at || new Date().toISOString(),
      engine: 'ReAct v1.0 (OP_ADMIRALE)',
      turns: (result.actions || []).length,
    };
  }

  // ═══════════════════════════════════════════════
  // Expor API pública
  // ═══════════════════════════════════════════════
  window.__t3react = {
    fullReconReact: fullReconReact,
    getInstalled: getInstalled,
    buildPdfData: buildReactPdfData,
    abort: function () { _abort = true; },
    VERSION: '1.0.0',
  };
})();
