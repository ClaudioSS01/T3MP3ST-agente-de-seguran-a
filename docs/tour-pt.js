/*
 * T3MP3ST — Sistema de Tour Guiado em Português
 * ──────────────────────────────────────────────
 * Self-contained (sem dependência de CDN). Funciona 100% offline.
 *
 * Features:
 *  - Tour detalhado POR PÁGINA com explicação de cada componente
 *  - Botão flutuante ? (z-index máximo, sempre visível)
 *  - Auto-exibição na 1ª visita a cada tela (salva em localStorage)
 *  - TTS (Text-to-Speech) com toggle 🔊/🔇, lê cada card ao avançar
 *  - Preferência de TTS salva em localStorage
 *  - Spotlight com recorte no elemento-alvo
 *  - Teclas: → próximo, ← anterior, Esc fechar
 */
(function () {
  'use strict';
  if (window.__t3tour) return;

  // ═══════════════════════════════════════════════
  // CSS
  // ═══════════════════════════════════════════════
  var css = document.createElement('style');
  css.textContent = [
    '#t3TourOverlay{position:fixed;inset:0;z-index:200000;display:none;transition:opacity .25s}',
    '#t3TourOverlay.active{display:block}',
    '#t3TourOverlay .t3t-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72)}',
    '#t3TourSpotlight{position:fixed;z-index:200001;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,.72),0 0 24px 4px rgba(47,255,210,.18);transition:all .3s ease;pointer-events:none}',
    '#t3TourCard{position:fixed;z-index:200002;width:380px;max-width:calc(100vw - 24px);background:linear-gradient(135deg,#0c1117 0%,#111820 100%);border:1px solid rgba(47,255,210,.35);border-radius:12px;padding:0;box-shadow:0 12px 48px rgba(0,0,0,.85),0 0 24px rgba(47,255,210,.1);font-family:"Segoe UI","Inter",system-ui,sans-serif;color:#e0ecf0}',
    '#t3TourCard .t3t-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 10px;border-bottom:1px solid rgba(255,255,255,.06)}',
    '#t3TourCard .t3t-step{font-size:11px;color:#2fffd2;font-weight:700;letter-spacing:1px;text-transform:uppercase}',
    '#t3TourCard .t3t-tts-btn{background:none;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:16px;line-height:1;transition:border-color .2s}',
    '#t3TourCard .t3t-tts-btn:hover{border-color:rgba(47,255,210,.5)}',
    '#t3TourCard .t3t-title{font-size:17px;font-weight:800;padding:12px 18px 6px;color:#fff;line-height:1.3}',
    '#t3TourCard .t3t-body{font-size:13.5px;line-height:1.65;padding:4px 18px 14px;color:#b0c8d4}',
    '#t3TourCard .t3t-dots{display:flex;gap:5px;padding:0 18px 10px;flex-wrap:wrap}',
    '#t3TourCard .t3t-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);transition:all .2s;cursor:pointer}',
    '#t3TourCard .t3t-dot.done{background:rgba(47,255,210,.35)}',
    '#t3TourCard .t3t-dot.current{background:#2fffd2;transform:scale(1.5)}',
    '#t3TourCard .t3t-controls{display:flex;align-items:center;justify-content:space-between;padding:10px 18px 14px;border-top:1px solid rgba(255,255,255,.06)}',
    '#t3TourCard .t3t-btn{padding:7px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:none;color:#c0d0da;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}',
    '#t3TourCard .t3t-btn:hover{border-color:#2fffd2;color:#fff}',
    '#t3TourCard .t3t-btn.primary{background:#2fffd2;color:#0a1210;border-color:#2fffd2}',
    '#t3TourCard .t3t-btn.primary:hover{background:#fff}',
    '#t3TourCard .t3t-skip{background:none;border:none;color:#5a6a72;cursor:pointer;font-size:12px;text-decoration:underline}',
    '#t3TourCard .t3t-skip:hover{color:#9ab0b8}',
    '#t3TourCard .t3t-arrow{position:absolute;width:12px;height:12px;background:#0c1117;border:1px solid rgba(47,255,210,.35);transform:rotate(45deg)}',
    '#t3TourHelpBtn{position:fixed;z-index:200010;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2fffd2,#00aa66);border:2px solid rgba(47,255,210,.5);color:#0a1210;font-size:24px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(47,255,210,.3),0 0 40px rgba(47,255,210,.1);transition:transform .2s,box-shadow .2s;font-family:system-ui,sans-serif}',
    '#t3TourHelpBtn:hover{transform:scale(1.12);box-shadow:0 6px 28px rgba(47,255,210,.45)}',
    '@media(max-width:500px){#t3TourCard{width:calc(100vw - 16px)}}',
  ].join('\n');
  document.head.appendChild(css);

  // ═══════════════════════════════════════════════
  // DOM
  // ═══════════════════════════════════════════════
  var overlay = document.createElement('div');
  overlay.id = 't3TourOverlay';
  overlay.innerHTML = '<div class="t3t-backdrop"></div>';
  document.body.appendChild(overlay);

  var spotlight = document.createElement('div');
  spotlight.id = 't3TourSpotlight';
  document.body.appendChild(spotlight);

  var card = document.createElement('div');
  card.id = 't3TourCard';
  card.style.display = 'none';
  card.innerHTML = [
    '<div class="t3t-arrow" id="t3tArrow"></div>',
    '<div class="t3t-header">',
    '  <span class="t3t-step" id="t3tStep"></span>',
    '  <button class="t3t-tts-btn" id="t3tTtsBtn" title="Ativar/desativar leitura em voz"></button>',
    '</div>',
    '<div class="t3t-title" id="t3tTitle"></div>',
    '<div class="t3t-body" id="t3tBody"></div>',
    '<div class="t3t-dots" id="t3tDots"></div>',
    '<div class="t3t-controls">',
    '  <button class="t3t-btn" id="t3tPrev">← Anterior</button>',
    '  <button class="t3t-skip" id="t3tSkip">Pular tour</button>',
    '  <button class="t3t-btn primary" id="t3tNext">Próximo →</button>',
    '</div>',
  ].join('');
  document.body.appendChild(card);

  var helpBtn = document.createElement('button');
  helpBtn.id = 't3TourHelpBtn';
  helpBtn.type = 'button';
  helpBtn.title = 'Ajuda — ver o tour desta tela';
  helpBtn.setAttribute('aria-label', 'Tour guiado');
  helpBtn.textContent = '?';
  document.body.appendChild(helpBtn);

  var elStep = card.querySelector('#t3tStep');
  var elTitle = card.querySelector('#t3tTitle');
  var elBody = card.querySelector('#t3tBody');
  var elDots = card.querySelector('#t3tDots');
  var elPrev = card.querySelector('#t3tPrev');
  var elNext = card.querySelector('#t3tNext');
  var elSkip = card.querySelector('#t3tSkip');
  var elTts = card.querySelector('#t3tTtsBtn');
  var elArrow = card.querySelector('#t3tArrow');

  // ═══════════════════════════════════════════════
  // TTS
  // ═══════════════════════════════════════════════
  var ttsEnabled = localStorage.getItem('t3mp_tour_tts') !== 'off';
  function updateTtsBtn() { elTts.textContent = ttsEnabled ? '🔊' : '🔇'; }
  updateTtsBtn();

  function speak(text) {
    if (!ttsEnabled) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1;
    u.pitch = 1;
    var voices = window.speechSynthesis.getVoices();
    var ptVoice = voices.find(function (v) { return v.lang && v.lang.startsWith('pt'); });
    if (ptVoice) u.voice = ptVoice;
    window.speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  elTts.addEventListener('click', function () {
    ttsEnabled = !ttsEnabled;
    localStorage.setItem('t3mp_tour_tts', ttsEnabled ? 'on' : 'off');
    updateTtsBtn();
    if (!ttsEnabled) stopSpeaking();
    else if (active && steps[idx]) speak(steps[idx].title + '. ' + steps[idx].desc);
  });

  // ═══════════════════════════════════════════════
  // TOUR DEFINITIONS PER PAGE
  // ═══════════════════════════════════════════════
  var TOURS = {};

  TOURS['warroom'] = [
    { el: null, title: '⚔️ Bem-vindo à Sala de Guerra',
      desc: 'Esta é a tela principal do T3MP3ST. Aqui você configura, lança e monitora suas missões de segurança ofensiva. Vou te mostrar cada parte.' },
    { el: '#systemStatusBar', title: '📊 Status do Sistema',
      desc: 'Mostra o estado atual de cada componente: Backend (se o servidor está rodando), Espinha Dorsal de IA (qual modelo de LLM está ativo — ex: qwen2.5-coder via Ollama), e Agentes Locais (se algum agente como Claude Code está conectado). Se tudo estiver verde, o sistema está pronto.' },
    { el: '#heroHuntTarget', title: '🎯 Campo de Alvo',
      desc: 'Digite aqui o alvo que você quer testar. Pode ser: um repositório GitHub (ex: github.com/empresa/repo), um pacote npm/pypi, um domínio, ou um IP. Depois pressione Enter ou clique em HUNT.' },
    { el: '#heroAutonomousMode', title: '🤖 Modo Autônomo',
      desc: 'Quando marcado, o T3MP3ST executa toda a caçada sem pedir aprovação em cada passo. O recon roda ao vivo com ferramentas reais. Cada passo é registrado com recibo. Útil quando você quer deixar o sistema trabalhar sozinho.' },
    { el: '#cmdStartBtn', title: '▶ Botão ENGAJAR',
      desc: 'Clique aqui (ou pressione Enter/Ctrl+Enter) para lançar a missão depois de definir um alvo. O sistema inicia a análise de segurança com o provedor de IA configurado.' },
    { el: '#cmdAbortBtn', title: '✕ Abortar Missão',
      desc: 'Cancela a missão em andamento imediatamente. Use quando algo deu errado ou você quer recomeçar com outros parâmetros. Atalho: tecla Esc.' },
    { el: '#sysEventTerminal', title: '📺 Terminal de Eventos do Sistema',
      desc: 'Aqui aparecem em tempo real TODOS os eventos que o backend está processando: chamadas de ferramentas, respostas da IA, fases da kill chain, erros. É o "log ao vivo" da operação. Botão ⏸ pausa o stream, CLR limpa.' },
    { el: '#operatorDesignLab', title: '🧠 Camada de Clareza do Operador',
      desc: 'Mostra 3 painéis essenciais: (1) Caixa do Operador — tarefas pendentes e decisões do agente, (2) Gate Snapshot — estado atual das travas de segurança, (3) Estado da Prova — nível de evidência coletada. Atualiza em tempo real durante a missão.' },
    { el: '#missionCockpit', title: '📋 Espinha da Missão',
      desc: 'Seção colapsável com 6 subpainéis: Flight Recorder (gravação de tudo), Bancada de Evidências, Quadro de Ordens, Entrada de Alvos, Campo de Treino, e Recibos de Escopo. Clique "Expandir" para ver. "Bundle" exporta tudo.' },
    { el: '#plinyCodeOpsLayer', title: '⚙️ Camada de Operações',
      desc: 'Seção avançada com todas as ferramentas operacionais: aprovações de ferramentas, pulso da caçada, cognição do enxame, inícios guiados, preflight de capacidade, forja de adaptadores, registro de evidências, fila de caça, e muito mais. Cada card é uma função específica.' },
    { el: null, title: '✅ Tour da Sala de Guerra concluído!',
      desc: 'Agora você conhece os componentes principais. Para começar: (1) Verifique se o Backend está conectado no Status do Sistema, (2) Digite um alvo no campo, (3) Clique em HUNT. Clique no botão ? a qualquer momento para rever este tour.' }
  ];

  TOURS['live-scan'] = [
    { el: '#page-live-scan', title: '📡 Varredura ao Vivo',
      desc: 'Esta tela mostra o progresso em tempo real de uma missão ativa. Aqui você acompanha o que cada operador (agente de IA) está fazendo, quais tarefas estão na fila, e o raciocínio completo da IA.' },
    { el: '#liveScanOperators', title: '🤖 Painel de Operadores',
      desc: 'Lista todos os operadores (agentes especialistas) que estão ativos na missão atual. Cada operador tem um papel: um pode estar fazendo recon de DNS, outro testando injeção SQL, etc. O status mostra se está trabalhando, esperando ou concluído.' },
    { el: '#liveScanTasks', title: '📋 Fila de Tarefas',
      desc: 'Mostra todas as tarefas que os operadores precisam executar. Cada tarefa tem um status: pendente (aguardando), em execução, ou concluída. Isso te dá uma visão clara do que ainda falta ser feito na missão.' },
    { el: '#liveScanFeed', title: '💭 Stream de Raciocínio e Ferramentas',
      desc: 'O painel mais importante: mostra em tempo real O QUE a IA está pensando e QUAIS ferramentas está usando. Você vê as chamadas de nmap, DNS, HTTP probes, e o raciocínio da IA sobre os resultados. Tudo transparente, sem caixa preta.' },
  ];

  TOURS['receipts'] = [
    { el: '#page-receipts', title: '🧾 Recibos de Escopo — O que é isso?',
      desc: 'Esta tela é o PORTÃO DE SEGURANÇA do T3MP3ST. Antes de executar qualquer ação que toca em sistemas reais (scans de rede, testes de exploração), o sistema pede sua APROVAÇÃO aqui. É uma proteção para garantir que nada seja executado sem sua autorização explícita.' },
    { el: '#receiptsSummary', title: '📊 Resumo das Aprovações',
      desc: 'Mostra um resumo rápido: quantas aprovações estão pendentes, quantas foram aprovadas, e quantas foram rejeitadas. Se houver itens pendentes, a missão fica travada até você aprovar.' },
    { el: '#receiptsList', title: '📜 Lista de Pedidos',
      desc: 'Cada pedido mostra: o que vai ser feito (ex: "escanear porta 80 de 10.0.0.5"), qual ferramenta será usada, e o nível de risco. Você pode aprovar individualmente ou clicar "Aprovar Pendentes" para aprovar tudo de uma vez. Rejeitar bloqueia aquela ação específica.' },
  ];

  TOURS['operators'] = [
    { el: '#page-operators', title: '🤖 Operativos — Sua Equipe de Agentes',
      desc: 'Cada "operativo" é um agente de IA especializado em uma área: um é expert em web, outro em criptografia, outro em redes. Aqui você gerencia quem está ativo, edita os prompts de cada um, e escolhe as formações táticas.' },
    { el: '#operativesRoster', title: '📋 Roster de Especialistas',
      desc: 'Lista completa dos operadores disponíveis. Clique em qualquer um para ver e editar: prompt do sistema, ferramentas recomendadas, parâmetros de modelo. Cada operador tem um papel definido que influencia como ele aborda os alvos.' },
    { el: '#architectureGrid', title: '🏗️ Formações Predefinidas',
      desc: 'Formações são combinações pré-configuradas de operadores para diferentes cenários: "Full Kill Chain" ativa todos, "Web Only" foca em segurança web, etc. Clique numa formação para ativar/desativar os operadores correspondentes de uma vez.' },
    { el: '#activeUnitCount', title: '📈 Estatísticas do Enxame',
      desc: 'Mostra quantas unidades estão ativas e quantas ferramentas estão prontas. Quanto mais operadores ativos, mais ampla é a cobertura — mas também consome mais recursos da IA.' },
  ];

  TOURS['evidence'] = [
    { el: '#page-evidence', title: '🔐 Cofre de Evidências',
      desc: 'Aqui ficam TODOS os achados (vulnerabilidades) descobertos durante as missões. Cada achado tem severidade, prova de que é real (não é a IA inventando), e cadeia de evidências rastreável até o comando que produziu o resultado.' },
    { el: '#criticalFindings', title: '🚨 Contador de Severidade',
      desc: 'Os cards no topo mostram a contagem por severidade: Crítico (vermelho — risco imediato de exploração), Alto (laranja — sério mas menos urgente), Médio (azul — relevante), e Credenciais (chaves/senhas encontradas). Zero em todos significa que nenhuma vulnerabilidade foi encontrada ainda.' },
    { el: '#findingsGrid', title: '📋 Lista de Achados',
      desc: 'Cada achado mostra: tipo de vulnerabilidade, severidade, alvo afetado, e evidência de prova. "Verificado" significa que uma ferramenta real produziu o resultado — não é a IA supondo. Clique em "Exportar" para gerar um relatório.' },
  ];

  TOURS['arsenal'] = [
    { el: '#page-arsenal', title: '📡 Arsenal — Suas Ferramentas',
      desc: 'O Arsenal é onde você seleciona quais ferramentas de segurança o T3MP3ST pode usar nas missões. São 85+ ferramentas em 14 categorias: OSINT, Scanning, Web, Exploit, Credenciais, Post-Exploração, AD, Rede, Cloud, Containers, Mobile, WiFi, e Reversão.' },
    { el: '.arsenal-signal-deck', title: '📊 Painel de Sinais',
      desc: 'Mostra 4 indicadores: Postura do Sensor (modo atual), Conjunto Visível (quantas ferramentas filtradas), Cobertura (quantos domínios cobertos), e Handoff (para qual operador vai o loadout). Ajuda a entender rapidamente o perfil da caçada.' },
    { el: '.arsenal-categories', title: '🏷️ Filtro por Categoria',
      desc: 'Clique nos botões para filtrar ferramentas por tipo: OSINT (inteligência aberta), SCAN (varredura), WEB (vulnerabilidades web), EXPLOIT (exploração), CREDS (credenciais), POST-EX (pós-exploração), AD (Active Directory), NET (rede), CLOUD, K8S (containers), MOBILE, WIFI, REV (engenharia reversa).' },
    { el: '#arsenalSearch', title: '🔎 Busca de Ferramentas',
      desc: 'Digite o nome de uma ferramenta para encontrá-la rapidamente. Ex: "nmap", "sqlmap", "burp", "nikto".' },
    { el: '#loadoutPreview', title: '⚔️ Loadout Ativo',
      desc: 'Mostra as ferramentas que você selecionou para a próxima missão. Botões importantes: "ARM ALL" arma todas as ferramentas visíveis, "ASSIGN" atribui a um operador específico, "ASSIGN → ALL" distribui para todos os operadores, "CLEAR" limpa a seleção.' },
    { el: '#arsenalGrid', title: '🧰 Grade de Ferramentas',
      desc: 'Cada card é uma ferramenta. Clique para adicionar ao loadout ativo. Ferramentas com borda verde estão armadas, cinza estão disponíveis mas inativas. Nota: o loadout é consultivo — operadores podem chamar qualquer ferramenta em tempo de execução.' },
  ];

  TOURS['terminal'] = [
    { el: '#page-terminal', title: '💻 Terminal',
      desc: 'Um terminal integrado para enviar comandos diretamente ao T3MP3ST. Útil para operações avançadas e debugging. Quando você abre uma ferramenta do Arsenal, ela aparece aqui.' },
    { el: '.ux-term-sidebar', title: '📋 Painel de Comandos Rápidos',
      desc: 'Painel lateral com todos os comandos disponíveis, organizados por categoria: Operadores, Arsenal, Missão, Provas e Sistema. Clique num botão para inserir o comando no terminal (sem executar — você pode complementar antes de enviar). O ícone "?" ao lado de cada comando explica o que ele faz.' },
    { el: '#terminalOutput', title: '📺 Saída do Terminal',
      desc: 'Mostra o histórico de comandos executados e suas respostas. Verde = sucesso, vermelho = erro, branco = saída normal.' },
    { el: '#terminalInput', title: '⌨️ Entrada de Comando',
      desc: 'Digite comandos aqui. Use "help" para ver todos os comandos disponíveis. Pressione Enter ou clique em "Executar" para rodar. O painel lateral à direita também insere comandos aqui.' },
  ];

  TOURS['benchmarks'] = [
    { el: '#page-benchmarks', title: '📈 OBSIDIVM — Benchmarks de Segurança',
      desc: 'Aqui você mede o desempenho real do T3MP3ST em desafios de segurança padronizados. Usa CTFs reais do Cybench, NYU, HTB e CSAW. Cada teste é reproduzível — rode "npm run verify-claims" para conferir.' },
    { el: '#configBenchBtn', title: '⚙️ Checagem de Config',
      desc: 'Roda uma validação rápida sem tocar em sistemas reais. Verifica se os modelos, ferramentas e configurações estão corretos. Bom para um primeiro teste.' },
    { el: '#liveBenchBtn', title: '🔴 Teste ao Vivo',
      desc: 'Executa os benchmarks de verdade — a IA tenta resolver os desafios de CTF com as ferramentas disponíveis. Consome tokens da LLM. Use para medir desempenho real.' },
    { el: '#benchmarkCategorySelector', title: '📂 Seletor de Categorias',
      desc: 'Escolha quais categorias testar: Exploração Web (10 testes), Exploração Binária (7), Criptografia (8), Engenharia Reversa (8), Forense (9), Ops Autônomos (6), OWASP Top 10, MITRE ATT&CK, CWE Top 25. Use "All" para selecionar tudo.' },
  ];

  TOURS['ctf-range'] = [
    { el: '#page-ctf-range', title: '🚩 Campo CTF — Treino de Segurança',
      desc: 'Campo de treino local para praticar CTF (Capture The Flag). São desafios de segurança controlados onde o T3MP3ST tenta encontrar "flags" (provas de exploração). Ideal para testar o sistema sem riscos.' },
  ];

  TOURS['general'] = [
    { el: '#page-general', title: '🎯 Comando Autônomo — Piloto Automático',
      desc: 'O Comando Autônomo é o modo "piloto automático" do T3MP3ST. Você descreve em português normal o que quer testar, e ele planeja toda a operação sozinho: identifica alvos, aloca operadores, define OPSEC, e executa a kill chain completa.' },
    { el: '#generalDirective', title: '📝 Campo de Diretiva',
      desc: 'Descreva aqui em português normal o que você quer. Exemplo: "Avalie a segurança completa do example.com — encontre todas as vulnerabilidades web, teste OWASP Top 10, e demonstre o impacto dos achados críticos."' },
    { el: '#generalOpsec', title: '🕵️ Nível OPSEC',
      desc: '3 modos: Encoberto (padrão) — scans lentos e silenciosos para não ser detectado. Silencioso — só técnicas passivas, sem tocar no alvo. Barulhento — velocidade máxima, pode disparar IDS/WAF.' },
    { el: '#generalUrgency', title: '⏱️ Urgência',
      desc: 'Define a profundidade vs velocidade: Normal (balanceado), Baixa (mais minucioso, mais lento), Alta (rápido mas menos profundo), Crítico (o mais rápido possível).' },
    { el: '#generalPlanBtn', title: '📋 PLANEJAR OPERAÇÃO',
      desc: 'Gera o plano de operação sem executar nada. Você revisa alvos, operadores, objetivos e regras de engajamento antes de aprovar. Seguro para rodar sem medo.' },
    { el: '#generalAutoBtn', title: '🔴 FULL AUTO',
      desc: 'CUIDADO: executa TUDO automaticamente sem pedir aprovação. Planeja e executa a operação completa. Use apenas em alvos que você TEM CERTEZA que tem autorização para testar.' },
  ];

  TOURS['selfimprove'] = [
    { el: '#page-selfimprove', title: '🧬 Autoaperfeiçoamento',
      desc: 'O T3MP3ST analisa seu próprio desempenho e propõe melhorias. Tudo é human-gated — nada muda sem sua aprovação. Os ícones "?" ao lado de cada opção explicam o que ela faz em detalhe.' },
    { el: '#siRoot', title: '⚙️ Painel de Governança',
      desc: 'No topo, controle COMO as melhorias são aplicadas: "Propor para aprovação" (seguro — você revisa) vs "Auto-aplicar" (aplica sozinho). Use "Congelar" para desativar tudo. A "cadência" define com que frequência o sistema se autoavalia: manual, horário, diário ou semanal.' },
  ];

  TOURS['settings'] = [
    { el: '#page-settings', title: '⚙️ Configurações — Setup Inicial',
      desc: 'Aqui você configura o cérebro do T3MP3ST. O mais importante: conectar um provedor de IA. Sem isso, o sistema não funciona. Cada seção tem um ícone "?" com explicação detalhada. Se você usa Ollama local, já está configurado.' },
    { el: '#uacProvider', title: '🔌 Provedor de API',
      desc: 'Escolha qual serviço de IA usar: OpenRouter (vários modelos, paga por uso), Venice (OpenAI-compatível), OpenAI (GPT-4), NanoGPT, ou Anthropic (Claude). Se você usa Ollama local, não precisa configurar aqui — o provider "local" já foi definido no .env.' },
    { el: '#uacApiKey', title: '🔑 Chave de API',
      desc: 'Cole aqui a chave do provedor escolhido. Para Ollama local, não precisa de chave. Para OpenRouter, pegue em openrouter.ai/keys. A chave é salva localmente no seu navegador.' },
    { el: '#uacModel', title: '🧠 Modelo',
      desc: 'Selecione qual modelo de IA usar. Clique "Buscar modelos" para carregar a lista do provedor. Para Ollama local, o modelo é definido em ~/.t3mp3st/.env (atualmente qwen2.5-coder:7b).' },
    { el: '#proxyUrl', title: '🌐 Proxy de Egresso',
      desc: 'Configure um proxy SOCKS5 para proteger seu IP real durante testes. Sem proxy, o alvo vê seu IP real. Formato: socks5://usuario:senha@host:porta' },
    { el: '#localAgentsList', title: '🤖 Agentes Locais',
      desc: 'Conecte CLIs de IA que já rodam no seu PC (Claude Code, Codex, Hermes). O T3MP3ST usa o login deles para conduzir missões sem chave de API separada.' },
  ];

  TOURS['configs'] = [
    { el: '#page-configs', title: '💾 Biblioteca de Configurações',
      desc: 'Salve e carregue configurações completas do T3MP3ST. Cada config salva inclui: quais operadores estão ativos, qual formação, pontuação de benchmark, e modelo de IA. Útil para ter presets: um para testes web, outro para infra, outro para CTF.' },
    { el: '#currentConfigSummary', title: '📊 Configuração Atual',
      desc: 'Mostra um resumo da configuração ativa: operadores, formação, modelo, e pontuação do último benchmark. Use "Salvar Config Atual" para guardar este estado.' },
    { el: '#configLibraryGrid', title: '📚 Configurações Salvas',
      desc: 'Suas configurações salvas, ordenadas por data, pontuação ou nome. Cada card mostra o score com código de cor (verde = bom). Botões: "Carregar" aplica, estrela define como padrão, lixeira exclui.' },
  ];

  TOURS['about'] = [
    { el: '#page-about', title: 'ℹ️ Sobre o T3MP3ST',
      desc: 'Informações sobre o projeto: versão, licença (AGPL-3.0), benchmark scores, domínios cobertos, e links úteis. T3MP3ST é um framework multi-agente de segurança ofensiva movido a IA.' },
  ];

  // ═══════════════════════════════════════════════
  // ENGINE
  // ═══════════════════════════════════════════════
  var steps = [];
  var idx = 0;
  var active = false;
  var currentPage = '';

  function getPage() {
    var activeNav = document.querySelector('.nav-item.active');
    return activeNav ? (activeNav.dataset.page || 'warroom') : 'warroom';
  }

  function renderDots() {
    var html = '';
    for (var i = 0; i < steps.length; i++) {
      var c = i === idx ? ' current' : (i < idx ? ' done' : '');
      html += '<span class="t3t-dot' + c + '" data-i="' + i + '"></span>';
    }
    elDots.innerHTML = html;
  }

  function positionCard() {
    if (!active || !steps[idx]) return;
    var step = steps[idx];
    var target = step.el ? document.querySelector(step.el) : null;

    if (!target || !step.el) {
      spotlight.style.display = 'none';
      elArrow.style.display = 'none';
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    var r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      spotlight.style.display = 'none';
      elArrow.style.display = 'none';
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }

    var pad = 8;
    spotlight.style.display = 'block';
    spotlight.style.left = (r.left - pad) + 'px';
    spotlight.style.top = (r.top - pad) + 'px';
    spotlight.style.width = (r.width + pad * 2) + 'px';
    spotlight.style.height = (r.height + pad * 2) + 'px';

    card.style.transform = '';
    var cw = card.offsetWidth || 380;
    var ch = card.offsetHeight || 220;
    var gap = 16;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var left, top;

    if (r.bottom + gap + ch <= vh) {
      top = r.bottom + gap;
      left = Math.max(8, Math.min(r.left, vw - cw - 8));
      elArrow.style.display = 'block';
      elArrow.style.top = '-7px';
      elArrow.style.left = Math.min(Math.max(20, r.left + r.width / 2 - left), cw - 20) + 'px';
      elArrow.style.borderTop = '1px solid rgba(47,255,210,.35)';
      elArrow.style.borderLeft = '1px solid rgba(47,255,210,.35)';
      elArrow.style.borderRight = 'none';
      elArrow.style.borderBottom = 'none';
    } else if (r.top - gap - ch >= 0) {
      top = r.top - gap - ch;
      left = Math.max(8, Math.min(r.left, vw - cw - 8));
      elArrow.style.display = 'block';
      elArrow.style.top = (ch - 7) + 'px';
      elArrow.style.left = Math.min(Math.max(20, r.left + r.width / 2 - left), cw - 20) + 'px';
      elArrow.style.borderBottom = '1px solid rgba(47,255,210,.35)';
      elArrow.style.borderRight = '1px solid rgba(47,255,210,.35)';
      elArrow.style.borderTop = 'none';
      elArrow.style.borderLeft = 'none';
    } else {
      top = Math.max(8, r.top);
      left = r.right + gap;
      if (left + cw > vw) left = r.left - gap - cw;
      left = Math.max(8, Math.min(left, vw - cw - 8));
      elArrow.style.display = 'none';
    }

    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function showStep() {
    if (!steps[idx]) { end(); return; }
    var step = steps[idx];

    elStep.textContent = (idx + 1) + ' de ' + steps.length;
    elTitle.textContent = step.title;
    elBody.textContent = step.desc;
    elPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
    elNext.textContent = idx === steps.length - 1 ? 'Finalizar ✓' : 'Próximo →';
    renderDots();

    if (step.el) {
      var target = document.querySelector(step.el);
      if (target && target.scrollIntoView) {
        try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      }
    }

    setTimeout(positionCard, 100);

    speak(step.title + '. ' + step.desc);
  }

  function start(page) {
    page = page || getPage();
    currentPage = page;
    steps = TOURS[page] || [];
    if (steps.length === 0) return;

    idx = 0;
    active = true;
    overlay.classList.add('active');
    card.style.display = 'block';
    window.addEventListener('resize', positionCard, true);
    window.addEventListener('scroll', positionCard, true);
    document.addEventListener('keydown', onKey, true);
    showStep();
  }

  function end() {
    active = false;
    overlay.classList.remove('active');
    card.style.display = 'none';
    spotlight.style.display = 'none';
    window.removeEventListener('resize', positionCard, true);
    window.removeEventListener('scroll', positionCard, true);
    document.removeEventListener('keydown', onKey, true);
    stopSpeaking();
    try { localStorage.setItem('t3mp_tour_seen_' + currentPage, '1'); } catch (e) {}
  }

  function next() {
    stopSpeaking();
    if (idx >= steps.length - 1) { end(); return; }
    idx++;
    showStep();
  }

  function prev() {
    stopSpeaking();
    if (idx <= 0) return;
    idx--;
    showStep();
  }

  function goTo(i) {
    stopSpeaking();
    if (i < 0 || i >= steps.length) return;
    idx = i;
    showStep();
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); end(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  }

  // Wire buttons
  elNext.addEventListener('click', next);
  elPrev.addEventListener('click', prev);
  elSkip.addEventListener('click', end);
  elDots.addEventListener('click', function (e) {
    var i = e.target.getAttribute('data-i');
    if (i !== null) goTo(parseInt(i, 10));
  });
  overlay.querySelector('.t3t-backdrop').addEventListener('click', end);

  // Floating ? button
  helpBtn.addEventListener('click', function () {
    if (active) end();
    else start(getPage());
  });

  // ═══════════════════════════════════════════════
  // AUTO-LAUNCH DESABILITADO — o usuário inicia pelo botão ?
  // ═══════════════════════════════════════════════
  // O auto-launch causava um backdrop escuro sem card visível em
  // certos estados. Agora o tour só inicia pelo botão ? (canto inferior direito).

  // Intercept page navigation (só para fechar tour ativo se mudar de página)
  var origNavigateTo = window.navigateTo;
  if (typeof origNavigateTo === 'function') {
    window.navigateTo = function (page) {
      if (active) end();
      origNavigateTo(page);
    };
  }

  // Safety: garante que overlay inicia escondido
  overlay.classList.remove('active');
  card.style.display = 'none';
  spotlight.style.display = 'none';

  // Make voices available (Chrome loads them async)
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () {};
    try { window.speechSynthesis.getVoices(); } catch (e) {}
  }

  // ═══════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════
  window.__t3tour = { start: start, end: end, next: next, prev: prev, tours: TOURS };
  // Keep old API compat
  window.t3mpTour = { start: function () { start(getPage()); }, end: end };
})();
