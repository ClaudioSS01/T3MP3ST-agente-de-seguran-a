/*
 * T3MP3ST — Sistema de Conversas
 * ─────────────────────────────────
 * Adiciona ao Chat:
 *   - Sidebar de conversas anteriores
 *   - Botão "+ Nova conversa" para começar limpo
 *   - Persistência independente por conversa
 *   - Preserva TUDO que já funciona (auto-detect URL, Recon V2, botões PDF/MD)
 *
 * NÃO substitui chat-pt.js nem chat-recon-v2.js — apenas envolve a persistência
 * deles em um modelo de "conversas múltiplas".
 *
 * Storage:
 *   t3conv_list_v1  → [{id, title, updatedAt, msgCount}]
 *   t3conv_active   → id da conversa ativa
 *   t3conv_msgs_<id> → array de mensagens dessa conversa
 *
 * Migração:
 *   Se t3rv2_messages_v1 existe, migra tudo como "Conversa antiga" na 1ª execução.
 */
(function () {
  'use strict';
  if (window.__t3conv) return;

  var LS_LIST = 't3conv_list_v1';
  var LS_ACTIVE = 't3conv_active';
  var LS_MSGS_PREFIX = 't3conv_msgs_';
  var LS_LEGACY = 't3rv2_messages_v1';

  // ═══════════════════════════════════════════════
  // Storage
  // ═══════════════════════════════════════════════
  function safeParse(s, def) {
    if (s == null || s === '') return def;
    try {
      var v = JSON.parse(s);
      return v == null ? def : v;
    } catch (e) { return def; }
  }
  function loadList() { return safeParse(localStorage.getItem(LS_LIST), []); }
  function saveList(list) { try { localStorage.setItem(LS_LIST, JSON.stringify(list)); } catch (e) {} }
  function loadMsgs(id) { return safeParse(localStorage.getItem(LS_MSGS_PREFIX + id), []); }
  function saveMsgs(id, msgs) { try { localStorage.setItem(LS_MSGS_PREFIX + id, JSON.stringify(msgs)); } catch (e) {} }
  function getActiveId() { return localStorage.getItem(LS_ACTIVE); }
  function setActiveId(id) { try { localStorage.setItem(LS_ACTIVE, id); } catch (e) {} }
  function genId() { return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }

  function createConversation(title) {
    var id = genId();
    var conv = { id: id, title: title || 'Nova conversa', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), msgCount: 0 };
    var list = loadList();
    list.unshift(conv);
    saveList(list);
    setActiveId(id);
    saveMsgs(id, []);
    return conv;
  }

  function deleteConversation(id) {
    var list = loadList().filter(function (c) { return c.id !== id; });
    saveList(list);
    try { localStorage.removeItem(LS_MSGS_PREFIX + id); } catch (e) {}
    if (getActiveId() === id) {
      var next = list[0];
      if (next) setActiveId(next.id); else setActiveId('');
    }
  }

  function updateConversationMeta(id, patch) {
    var list = loadList();
    var idx = list.findIndex(function (c) { return c.id === id; });
    if (idx < 0) return;
    Object.assign(list[idx], patch, { updatedAt: new Date().toISOString() });
    // Move para o topo (mais recente primeiro)
    var conv = list.splice(idx, 1)[0];
    list.unshift(conv);
    saveList(list);
  }

  function appendMessage(id, msg) {
    var msgs = loadMsgs(id);
    msgs.push(msg);
    if (msgs.length > 200) msgs = msgs.slice(-200);
    saveMsgs(id, msgs);
    var list = loadList();
    var conv = list.find(function (c) { return c.id === id; });
    var patch = { msgCount: msgs.length };
    // Auto-título da conversa a partir da 1ª msg do usuário
    if (conv && conv.title === 'Nova conversa' && msg.role === 'user') {
      var t = String(msg.content || '').trim().replace(/\s+/g, ' ');
      if (t) patch.title = t.slice(0, 60) + (t.length > 60 ? '…' : '');
    }
    updateConversationMeta(id, patch);
  }

  function updateLastMessage(id, patch) {
    var msgs = loadMsgs(id);
    if (!msgs.length) return;
    Object.assign(msgs[msgs.length - 1], patch);
    saveMsgs(id, msgs);
  }

  // ═══════════════════════════════════════════════
  // Migração do formato antigo (t3rv2_messages_v1)
  // ═══════════════════════════════════════════════
  function migrateLegacy() {
    var legacy = safeParse(localStorage.getItem(LS_LEGACY), null);
    if (!Array.isArray(legacy) || !legacy.length) return;
    if (loadList().length > 0) return; // já migrado
    var conv = createConversation('Recons anteriores (migrado)');
    var msgs = [];
    legacy.forEach(function (m) {
      msgs.push({ role: 'user', content: m.query || m.target || '(vazio)', type: 'text', at: m.at });
      msgs.push({ role: 'assistant', content: m.acc || '', type: 'recon', result: m.result || null, at: m.at });
    });
    saveMsgs(conv.id, msgs);
    updateConversationMeta(conv.id, { msgCount: msgs.length });
    // Não removemos o legacy para não quebrar caso o usuário use versão antiga
    try { localStorage.setItem(LS_LEGACY + '_migrated', '1'); } catch (e) {}
  }

  function ensureActiveConversation() {
    var id = getActiveId();
    if (id && loadList().some(function (c) { return c.id === id; })) return id;
    var list = loadList();
    if (list.length) { setActiveId(list[0].id); return list[0].id; }
    var conv = createConversation();
    return conv.id;
  }

  // ═══════════════════════════════════════════════
  // Helpers para escape/render (compartilhados com chat-recon-v2.js quando presente)
  // ═══════════════════════════════════════════════
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderMarkdown(s) {
    return esc(s)
      .replace(/```\n?([\s\S]*?)```/g, '<pre class="t3c-code">$1</pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;color:#2fffd2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;color:#2fffd2">$1</h3>')
      .replace(/^---$/gm, '<hr style="border:0;border-top:1px solid #2a3a48;margin:8px 0">')
      .replace(/^\s{2}- (.+)$/gm, '<div style="margin-left:20px">• $1</div>')
      .replace(/^- (.+)$/gm, '<div style="margin-left:8px">• $1</div>')
      .replace(/\n/g, '<br>');
  }

  // ═══════════════════════════════════════════════
  // UI — sidebar de conversas
  // ═══════════════════════════════════════════════
  var css = document.createElement('style');
  css.id = 't3conv-styles';
  css.textContent = [
    '#t3conv-drawer{position:fixed;top:0;right:-360px;width:340px;height:100vh;background:#0e1621;border-left:1px solid #1e2a38;box-shadow:-4px 0 20px rgba(0,0,0,.5);z-index:9999;transition:right .25s ease;display:flex;flex-direction:column}',
    '#t3conv-drawer.open{right:0}',
    '#t3conv-drawer .t3cv-head{padding:14px 16px;border-bottom:1px solid #1e2a38;display:flex;align-items:center;justify-content:space-between}',
    '#t3conv-drawer .t3cv-head h3{margin:0;color:#e0ecf0;font-size:15px;font-weight:700}',
    '#t3conv-drawer .t3cv-close{background:transparent;border:none;color:#7a8a95;font-size:22px;cursor:pointer;padding:0 4px}',
    '#t3conv-drawer .t3cv-close:hover{color:#fff}',
    '#t3conv-drawer .t3cv-new{margin:12px 16px;padding:10px 12px;background:linear-gradient(135deg,#2fffd2,#00aa66);color:#08110d;border:none;border-radius:8px;font-weight:800;cursor:pointer;font-size:13px}',
    '#t3conv-drawer .t3cv-new:hover{filter:brightness(1.1)}',
    '#t3conv-drawer .t3cv-list{flex:1;overflow-y:auto;padding:4px 8px 20px}',
    '#t3conv-drawer .t3cv-item{padding:10px 12px;margin:4px 0;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;cursor:pointer;transition:all .15s}',
    '#t3conv-drawer .t3cv-item:hover{background:rgba(47,255,210,.08);border-color:rgba(47,255,210,.3)}',
    '#t3conv-drawer .t3cv-item.active{background:rgba(0,136,255,.12);border-color:rgba(0,136,255,.4)}',
    '#t3conv-drawer .t3cv-title{color:#e0ecf0;font-size:13px;font-weight:600;line-height:1.35;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#t3conv-drawer .t3cv-meta{color:#7a8a95;font-size:11px;display:flex;justify-content:space-between;align-items:center}',
    '#t3conv-drawer .t3cv-del{background:transparent;border:none;color:#ff8080;cursor:pointer;opacity:.5;padding:2px 6px;font-size:14px}',
    '#t3conv-drawer .t3cv-del:hover{opacity:1}',
    '#t3conv-drawer .t3cv-empty{padding:30px 20px;text-align:center;color:#5a7a88;font-size:12px}',
    '#t3conv-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;opacity:0;pointer-events:none;transition:opacity .2s}',
    '#t3conv-backdrop.open{opacity:1;pointer-events:auto}',
    // Botão flutuante que abre o drawer
    '.t3c-btn.t3conv-open-btn{background:rgba(47,255,210,.1);color:#2fffd2;border:1px solid rgba(47,255,210,.35)}',
  ].join('\n');
  document.head.appendChild(css);

  function buildDrawer() {
    if (document.getElementById('t3conv-drawer')) return;
    var backdrop = document.createElement('div');
    backdrop.id = 't3conv-backdrop';
    backdrop.addEventListener('click', closeDrawer);
    document.body.appendChild(backdrop);

    var d = document.createElement('div');
    d.id = 't3conv-drawer';
    d.innerHTML =
      '<div class="t3cv-head">' +
      '  <h3>💬 Conversas</h3>' +
      '  <button class="t3cv-close" title="Fechar">×</button>' +
      '</div>' +
      '<button class="t3cv-new">+ Nova conversa</button>' +
      '<div class="t3cv-list" id="t3convList"></div>';
    document.body.appendChild(d);
    d.querySelector('.t3cv-close').addEventListener('click', closeDrawer);
    d.querySelector('.t3cv-new').addEventListener('click', function () { startNewConversation(); });
  }

  function openDrawer() {
    buildDrawer();
    renderList();
    document.getElementById('t3conv-drawer').classList.add('open');
    document.getElementById('t3conv-backdrop').classList.add('open');
  }
  function closeDrawer() {
    var d = document.getElementById('t3conv-drawer');
    var b = document.getElementById('t3conv-backdrop');
    if (d) d.classList.remove('open');
    if (b) b.classList.remove('open');
  }

  function renderList() {
    var el = document.getElementById('t3convList');
    if (!el) return;
    var list = loadList();
    var activeId = getActiveId();
    if (!list.length) {
      el.innerHTML = '<div class="t3cv-empty">Nenhuma conversa ainda.<br>Clique em "+ Nova conversa" para começar.</div>';
      return;
    }
    el.innerHTML = list.map(function (c) {
      var when = new Date(c.updatedAt || c.createdAt);
      var whenStr = when.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return '<div class="t3cv-item' + (c.id === activeId ? ' active' : '') + '" data-id="' + c.id + '">' +
        '<div class="t3cv-title">' + esc(c.title || 'Sem título') + '</div>' +
        '<div class="t3cv-meta">' +
        '<span>' + whenStr + ' · ' + (c.msgCount || 0) + ' msg</span>' +
        '<button class="t3cv-del" data-del="' + c.id + '" title="Excluir">🗑</button>' +
        '</div></div>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.t3cv-item'), function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('.t3cv-del')) return;
        selectConversation(item.getAttribute('data-id'));
      });
    });
    Array.prototype.forEach.call(el.querySelectorAll('.t3cv-del'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-del');
        if (!confirm('Excluir esta conversa?')) return;
        deleteConversation(id);
        renderList();
        loadConversationToChat(getActiveId());
      });
    });
  }

  // ═══════════════════════════════════════════════
  // Sync com o chat: renderizar mensagens da conversa ativa
  // ═══════════════════════════════════════════════
  function clearChatDOM() {
    var msgs = document.getElementById('t3cMsgs');
    if (!msgs) return;
    // Remove tudo, incluindo bolhas antigas E o welcome (chips) — o chat-pt.js re-renderiza vazio ao próximo render
    msgs.innerHTML = '';
  }

  function loadConversationToChat(id) {
    if (!id) return;
    var msgs = document.getElementById('t3cMsgs');
    if (!msgs) return;
    clearChatDOM();
    var stored = loadMsgs(id);
    if (!stored.length) {
      // Deixa o chat-pt.js mostrar o welcome (chips) — dispara renderMsgs se disponível
      msgs.innerHTML = '';
      // Força chat-pt.js a renderizar o welcome tentando limpar o history dele
      try {
        // Chat-pt.js encapsula history em closure — não temos acesso.
        // Alternativa: mostrar manualmente uma msg de boas-vindas
        msgs.innerHTML = '<div class="t3c-empty" style="margin:auto;text-align:center;color:#5a7a88;font-size:13px;max-width:460px;line-height:1.6">💬 Conversa nova. Digite uma URL para recon automático, ou faça qualquer pergunta ao Comandante.</div>';
      } catch (e) {}
      return;
    }
    stored.forEach(function (m) { renderMsgToDOM(msgs, m); });
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderMsgToDOM(msgs, m) {
    var el = document.createElement('div');
    el.className = 't3c-msg ' + (m.role === 'user' ? 'user' : 'bot');
    el.setAttribute('data-t3conv-msg', '1');
    var avatar = m.role === 'user' ? '🧑‍💻' : '🎖️';
    var bubbleContent;
    if (m.type === 'recon') {
      bubbleContent = renderMarkdown(m.content || '');
    } else {
      bubbleContent = renderMarkdown(m.content || '');
    }
    var bubbleId = 't3conv_b_' + Math.random().toString(36).slice(2, 8);
    el.innerHTML = '<div class="t3c-av">' + avatar + '</div><div class="t3c-bubble" id="' + bubbleId + '">' + bubbleContent + '</div>';
    msgs.appendChild(el);
    // Se for recon com resultado, renderiza botões PDF/MD/Copiar
    if (m.type === 'recon' && m.result && window.__t3reconV2 && window.__t3reconV2.appendDownloadButtons) {
      var b = document.getElementById(bubbleId);
      if (b) window.__t3reconV2.appendDownloadButtons(b, m.result);
    }
  }

  function selectConversation(id) {
    setActiveId(id);
    loadConversationToChat(id);
    renderList();
    closeDrawer();
  }

  function startNewConversation() {
    var conv = createConversation();
    setActiveId(conv.id);
    loadConversationToChat(conv.id);
    renderList();
    closeDrawer();
  }

  // ═══════════════════════════════════════════════
  // Hook: capturar mensagens do chat (recon E chat geral)
  // ═══════════════════════════════════════════════
  function hookMessagePersistence() {
    // O chat-recon-v2.js já dispara addMessage internamente pra localStorage antigo.
    // Vamos oferecer uma API global que ele possa usar.
    window.__t3conv = {
      activeId: function () { return ensureActiveConversation(); },
      appendMessage: function (msg) {
        var id = ensureActiveConversation();
        appendMessage(id, msg);
      },
      updateLastMessage: function (patch) {
        var id = ensureActiveConversation();
        updateLastMessage(id, patch);
      },
      openDrawer: openDrawer,
      newConversation: startNewConversation,
      loadActive: function () {
        var id = ensureActiveConversation();
        loadConversationToChat(id);
      },
      renderMarkdown: renderMarkdown,
    };
  }

  // ═══════════════════════════════════════════════
  // Interceptor de mensagens de CHAT GERAL (não-recon)
  // Quando o chat-pt.js envia via /api/llm/chat ou Ollama direto, capturamos
  // via MutationObserver nas bolhas de #t3cMsgs
  // ═══════════════════════════════════════════════
  function installChatObserver() {
    var msgs = document.getElementById('t3cMsgs');
    if (!msgs) { setTimeout(installChatObserver, 500); return; }
    var lastCount = 0;
    var pendingBubble = null;
    var pendingUserText = null;
    new MutationObserver(function () {
      var bubbles = msgs.querySelectorAll('.t3c-msg');
      // Detecta nova mensagem de usuário/bot que não seja marcada como recon-v2
      Array.prototype.forEach.call(bubbles, function (b) {
        if (b.getAttribute('data-t3conv-processed') || b.getAttribute('data-t3rv2-msg') || b.getAttribute('data-t3conv-msg')) return;
        var isUser = b.classList.contains('user');
        var bubble = b.querySelector('.t3c-bubble');
        if (!bubble) return;
        var text = bubble.textContent || '';
        // Se é bot com "..." significa que está streamando — espera terminar
        if (!isUser && text.trim() === '…') return;
        b.setAttribute('data-t3conv-processed', '1');
        try {
          window.__t3conv.appendMessage({
            role: isUser ? 'user' : 'assistant',
            content: text,
            type: 'chat',
            at: new Date().toISOString(),
          });
        } catch (e) {}
      });
    }).observe(msgs, { childList: true, subtree: true, characterData: true });
  }

  // ═══════════════════════════════════════════════
  // Injeta botão "💬 Conversas" no header do chat
  // ═══════════════════════════════════════════════
  function injectConversationsButton() {
    var bar = document.querySelector('#page-chat .t3c-bar');
    if (!bar || bar.querySelector('#t3convOpenBtn')) return;
    var btn = document.createElement('button');
    btn.className = 't3c-btn t3conv-open-btn';
    btn.id = 't3convOpenBtn';
    btn.title = 'Histórico de conversas · Nova conversa';
    btn.textContent = '💬 Conversas';
    btn.addEventListener('click', openDrawer);
    // Insere no início (antes do dropdown de modelo)
    if (bar.firstChild) bar.insertBefore(btn, bar.firstChild);
    else bar.appendChild(btn);
  }

  // ═══════════════════════════════════════════════
  // Boot — polling contínuo garante que botão apareça mesmo se chat-pt.js
  // demorar a montar OU se algo remover o botão
  // ═══════════════════════════════════════════════
  var observerInstalled = false;
  function ensureUiPresent() {
    var bar = document.querySelector('#page-chat .t3c-bar');
    var msgs = document.getElementById('t3cMsgs');
    if (!bar || !msgs) return false;
    // Injeta botão se não existe
    if (!bar.querySelector('#t3convOpenBtn')) {
      injectConversationsButton();
    }
    // Observer só uma vez
    if (!observerInstalled) {
      installChatObserver();
      observerInstalled = true;
    }
    return true;
  }

  // ═══════════════════════════════════════════════
  // Chat como aba padrão no boot inicial (apenas uma vez)
  // ═══════════════════════════════════════════════
  var didInitialNav = false;
  function navigateToChatOnBoot() {
    if (didInitialNav) return;
    var chatNav = document.querySelector('.nav-item[data-page="chat"]');
    var chatPage = document.getElementById('page-chat');
    if (!chatNav || !chatPage) return;
    // Preferência 1: __t3chat.open() (do chat-pt.js) — atualiza título E marca ativa
    if (window.__t3chat && typeof window.__t3chat.open === 'function') {
      try { window.__t3chat.open(); didInitialNav = true; return; } catch (e) {}
    }
    // Preferência 2: window.navigateTo do app original
    if (typeof window.navigateTo === 'function') {
      try {
        window.navigateTo('chat');
        var t = document.getElementById('pageTitle'); if (t) t.textContent = 'Chat';
        didInitialNav = true; return;
      } catch (e) {}
    }
    // Fallback 3: click programático + atualizar título
    try {
      chatNav.click();
      var t2 = document.getElementById('pageTitle'); if (t2) t2.textContent = 'Chat';
      didInitialNav = true;
    } catch (e) {}
  }

  function boot() {
    hookMessagePersistence();
    migrateLegacy();
    // Polling agressivo: tenta a cada 500ms por 60s
    var tries = 0;
    var interval = setInterval(function () {
      tries++;
      var ok = ensureUiPresent();
      if (ok) {
        // Se já tem conversas, garante que ativa exista
        var list = loadList();
        if (list.length) ensureActiveConversation();
        // Navega para Chat no primeiro boot (só uma vez)
        navigateToChatOnBoot();
      }
      if (tries > 120) clearInterval(interval); // 60s cap
    }, 500);
    // Tenta imediato também
    ensureUiPresent();
    navigateToChatOnBoot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 300); });
  else setTimeout(boot, 300);
})();
