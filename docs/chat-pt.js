/*
 * T3MP3ST — Aba "Chat" (agente-chefe + gestão de modelos)
 * ───────────────────────────────────────────────────────
 * Não-invasivo: adiciona uma nova aba "Chat" acima de "Sala de Guerra".
 * Conversa em linguagem natural com o agente coordenador (LLM local),
 * lista/troca/baixa modelos do Ollama. 100% reversível (remova o <script>).
 *
 * Arquitetura: fala DIRETO com o Ollama (127.0.0.1:11434) para chat/modelos/pull.
 * Se o Ollama bloquear por CORS ou não responder, cai para os endpoints do
 * próprio servidor T3MP3ST (mesma origem): /api/llm/chat e /api/models.
 */
(function () {
  'use strict';
  if (window.__t3chat) return;

  var OLLAMA = 'http://127.0.0.1:11434';
  var history = [];           // [{role, content}]
  var currentModel = 'qwen2.5-coder:7b';
  var busy = false;
  var ollamaOk = null;        // null=desconhecido, true/false após teste

  var SYSTEM_PROMPT =
    'Você é o COMANDANTE — o agente-chefe do T3MP3ST, uma bancada de segurança ofensiva autorizada. ' +
    'Você conversa em português, de forma clara e direta, com o operador (Claudio). ' +
    'Você coordena uma equipe de agentes especialistas: Recon (OSINT/descoberta), Scanner (vulnerabilidades), ' +
    'Exploiter (exploração), Infiltrator (movimento lateral), Exfiltrator (dados), Ghost (persistência), ' +
    'Coordinator (orquestração) e Analyst (relatórios). ' +
    'Quando o operador pedir uma ação prática (escanear um alvo, caçar vulnerabilidades), explique o plano em passos ' +
    'e diga exatamente qual especialista e qual ferramenta usar, e se possível já forneça o comando de terminal pronto. ' +
    'Só trabalhe sobre alvos autorizados. Nunca invente resultados: se não rodou uma ferramenta, deixe claro que é uma sugestão a validar. ' +
    'Seja conciso.';

  // ═══════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════
  var css = document.createElement('style');
  css.textContent = [
    '#page-chat .t3c-wrap{display:flex;flex-direction:column;height:calc(100vh - 160px);min-height:420px}',
    '#page-chat .t3c-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:var(--bg-secondary,#0e1621);border:1px solid var(--border-color,#1e2a38);border-radius:10px;margin-bottom:10px}',
    '#page-chat .t3c-bar select,#page-chat .t3c-bar input{padding:7px 10px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#d8e4ea;font-size:12.5px}',
    '#page-chat .t3c-bar label{font-size:11px;color:#7a8a95;text-transform:uppercase;letter-spacing:.5px}',
    '#page-chat .t3c-btn{padding:7px 12px;border-radius:7px;background:rgba(47,255,210,.1);border:1px solid rgba(47,255,210,.35);color:#2fffd2;font-size:12px;font-weight:700;cursor:pointer}',
    '#page-chat .t3c-btn:hover{background:rgba(47,255,210,.2)}',
    '#page-chat .t3c-btn[disabled]{opacity:.4;cursor:default}',
    '#page-chat .t3c-status{font-size:11px;color:#7a8a95;margin-left:auto}',
    '#page-chat .t3c-status .on{color:#00ff88}',
    '#page-chat .t3c-status .off{color:#ff6666}',
    '#page-chat .t3c-msgs{flex:1;overflow-y:auto;padding:14px;background:rgba(0,0,0,.18);border:1px solid var(--border-color,#1e2a38);border-radius:10px;display:flex;flex-direction:column;gap:12px}',
    '#page-chat .t3c-msg{display:flex;gap:10px;max-width:88%}',
    '#page-chat .t3c-msg.user{align-self:flex-end;flex-direction:row-reverse}',
    '#page-chat .t3c-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;background:rgba(255,255,255,.05)}',
    '#page-chat .t3c-msg.user .t3c-av{background:rgba(0,136,255,.15)}',
    '#page-chat .t3c-msg.bot .t3c-av{background:rgba(47,255,210,.12)}',
    '#page-chat .t3c-bubble{padding:10px 13px;border-radius:12px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#e0ecf0}',
    '#page-chat .t3c-msg.user .t3c-bubble{background:rgba(0,136,255,.12);border:1px solid rgba(0,136,255,.25)}',
    '#page-chat .t3c-msg.bot .t3c-bubble{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}',
    '#page-chat .t3c-bubble code{background:rgba(0,0,0,.4);padding:1px 5px;border-radius:4px;font-size:12px;color:#8ee8c8}',
    '#page-chat .t3c-empty{margin:auto;text-align:center;color:#5a7a88;font-size:13px;max-width:460px;line-height:1.6}',
    '#page-chat .t3c-input{display:flex;gap:8px;margin-top:10px}',
    '#page-chat .t3c-input textarea{flex:1;resize:none;min-height:48px;max-height:160px;padding:11px 13px;background:var(--bg-secondary,#0e1621);border:1px solid var(--border-color,#1e2a38);border-radius:10px;color:#e0ecf0;font-size:13.5px;font-family:inherit}',
    '#page-chat .t3c-send{padding:0 20px;border-radius:10px;background:linear-gradient(135deg,#2fffd2,#00aa66);border:none;color:#08110d;font-weight:800;cursor:pointer;font-size:14px}',
    '#page-chat .t3c-send[disabled]{opacity:.5;cursor:default}',
    '#page-chat .t3c-pull{font-size:11px;color:#8a99a5;margin-top:6px}',
    '#page-chat .t3c-chip{display:inline-block;margin:4px 4px 0 0;padding:5px 10px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#a8c0cc;font-size:12px;cursor:pointer}',
    '#page-chat .t3c-chip:hover{border-color:#2fffd2;color:#2fffd2}',
    '#page-chat .nav-item .t3c-navbadge{font-size:8px}',
  ].join('\n');
  document.head.appendChild(css);

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // markdown mínimo: `code` e **negrito**
  function fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // ═══════════════════════════════════════════════
  // Injeção da aba (nav) + página
  // ═══════════════════════════════════════════════
  function injectNav() {
    if (document.querySelector('.nav-item[data-page="chat"]')) return true;
    var warroom = document.querySelector('.nav-item[data-page="warroom"]');
    if (!warroom || !warroom.parentNode) return false;
    var item = document.createElement('div');
    item.className = 'nav-item';
    item.setAttribute('data-page', 'chat');
    item.innerHTML = '<span class="icon">💬</span> Chat';
    item.addEventListener('click', function () { goChat(); });
    warroom.parentNode.insertBefore(item, warroom);
    return true;
  }

  function injectPage() {
    if (document.getElementById('page-chat')) return true;
    var wr = document.getElementById('page-warroom');
    if (!wr || !wr.parentNode) return false;
    var page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-chat';
    page.innerHTML =
      '<div class="t3c-wrap">' +
      '  <div class="t3c-bar">' +
      '    <label>Modelo</label>' +
      '    <select id="t3cModel"><option>' + esc(currentModel) + '</option></select>' +
      '    <button class="t3c-btn" id="t3cRefresh" title="Atualizar lista de modelos">↻</button>' +
      '    <input id="t3cPull" type="text" placeholder="baixar modelo (ex: llama3.1:8b)" style="width:190px">' +
      '    <button class="t3c-btn" id="t3cPullBtn">⬇ Baixar</button>' +
      '    <button class="t3c-btn" id="t3cClear" title="Limpar conversa">🗑</button>' +
      '    <span class="t3c-status" id="t3cStatus">verificando…</span>' +
      '  </div>' +
      '  <div class="t3c-pull" id="t3cPullMsg"></div>' +
      '  <div class="t3c-msgs" id="t3cMsgs"></div>' +
      '  <div class="t3c-input">' +
      '    <textarea id="t3cInput" placeholder="Fale com o Comandante… ex: \'Faça um recon em scanme.nmap.org e me diga o que achar\'"></textarea>' +
      '    <button class="t3c-send" id="t3cSend">Enviar</button>' +
      '  </div>' +
      '</div>';
    wr.parentNode.appendChild(page);

    document.getElementById('t3cSend').addEventListener('click', send);
    document.getElementById('t3cInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.getElementById('t3cModel').addEventListener('change', function () { currentModel = this.value; });
    document.getElementById('t3cRefresh').addEventListener('click', loadModels);
    document.getElementById('t3cPullBtn').addEventListener('click', pullModel);
    document.getElementById('t3cClear').addEventListener('click', function () {
      history = []; renderMsgs();
    });
    renderMsgs();
    return true;
  }

  function goChat() {
    if (typeof window.navigateTo === 'function') window.navigateTo('chat');
    else {
      document.querySelectorAll('.nav-item').forEach(function (i) { i.classList.toggle('active', i.getAttribute('data-page') === 'chat'); });
      document.querySelectorAll('.page').forEach(function (p) { p.classList.toggle('active', p.id === 'page-chat'); });
    }
    var t = document.getElementById('pageTitle'); if (t) t.textContent = 'Chat';
    var inp = document.getElementById('t3cInput'); if (inp) setTimeout(function () { inp.focus(); }, 60);
  }

  // ═══════════════════════════════════════════════
  // Conexão / status
  // ═══════════════════════════════════════════════
  function setStatus(html) { var s = document.getElementById('t3cStatus'); if (s) s.innerHTML = html; }

  function checkOllama() {
    return fetch(OLLAMA + '/api/tags', { method: 'GET' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function () { ollamaOk = true; return true; })
      .catch(function () { ollamaOk = false; return false; });
  }

  function loadModels() {
    var sel = document.getElementById('t3cModel');
    if (!sel) return;
    // 1) tenta Ollama direto
    fetch(OLLAMA + '/api/tags')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        ollamaOk = true;
        var models = (d.models || []).map(function (m) { return m.name; });
        fillModels(models);
        setStatus('<span class="on">●</span> Ollama conectado · ' + models.length + ' modelo(s)');
      })
      .catch(function () {
        // 2) fallback: endpoint do servidor
        fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'local' }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var models = (d.models || []).map(function (m) { return m.id || m.name; }).filter(Boolean);
            fillModels(models);
            ollamaOk = false;
            setStatus('<span class="off">●</span> via servidor (Ollama sem CORS) · ' + models.length + ' modelo(s)');
          })
          .catch(function () {
            ollamaOk = false;
            setStatus('<span class="off">●</span> LLM indisponível — inicie o Ollama');
          });
      });
  }

  function fillModels(models) {
    var sel = document.getElementById('t3cModel');
    if (!sel || !models || !models.length) return;
    if (models.indexOf(currentModel) === -1) models.unshift(currentModel);
    sel.innerHTML = models.map(function (m) { return '<option' + (m === currentModel ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('');
  }

  // ═══════════════════════════════════════════════
  // Baixar modelo (Ollama /api/pull, streaming NDJSON)
  // ═══════════════════════════════════════════════
  function pullModel() {
    var inp = document.getElementById('t3cPull');
    var name = (inp.value || '').trim();
    var msg = document.getElementById('t3cPullMsg');
    if (!name) return;
    if (ollamaOk === false) {
      msg.innerHTML = '⚠️ Ollama sem acesso direto do navegador. Rode no terminal: <code>ollama pull ' + esc(name) + '</code>';
      return;
    }
    msg.textContent = '⬇ Baixando ' + name + '… (pode demorar)';
    fetch(OLLAMA + '/api/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, stream: true }) })
      .then(function (r) {
        if (!r.ok || !r.body) throw 0;
        var reader = r.body.getReader();
        var dec = new TextDecoder();
        var buf = '';
        function pump() {
          return reader.read().then(function (res) {
            if (res.done) {
              msg.innerHTML = '✅ <code>' + esc(name) + '</code> baixado. Clique em ↻ para atualizar a lista.';
              loadModels();
              return;
            }
            buf += dec.decode(res.value, { stream: true });
            var lines = buf.split('\n'); buf = lines.pop();
            for (var i = 0; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              try {
                var o = JSON.parse(lines[i]);
                if (o.total && o.completed) {
                  var pct = Math.round(o.completed / o.total * 100);
                  msg.textContent = '⬇ ' + name + ' — ' + (o.status || '') + ' ' + pct + '%';
                } else if (o.status) {
                  msg.textContent = '⬇ ' + name + ' — ' + o.status;
                }
              } catch (e) {}
            }
            return pump();
          });
        }
        return pump();
      })
      .catch(function () {
        msg.innerHTML = '❌ Falha ao baixar pelo navegador. Rode no terminal: <code>ollama pull ' + esc(name) + '</code>';
      });
  }

  // ═══════════════════════════════════════════════
  // Chat
  // ═══════════════════════════════════════════════
  function renderMsgs() {
    var box = document.getElementById('t3cMsgs');
    if (!box) return;
    if (!history.length) {
      box.innerHTML =
        '<div class="t3c-empty">👋 Fale com o <strong>Comandante</strong> — o agente-chefe que coordena os especialistas.<br><br>' +
        'Exemplos:' +
        '<div><span class="t3c-chip" data-ex="Explique em 3 passos como você faria um pentest no meu site autorizado.">Como fazer um pentest</span>' +
        '<span class="t3c-chip" data-ex="Quais especialistas e ferramentas você usaria para testar OWASP Top 10 numa API?">Testar uma API</span>' +
        '<span class="t3c-chip" data-ex="Me dê o comando de terminal para escanear as portas de scanme.nmap.org.">Comando de scan</span></div></div>';
      Array.prototype.forEach.call(box.querySelectorAll('.t3c-chip'), function (c) {
        c.addEventListener('click', function () {
          var inp = document.getElementById('t3cInput'); inp.value = c.getAttribute('data-ex'); inp.focus();
        });
      });
      return;
    }
    box.innerHTML = history.map(function (m) {
      var isUser = m.role === 'user';
      return '<div class="t3c-msg ' + (isUser ? 'user' : 'bot') + '">' +
        '<div class="t3c-av">' + (isUser ? '🧑‍💻' : '🎖️') + '</div>' +
        '<div class="t3c-bubble">' + fmt(m.content) + '</div></div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function send() {
    if (busy) return;
    var inp = document.getElementById('t3cInput');
    var text = (inp.value || '').trim();
    if (!text) return;
    inp.value = '';
    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: '…' });
    renderMsgs();
    busy = true;
    var sendBtn = document.getElementById('t3cSend'); if (sendBtn) sendBtn.disabled = true;

    var msgs = [{ role: 'system', content: SYSTEM_PROMPT }].concat(
      history.filter(function (m) { return m.content !== '…'; })
    );

    if (ollamaOk !== false) streamOllama(msgs); else serverChat(text);
  }

  function finish() {
    busy = false;
    var sendBtn = document.getElementById('t3cSend'); if (sendBtn) sendBtn.disabled = false;
    renderMsgs();
  }
  function setLast(content) { history[history.length - 1].content = content; renderMsgs(); }

  // Ollama streaming
  function streamOllama(msgs) {
    fetch(OLLAMA + '/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: currentModel, messages: msgs, stream: true })
    }).then(function (r) {
      if (!r.ok || !r.body) throw 0;
      ollamaOk = true;
      var reader = r.body.getReader();
      var dec = new TextDecoder();
      var buf = '', acc = '';
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) { if (!acc) setLast('(sem resposta)'); finish(); return; }
          buf += dec.decode(res.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            try { var o = JSON.parse(lines[i]); if (o.message && o.message.content) { acc += o.message.content; setLast(acc); } } catch (e) {}
          }
          return pump();
        });
      }
      return pump();
    }).catch(function () {
      // fallback para o servidor
      ollamaOk = false;
      var lastUser = '';
      for (var i = history.length - 1; i >= 0; i--) { if (history[i].role === 'user') { lastUser = history[i].content; break; } }
      serverChat(lastUser);
    });
  }

  // Fallback: /api/llm/chat (1 turno, modelo do servidor)
  function serverChat(text) {
    setLast('…');
    fetch('/api/llm/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, systemPrompt: SYSTEM_PROMPT })
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.response) setLast(String(d.response));
        else setLast('⚠️ ' + ((d && d.error) ? d.error : 'Sem resposta do LLM. Verifique se o Ollama está rodando.'));
        finish();
      })
      .catch(function () { setLast('❌ Erro ao falar com o LLM. Inicie o Ollama (`ollama serve`).'); finish(); });
  }

  // ═══════════════════════════════════════════════
  // Boot
  // ═══════════════════════════════════════════════
  function boot() {
    var navOk = injectNav();
    var pageOk = injectPage();
    if (navOk && pageOk) {
      checkOllama().then(loadModels);
    } else {
      setTimeout(boot, 500); // nav do app pode ainda não existir
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  else setTimeout(boot, 400);

  window.__t3chat = { open: goChat, reload: loadModels };
})();
