/*
 * T3MP3ST — Overlay de Melhorias de UX em Português
 * ──────────────────────────────────────────────────
 * Não-invasivo: adiciona explicações, reorganiza visualmente,
 * traduz conteúdo dinâmico que o i18n estático não alcança.
 * 100% reversível — remova a linha <script> para desfazer.
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════
  // CSS para os componentes de UX
  // ═══════════════════════════════════════════════
  var style = document.createElement('style');
  style.textContent = [
    '.ux-explainer{padding:12px 16px;margin-bottom:14px;background:linear-gradient(135deg,rgba(47,255,210,.06),rgba(0,136,255,.04));border:1px solid rgba(47,255,210,.2);border-radius:10px;font-size:13px;line-height:1.6;color:#a0c0cc}',
    '.ux-explainer strong{color:#2fffd2;font-weight:700}',
    '.ux-explainer .ux-tip{display:inline-block;margin-top:6px;padding:4px 10px;background:rgba(255,170,0,.1);border:1px solid rgba(255,170,0,.25);border-radius:6px;font-size:11.5px;color:#ffcf6b}',
    '.ux-step-tabs{display:flex;gap:4px;padding:8px 0 12px;flex-wrap:wrap}',
    '.ux-step-tab{padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.25);color:#8a99a5;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s}',
    '.ux-step-tab:hover{border-color:rgba(47,255,210,.3);color:#c0d8e0}',
    '.ux-step-tab.active{background:rgba(47,255,210,.1);border-color:rgba(47,255,210,.4);color:#2fffd2}',
    '.ux-step-tab .ux-tab-status{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
    '.ux-step-tab .ux-tab-status.ok{background:#2fffd2}',
    '.ux-step-tab .ux-tab-status.warn{background:#ffaa00}',
    '.ux-step-tab .ux-tab-status.err{background:#ff4444}',
    '.ux-step-tab .ux-tab-status.off{background:#444}',
    // Terminal sidebar
    '.ux-term-layout{display:flex;gap:12px;margin-top:12px}',
    '.ux-term-sidebar{width:260px;flex-shrink:0;max-height:420px;overflow-y:auto;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px}',
    '.ux-term-sidebar h4{font-size:11px;color:#2fffd2;text-transform:uppercase;letter-spacing:1px;margin:10px 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(47,255,210,.15)}',
    '.ux-term-sidebar h4:first-child{margin-top:0}',
    '.ux-cmd-row{display:flex;align-items:center;gap:4px;margin-bottom:3px}',
    '.ux-cmd-btn{flex:1;padding:5px 10px;font-size:11.5px;font-family:monospace;background:rgba(47,255,210,.06);border:1px solid rgba(47,255,210,.15);border-radius:6px;color:#c0dce4;cursor:pointer;text-align:left;transition:all .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ux-cmd-btn:hover{background:rgba(47,255,210,.14);border-color:rgba(47,255,210,.4);color:#fff}',
    '.ux-cmd-help{width:22px;height:22px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:none;color:#5a7a88;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}',
    '.ux-cmd-help:hover{border-color:#2fffd2;color:#2fffd2;background:rgba(47,255,210,.08)}',
    // Help modal
    '.ux-modal-overlay{position:fixed;inset:0;z-index:190000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;animation:uxFadeIn .2s}',
    '@keyframes uxFadeIn{from{opacity:0}to{opacity:1}}',
    '.ux-modal{background:linear-gradient(135deg,#0c1117,#111820);border:1px solid rgba(47,255,210,.3);border-radius:14px;padding:0;width:440px;max-width:calc(100vw - 32px);max-height:80vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,.8)}',
    '.ux-modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06)}',
    '.ux-modal-header h3{margin:0;font-size:16px;color:#fff;font-weight:700}',
    '.ux-modal-close{background:none;border:none;color:#5a7a88;font-size:22px;cursor:pointer;padding:0 4px;line-height:1}',
    '.ux-modal-close:hover{color:#ff4444}',
    '.ux-modal-body{padding:16px 20px;font-size:13.5px;line-height:1.65;color:#b0c8d4}',
    '.ux-modal-body code{background:rgba(47,255,210,.08);padding:2px 6px;border-radius:4px;font-size:12px;color:#2fffd2}',
    '.ux-modal-body .ux-example{display:block;margin:8px 0;padding:8px 12px;background:rgba(0,0,0,.3);border-left:3px solid #2fffd2;border-radius:0 6px 6px 0;font-family:monospace;font-size:12px;color:#8ab8cc}',
    // Inline help icons (for Self-Improvement, Configs, etc.)
    '.ux-inline-help{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:none;color:#5a7a88;font-size:10px;font-weight:700;cursor:pointer;margin-left:6px;vertical-align:middle;transition:all .15s}',
    '.ux-inline-help:hover{border-color:#2fffd2;color:#2fffd2;background:rgba(47,255,210,.08)}',
    // Tab panels for page reorganization
    '.ux-tab-panel{display:none;padding:12px 0}',
    '.ux-tab-panel.active{display:block}',
    // Live Scan visual feedback
    '@keyframes uxPulse{0%,100%{opacity:1}50%{opacity:.5}}',
    '@keyframes uxScanLine{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
    '.ux-ls-running{position:relative;overflow:hidden}',
    '.ux-ls-running::after{content:"";position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,#2fffd2,transparent);animation:uxScanLine 2s linear infinite}',
    '.ux-ls-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}',
    '.ux-ls-badge.running{background:rgba(0,255,136,.12);color:#00ff88;border:1px solid rgba(0,255,136,.3)}',
    '.ux-ls-badge.running .ux-ls-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;animation:uxPulse 1.2s ease infinite}',
    '.ux-ls-badge.paused{background:rgba(255,170,0,.12);color:#ffaa00;border:1px solid rgba(255,170,0,.3)}',
    '.ux-ls-badge.stopped{background:rgba(255,255,255,.05);color:#5a7a88;border:1px solid rgba(255,255,255,.1)}',
    '.ux-ls-progress{height:4px;border-radius:2px;background:rgba(255,255,255,.08);margin-top:8px;overflow:hidden}',
    '.ux-ls-progress-bar{height:100%;border-radius:2px;background:linear-gradient(90deg,#2fffd2,#00aaff);transition:width .5s ease}',
    '.ux-ls-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;color:#5a7a88}',
    '.ux-ls-empty-icon{font-size:36px;margin-bottom:12px;opacity:.5}',
    '.ux-ls-empty-title{font-size:14px;font-weight:700;color:#8a99a5;margin-bottom:6px}',
    '.ux-ls-empty-desc{font-size:12px;line-height:1.6;max-width:320px}',
    '@media(max-width:700px){.ux-term-sidebar{width:100%}.ux-term-layout{flex-direction:column}}',
  ].join('\n');
  document.head.appendChild(style);

  // ═══════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════
  function el(id) { return document.getElementById(id); }
  function qs(sel) { try { return document.querySelector(sel); } catch (e) { return null; } }
  function qsa(sel) { try { return Array.from(document.querySelectorAll(sel)); } catch (e) { return []; } }

  function insertExplainer(target, html) {
    if (!target) return;
    var existing = target.querySelector('.ux-explainer');
    if (existing) return;
    var div = document.createElement('div');
    div.className = 'ux-explainer';
    div.innerHTML = html;
    target.insertBefore(div, target.firstChild);
  }

  function insertExplainerBefore(refEl, html) {
    if (!refEl || !refEl.parentNode) return;
    if (refEl.previousElementSibling && refEl.previousElementSibling.classList.contains('ux-explainer')) return;
    var div = document.createElement('div');
    div.className = 'ux-explainer';
    div.innerHTML = html;
    refEl.parentNode.insertBefore(div, refEl);
  }

  // ═══════════════════════════════════════════════
  // TRADUÇÕES DINÂMICAS (conteúdo gerado por JS)
  // ═══════════════════════════════════════════════
  var DYNAMIC_DICT = {
    'Full Kill Chain': 'Kill Chain Completa',
    'Recon Squad': 'Esquadrão de Recon',
    'Strike Team': 'Equipe de Ataque',
    'Red Team': 'Red Team',
    'Stealth Ops': 'Operações Furtivas',
    'APT Simulation': 'Simulação de APT',
    'Web Assault': 'Assalto Web',
    'AD Attack': 'Ataque AD',
    'Custom Deployment': 'Implantação Customizada',
    'Full Kill Chain — every specialist from recon to reporting': 'Kill Chain Completa — todos os especialistas de recon a relatórios',
    'Passive-only intelligence gathering': 'Coleta de inteligência somente passiva',
    'Targeted exploitation with minimal footprint': 'Exploração direcionada com mínimo rastro',
    'Adversary emulation with full TTPs': 'Emulação adversária com TTPs completos',
    'Quiet recon + careful exploitation': 'Recon silencioso + exploração cuidadosa',
    'Long-term persistent adversary simulation': 'Simulação de adversário persistente de longo prazo',
    'Web application focused assault': 'Assalto focado em aplicações web',
    'Active Directory environment attack': 'Ataque a ambiente Active Directory',
    'Units Active': 'Unidades Ativas',
    'Tools Ready': 'Ferramentas Prontas',
    'CATALOG': 'CATÁLOGO',
    'ACTIVE': 'ATIVO',
    'DOMAINS': 'DOMÍNIOS',
    'Sensor Posture': 'Postura dos Sensores',
    'Visible Set': 'Conjunto Visível',
    'Handoff': 'Entrega',
    'ACTIVE LOADOUT': 'LOADOUT ATIVO',
    'needs contract': 'precisa de contrato',
    'local-lab fallback': 'fallback lab local',
    'checking arsenal': 'verificando arsenal',
    'checking backend': 'verificando backend',
    'lanes preview only': 'só prévia de faixas',
    'ledger required': 'registro obrigatório',
    'pending request': 'pedido pendente',
    'receipt gate': 'portão de recibo',
    'needs domains': 'precisa de domínios',
    'needs validator': 'precisa de validador',
    'needs composer': 'precisa de compositor',
    'Scope': 'Escopo',
    'Target': 'Alvo',
    'Tools': 'Ferramentas',
    'Mode': 'Modo',
    'Agents': 'Agentes',
    'Evidence': 'Evidência',
    'Receipt': 'Recibo',
    'Breadth': 'Amplitude',
    'Proof': 'Prova',
    'Chain': 'Cadeia',
    'Sort by Date': 'Ordenar por Data',
    'Sort by Score': 'Ordenar por Pontuação',
    'Sort by Name': 'Ordenar por Nome',
    'Run a benchmark to see current config performance': 'Rode um benchmark para ver o desempenho da configuração atual',
    'Run benchmarks and save your best performing configs': 'Rode benchmarks e salve suas configurações de melhor desempenho',
    'No saved configurations yet': 'Nenhuma configuração salva ainda',
    'configs saved': 'configs salvas',
    'Save Current Config': 'Salvar Config Atual',
    'Load Default': 'Carregar Padrão',
    'Saved Configurations': 'Configurações Salvas',
    'Current Configuration': 'Configuração Atual',
    'Coverage by domain': 'Cobertura por domínio',
    'Autonomous Operatives': 'Operativos Autônomos',
    'Evidence-Gated Security': 'Segurança com Portão de Evidência',
    'Real-Time Adaptation': 'Adaptação em Tempo Real',
    'Multi-Agent Coordination': 'Coordenação Multi-Agente',
    'Extensible Arsenal': 'Arsenal Extensível',
    'Attack Plan Generation': 'Geração de Plano de Ataque',
    'system events stream (live from the backend)': 'stream de eventos do sistema (ao vivo do backend)',
    'Awaiting orders — point at a target and engage.': 'Aguardando ordens — aponte para um alvo e engaje.',
    'Pick a preset or build your own mix below': 'Escolha um preset ou monte sua combinação abaixo',
    'Real CTF challenges from Cybench & NYU CTF Bench': 'Desafios CTF reais do Cybench e NYU CTF Bench',
    'Re-benchmark + analyze + auto-apply config changes': 'Re-benchmark + análise + auto-aplicar mudanças de config',
    'Give the Admiral a high-level directive and it will autonomously plan the entire operation — identifying targets, allocating operators, setting OPSEC levels, and executing the full kill chain. No manual configuration needed.':
      'Dê ao Admiral uma diretiva de alto nível e ele planejará toda a operação de forma autônoma — identificando alvos, alocando operadores, definindo níveis OPSEC, e executando a kill chain completa. Sem configuração manual.',
    'Describe the authorized operation in normal language. Example: We own this staging API. Find the highest-impact risks, preserve evidence, and give engineering a fix plan.':
      'Descreva a operação autorizada em linguagem normal. Exemplo: Somos donos desta API de staging. Encontre os riscos de maior impacto, preserve evidências, e dê à engenharia um plano de correção.',
    'e.g. Assess the full security posture of example.com — find all vulnerabilities in their web infrastructure, test for OWASP Top 10 issues, and demonstrate impact of any critical findings.':
      'Ex: Avalie a postura de segurança completa do example.com — encontre todas as vulnerabilidades na infraestrutura web, teste os problemas OWASP Top 10, e demonstre o impacto dos achados críticos.',
    'e.g. web apps only, 10.0.0.0/24': 'Ex: somente apps web, 10.0.0.0/24',
    'e.g. No exploitation, recon only, avoid port 443': 'Ex: Sem exploração, apenas recon, evitar porta 443',
    'PLAN OPERATION': 'PLANEJAR OPERAÇÃO',
    'CODEX AUTOHUNT': 'CAÇADA AUTO CODEX',
    'LOCAL DRILL': 'TREINO LOCAL',
    'DEGRADED': 'DEGRADADO',
    'HOLD DRILL': 'TREINO PARADO',
    'GAUNTLET': 'DESAFIO',
    'FULL AUTO': 'AUTO COMPLETO',
    'EXECUTE': 'EXECUTAR',
    'STANDING BY': 'EM ESPERA',
    'Flight Recorder': 'Gravador de Voo',
    'Evidence Workbench': 'Bancada de Evidências',
    'Work Order Board': 'Quadro de Ordens',
    'Target Intake': 'Entrada de Alvos',
    'Training Range': 'Campo de Treino',
    'Operator Clarity Layer': 'Camada de Clareza do Operador',
    'Current truth, next move, and proof pressure for the active hunt.': 'Verdade atual, próximo passo, e pressão de prova para a caçada ativa.',
    'Mission Spine': 'Espinha da Missão',
    'Recorder, proof, tasks, target intake, and training range folded into one operator surface.': 'Gravador, provas, tarefas, entrada de alvos e campo de treino em uma só superfície.',
    'PLINY CODE OPS LAYER': 'CAMADA DE OPERAÇÕES',
    'Slash grammar, route preview, agent lanes, memory, computer-use, and evidence gates folded into the original T3MP3ST war room.':
      'Gramática slash, prévia de rotas, faixas de agentes, memória, uso de computador e portões de evidência integrados na sala de guerra original.',
    'catalog tools': 'ferramentas no catálogo',
    'wired': 'conectadas',
    'installed': 'instaladas',
    'slash cmds': 'comandos slash',
    'agent memory': 'memória do agente',
    'egress gated': 'egresso controlado',
    'Operator Inbox': 'Caixa do Operador',
    'Gate Snapshot': 'Snapshot do Portão',
    'Proof State': 'Estado da Prova',
    'Zero-Day Hunt Pulse': 'Pulso da Caçada Zero-Day',
    'Specialist Swarm': 'Enxame Especialista',
    'Swarm Cognition Loop': 'Loop de Cognição do Enxame',
    'Reasoning Bus': 'Barramento de Raciocínio',
    'Guided Starts': 'Inícios Guiados',
    'Knowledge Atlas': 'Atlas de Conhecimento',
    'Agent Prompt Packs': 'Pacotes de Prompt do Agente',
    'Forefront Radar': 'Radar de Vanguarda',
    'Capability Preflight': 'Pré-checagem de Capacidade',
    'Tool Adapter Forge': 'Forja de Adaptadores',
    'Evidence Ledger': 'Registro de Evidências',
    'Hypothesis Graph': 'Grafo de Hipóteses',
    'Hunt Queue': 'Fila de Caça',
    'Watch Loop': 'Loop de Vigilância',
    'The Fixer': 'O Reparador',
    'Findings / Retest': 'Achados / Reteste',
    'Repro Packs': 'Pacotes de Reprodução',
    'Pressure Paths': 'Caminhos de Pressão',
    'Next Moves': 'Próximos Passos',
    'Learning Capsule': 'Cápsula de Aprendizado',
    'Mission Contract': 'Contrato de Missão',
    'Reasoning And Tool Stream': 'Stream de Raciocínio e Ferramentas',
    'ARSENAL CONTROL': 'CONTROLE DO ARSENAL',
    'Select, arm, and coordinate operator tools': 'Selecione, arme e coordene as ferramentas dos operadores',
    'THE ADMIRAL — Autonomous Op Orchestrator': 'O ALMIRANTE — Orquestrador Autônomo de Operações',
    'Loading self-improvement loops…': 'Carregando loops de autoaperfeiçoamento…',
    'Tastemaker Quality Gate': 'Portão de Qualidade Tastemaker',
    'Elite arbiter reviews all outputs': 'Árbitro de elite revisa todas as saídas',
    'Self-Reflection Loops': 'Loops de Auto-reflexão',
    'OODA + self-critique reasoning': 'Raciocínio OODA + autocrítica',
    'Strict Quality Mode': 'Modo de Qualidade Estrita',
    'Retry on rejection (max 2)': 'Retentar em rejeição (máx 2)',
    'Adaptive (Auto-select)': 'Adaptivo (Auto-seleção)',
    'Sequential (One agent)': 'Sequencial (Um agente)',
    'Parallel (Merge results)': 'Paralelo (Mesclar resultados)',
    'Debate (Agent discussion)': 'Debate (Discussão de agentes)',
    'Best-of-N (Judge picks best)': 'Melhor-de-N (Juiz escolhe o melhor)',
    'Apply Configuration': 'Aplicar Configuração',
    'Reset to Defaults': 'Restaurar Padrões',
    'ARM ALL': 'ARMAR TUDO',
    'ASSIGN': 'ATRIBUIR',
    'ASSIGN → ALL': 'ATRIBUIR → TODOS',
    'CLEAR': 'LIMPAR',
    'Arm every tool currently visible (respects the category + search filter)': 'Arma todas as ferramentas visíveis (respeita o filtro de categoria + busca)',
    'Add this loadout to every operator\'s recommended toolset (advisory focus — operators can still call any tool at runtime)':
      'Adiciona este loadout ao conjunto recomendado de todos os operadores (consultivo — operadores podem usar qualquer ferramenta em runtime)',
    'No tools assigned - click tools below to add to the loadout': 'Nenhuma ferramenta atribuída — clique nas ferramentas abaixo para montar o loadout',
    'Point T3MP3ST at any authorized target and watch it work: live recon with real tools (nmap, DNS, HTTP probes), every finding provenance-gated to the command that produced it — no phantom flags. An LLM reasons over that ground truth in the open. Kill-chain phases past recon are labeled for what they are — no fake pwns, no vibes. Don\'t take our word for it:':
      'Aponte o T3MP3ST para qualquer alvo autorizado e veja-o trabalhar: recon ao vivo com ferramentas reais (nmap, DNS, HTTP probes), cada achado rastreado até o comando que o produziu — sem flags fantasma. Uma LLM raciocina sobre essa verdade em aberto. Fases da kill-chain além do recon são rotuladas pelo que são — sem pwns falsos. Não confie na nossa palavra:',
    'Run keyless — connect Claude Code, Codex, or Hermes and T3MP3ST drives missions through your agent\'s own login (no API key).':
      'Rode sem chave — conecte Claude Code, Codex ou Hermes e o T3MP3ST conduz missões usando o login do seu próprio agente (sem chave de API).',
    'To run, connect a local agent or add a key.': 'Para rodar, conecte um agente local ou adicione uma chave.',
    'No per-step approval · live recon, scaffolded kill-chain · every step receipted':
      'Sem aprovação por passo · recon ao vivo, kill-chain estruturada · todo passo com recibo',
    'Point and go — T3MP3ST drives the hunt without stopping for step-by-step approval. Recon runs live with real tools; later kill-chain phases are scaffolded, not full auto-pwn. Every step is receipted.':
      'Aponte e vá — o T3MP3ST conduz a caçada sem parar para aprovação passo-a-passo. Recon roda ao vivo com ferramentas reais; fases posteriores da kill-chain são estruturadas, não auto-pwn total. Todo passo tem recibo.',
    'Connect an already-authed CLI (Claude Code · Codex · Hermes) or add an API key to start hunting.':
      'Conecte um CLI já autenticado (Claude Code · Codex · Hermes) ou adicione uma chave de API para começar a caçar.',
    'Connect in Settings →': 'Conectar em Configurações →',
    'Set up in Settings →': 'Configurar em Configurações →',
    'Configure your LLM providers in one place — provider, key, base URL, model, and context cap — shared with the individual provider sections below (fully backward-compatible).':
      'Configure seus provedores de LLM em um só lugar — provedor, chave, URL base, modelo e limite de contexto — compartilhado com as seções individuais abaixo (totalmente retrocompatível).',

    // Strings com emoji/prefixo especial
    '🎯 START A ZERO-DAY HUNT': '🎯 INICIE UMA CAÇADA ZERO-DAY',
    '▌ SYSTEM EVENTS': '▌ EVENTOS DO SISTEMA',
    '🎯 HUNT': '🎯 CAÇAR',
    '⚓ Guided': '⚓ Guiado',
    '🤖 AUTONOMOUS MODE': '🤖 MODO AUTÔNOMO',
    '▶ ENGAGE': '▶ ENGAJAR',
    '🔌 Connect in Settings →': '🔌 Conectar em Configurações →',

    // Inbox severity labels
    'block': 'bloqueio',
    'priority': 'prioridade',
    'ok': 'ok',

    // Inbox CTA buttons
    'Stage': 'Preparar',
    'Sync': 'Sincronizar',
    'Check': 'Checar',
    'Watch': 'Observar',
    'Ledgers': 'Registros',

    // Proof state labels
    'Idea': 'Ideia',
    'Hypothesis': 'Hipótese',
    'Work Order': 'Ordem de Trabalho',
    'Retest': 'Reteste',
    'Memory': 'Memória',
    'promoted': 'promovido',
    'seeded': 'semeado',
    'passed': 'passaram',
    'artifact(s)': 'artefato(s)',
    'open': 'abertas',

    // Flight Recorder / Route
    'Route Preview': 'Prévia de Rota',
    'Tool Plan': 'Plano de Ferramentas',
    'No swarm tool plan staged yet.': 'Nenhum plano de ferramentas do enxame preparado ainda.',
    'Target needs operator confirmation.': 'O alvo precisa de confirmação do operador.',
    'Target unclear': 'Alvo não definido',
    'Pick an owned app, repo, package, range, model, or keep the local lab.': 'Escolha um app, repo, pacote, range ou modelo que você possui, ou use o lab local.',
    'Code / supply chain route staged.': 'Rota de código / cadeia de suprimentos preparada.',

    // Readiness panel
    'real ops': 'ops reais',
    'tools ready': 'ferramentas prontas',
    'gaps': 'gaps',
    'ready': 'pronto',
    'memory reviews': 'revisões de memória',
    'snapshot idle': 'snapshot ocioso',
    'updated': 'atualizado',

    // Kill chain phases (SITREP pipeline)
    'RECON': 'RECON',
    'WEAPON': 'ARMAM.',
    'DELIVER': 'ENTREGA',
    'EXPLOIT': 'EXPLORAR',
    'INSTALL': 'INSTALAR',
    'ACTIONS': 'AÇÕES',
    'SCANNING': 'VARREDURA',
    'EXPLOITATION': 'EXPLORAÇÃO',
    'POST-EXPLOIT': 'PÓS-EXPLOIT',
    'EXFIL': 'EXFIL',

    // System Events
    'SYSTEM EVENTS': 'EVENTOS DO SISTEMA',
    'system events stream (live from the backend)': 'stream de eventos do sistema (ao vivo do backend)',

    // Hunt section
    'START A ZERO-DAY HUNT': 'INICIE UMA CAÇADA ZERO-DAY',
    'HUNT': 'CAÇAR',
    'ENGAGE': 'ENGAJAR',
    'AUTONOMOUS MODE': 'MODO AUTÔNOMO',
    'ENGAGING...': 'ENGAJANDO...',
    'No per-step approval · live recon, scaffolded kill-chain · every step receipted':
      'Sem aprovação por passo · recon ao vivo, kill-chain estruturada · todo passo com recibo',
    'watching the agent work': 'observando o agente trabalhar',
    'Getting started': 'Começando',
    'Examples:': 'Exemplos:',

    // Operator Inbox items
    'Set target': 'Definir alvo',
    'Choose the authorized surface before interpreting hunt status.': 'Escolha a superfície autorizada antes de interpretar o status da caçada.',
    'Stage route': 'Preparar rota',
    'Split the mission into lanes, tools, gates, and evidence expectations.': 'Divida a missão em faixas, ferramentas, portões e expectativas de evidência.',
    'Close tool gaps': 'Fechar gaps de ferramentas',
    'WOLF check': 'Checagem WOLF',
    'Run a close-to-action stale-state and gate sanity pass.': 'Execute uma checagem de sanidade próxima à ação e validação de portões.',
    'Field Drill': 'Exercício de Campo',
    'Runs route, runbook, evidence, gate, and receipt smoke checks.': 'Executa checagens de rota, runbook, evidência, portão e recibo.',
    'blocker present': 'bloqueio presente',
    'no hard block': 'sem bloqueio rígido',
    'open tasks': 'tarefas abertas',
    '0 open': '0 abertas',

    // Readiness cells
    'Route': 'Rota',
    'plan required': 'plano necessário',
    'no auth surface': 'sem superfície autorizada',
    'no tools armed': 'nenhuma ferramenta armada',

    // Panel titles
    'Zero-Day Hunt Pulse': 'Pulso da Caçada Zero-Day',
    'standby': 'em espera',
    '0 active': '0 ativos',
    'Tool Approvals & Spicy-Action Audit': 'Aprovação de Ferramentas e Auditoria de Ações',
    '0 events': '0 eventos',
    'plain-language ops': 'ops em linguagem simples',
    '0 items': '0 itens',
    'Mission Contract': 'Contrato de Missão',
    'plain text → route': 'texto simples → rota',
    '0 pending': '0 pendentes',
    '0 lanes': '0 faixas',

    // Evidence severity
    'CRIT': 'CRÍT',
    'HIGH': 'ALTO',
    'MED': 'MÉD',
    'LOW': 'BAIXO',
    'CREDS': 'CREDS',

    // Op Admiral → Comando Autônomo
    'Op Admiral': 'Comando Autônomo',
    'THE ADMIRAL — Autonomous Op Orchestrator': 'COMANDO AUTÔNOMO — Orquestrador de Operações',
    'Admiral\'s Intent': 'Intenção do Comando',
    'Admiral\'s Strategic Rationale': 'Racional Estratégico do Comando',
    'PLAN OPERATION': 'PLANEJAR OPERAÇÃO',
    'CODEX AUTOHUNT': 'CAÇADA AUTO CODEX',
    'LOCAL DRILL': 'TREINO LOCAL',
    'HOLD DRILL': 'TREINO PARADO',
    'FULL AUTO': 'AUTO COMPLETO',

    // Terminal strings
    'T3MP3ST COMMAND REFERENCE': 'REFERÊNCIA DE COMANDOS T3MP3ST',
    'List active operators': 'Listar operadores ativos',
    'Deploy an operator': 'Implantar um operador',
    'Terminate an operator': 'Terminar um operador',
    'Deploy formation preset': 'Implantar preset de formação',
    'List all available tools': 'Listar todas as ferramentas',
    'Show current mission loadout': 'Mostrar loadout da missão',
    'Add tool to loadout': 'Adicionar ferramenta ao loadout',
    'Execute/show tool help': 'Executar/ver ajuda da ferramenta',
    'Show mission status': 'Mostrar status da missão',
    'List targets': 'Listar alvos',
    'List findings': 'Listar achados',
    'Start mission': 'Iniciar missão',
    'Abort mission': 'Abortar missão',
    'Strike statistics': 'Estatísticas de ataques',
    'Evidence chain status': 'Status da cadeia de evidências',
    'Open evidence viewer': 'Abrir visualizador de evidências',
    'Export proof report': 'Exportar relatório de provas',
    'Mission checkpoint system': 'Sistema de checkpoint da missão',
    'Launch BLITZ mission': 'Lançar missão BLITZ',
    'Clear terminal': 'Limpar terminal',
    'Set cognitive mode': 'Definir modo cognitivo',
    'Tool loaded and ready for deployment': 'Ferramenta carregada e pronta para uso',
    'Initiating mission...': 'Iniciando missão...',
    'Aborting mission...': 'Abortando missão...',
    'No active operators. Use "spawn <type>" to deploy.': 'Nenhum operador ativo. Use "spawn <tipo>" para implantar.',
    'No targets defined': 'Nenhum alvo definido',
    'No findings yet': 'Nenhum achado ainda',
    'Loadout empty. Use "use <tool>" to add tools.': 'Loadout vazio. Use "use <ferramenta>" para adicionar.',
    'deployed': 'implantado',
    'recalled': 'recolhido',
    'added to loadout': 'adicionado ao loadout',
    'Proof report exported': 'Relatório de provas exportado',
    'cURL commands exported': 'Comandos cURL exportados',
    'Checkpoint saved': 'Checkpoint salvo',
    'Checkpoints cleared': 'Checkpoints limpos',
    'Launching autonomous BLITZ mission...': 'Lançando missão BLITZ autônoma...',
    'Active operators:': 'Operadores ativos:',
    'Current mission loadout:': 'Loadout da missão atual:',

    // Mission status
    'DONE': 'CONCLUÍDO',
    'RUNNING': 'RODANDO',
    'STARTING': 'INICIANDO',
    'IDLE': 'OCIOSO',
    'STANDBY': 'EM ESPERA',

    // Live Scan
    'Agent Progress': 'Progresso dos Agentes',
    'State': 'Estado',
    'Phase': 'Fase',
    'Progress': 'Progresso',
    'Stall': 'Travamento',
    'Paused': 'Pausado',
    'Running': 'Rodando',
    'Stopped': 'Parado',
    'none': 'nenhuma',
    'busy': 'ocupado(s)',
    'tasks': 'tarefas',
    'events': 'eventos',
    'active': 'ativo(s)',
    'No operator details available yet.': 'Nenhum detalhe de operador disponível ainda.',
    'No mission tasks are queued.': 'Nenhuma tarefa de missão enfileirada.',
    'No live reasoning events yet. Start or refresh a scan to populate this stream.': 'Nenhum evento de raciocínio ao vivo ainda. Inicie ou atualize uma varredura para popular este stream.',
    'done': 'concluído',
    'failed': 'falhou',
    'risk': 'risco',
    'operator': 'operador',
    'unknown': 'desconhecido',
    'tasked': 'designado',
    'executing': 'executando',
    'idle': 'ocioso',
    'completed': 'concluído',
    'pending': 'pendente',
    'queued': 'enfileirado',
    'backend-seeded': 'semeado pelo backend',
    'thinking': 'pensando',
    'tool_call': 'chamada de ferramenta',
    'tool_result': 'resultado de ferramenta',
    'task_started': 'tarefa iniciada',
    'task_completed': 'tarefa concluída',
    'task_failed': 'tarefa falhou',

    // Self-Improvement
    'Tastemaker Quality Gate': 'Portão de Qualidade Tastemaker',
    'Elite arbiter reviews all outputs': 'Árbitro de elite revisa todas as saídas',
    'Self-Reflection Loops': 'Loops de Auto-reflexão',
    'OODA + self-critique reasoning': 'Raciocínio OODA + autocrítica',
    'Strict Quality Mode': 'Modo de Qualidade Estrita',
    'Retry on rejection (max 2)': 'Retentar em rejeição (máx 2)',
    'Adaptive (Auto-select)': 'Adaptivo (Auto-seleção)',
    'Sequential (One agent)': 'Sequencial (Um agente)',
    'Parallel (Merge results)': 'Paralelo (Mesclar resultados)',
    'Debate (Agent discussion)': 'Debate (Discussão de agentes)',
    'Best-of-N (Judge picks best)': 'Melhor-de-N (Juiz escolhe o melhor)',

    // Misc
    'Compact': 'Compacto',
    'Collapse': 'Recolher',
    'Expand': 'Expandir',
    'Refresh': 'Atualizar',
    'Bundle': 'Pacote',
    'Situation Reports': 'Relatórios de Situação',
    'Request SITREP': 'Solicitar SITREP',
    'Scope Receipts': 'Recibos de Escopo',
    'No pending scope receipts.': 'Nenhum recibo de escopo pendente.',
    'Connect an already-authed CLI (Claude Code · Codex · Hermes) or add an API key to start hunting.':
      'Conecte um CLI já autenticado (Claude Code · Codex · Hermes) ou adicione uma chave de API para começar a caçar.',
    'No agent or API backend connected': 'Nenhum agente ou backend de API conectado',
    'Assessment will be generated after operation completes or on demand.': 'A avaliação será gerada quando a operação terminar ou sob demanda.',
    'SKIP': 'PULAR',
    'AUTONOMOUS KILLCHAIN ENGAGED': 'KILLCHAIN AUTÔNOMA ENGAJADA',
    'Mission aborted': 'Missão abortada',
    'MISSION ABORTED BY OPERATOR': 'MISSÃO ABORTADA PELO OPERADOR',
  };

  // ═══════════════════════════════════════════════
  // Tradução dinâmica recorrente (pega o que o i18n estático não pega)
  // ═══════════════════════════════════════════════
  function translateDynamic() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    var batch = [];
    while ((node = walker.nextNode())) batch.push(node);

    for (var i = 0; i < batch.length; i++) {
      var n = batch[i];
      if (!n.nodeValue) continue;
      var parent = n.parentNode;
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;
      var trimmed = n.nodeValue.trim();
      if (DYNAMIC_DICT[trimmed]) {
        var lead = n.nodeValue.match(/^\s*/)[0];
        var tail = n.nodeValue.match(/\s*$/)[0];
        n.nodeValue = lead + DYNAMIC_DICT[trimmed] + tail;
      }
    }

    // Traduzir placeholders, titles, aria-labels
    var attrs = ['placeholder', 'title', 'aria-label'];
    var allEls = document.querySelectorAll('*');
    for (var j = 0; j < allEls.length; j++) {
      for (var k = 0; k < attrs.length; k++) {
        var a = attrs[k];
        var el = allEls[j];
        if (el.hasAttribute && el.hasAttribute(a)) {
          var v = el.getAttribute(a);
          if (DYNAMIC_DICT[v]) el.setAttribute(a, DYNAMIC_DICT[v]);
        }
      }
    }

    // Traduzir options de selects
    var opts = document.querySelectorAll('option');
    for (var m = 0; m < opts.length; m++) {
      var t = opts[m].textContent.trim();
      if (DYNAMIC_DICT[t]) opts[m].textContent = DYNAMIC_DICT[t];
      // Parcial
      for (var key in DYNAMIC_DICT) {
        if (opts[m].textContent.indexOf(key) !== -1 && key.length > 5) {
          opts[m].textContent = opts[m].textContent.replace(key, DYNAMIC_DICT[key]);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════
  // EXPLICADORES POR PÁGINA
  // ═══════════════════════════════════════════════
  function addExplainers() {
    // WAR ROOM
    var warroom = el('page-warroom');
    if (warroom) {
      insertExplainer(warroom,
        '<strong>🎯 Como usar a Sala de Guerra:</strong> ' +
        '1️⃣ Verifique se o <strong>Backend</strong> está conectado (indicador verde no Status do Sistema abaixo). ' +
        '2️⃣ Digite o alvo no campo "HUNT" (um domínio, IP, repo GitHub ou pacote npm). ' +
        '3️⃣ Clique em <strong>HUNT</strong> ou pressione Enter. ' +
        '4️⃣ Acompanhe os resultados no terminal de eventos e no SITREP.' +
        '<div class="ux-tip">💡 Dica: Use o botão <strong>?</strong> no canto inferior direito para um tour detalhado desta tela.</div>'
      );
    }

    // LIVE SCAN
    var liveScan = el('page-live-scan');
    if (liveScan) {
      insertExplainer(liveScan,
        '<strong>📡 O que é a Varredura ao Vivo?</strong> ' +
        'Esta tela mostra <strong>em tempo real</strong> o que está acontecendo durante uma missão ativa. ' +
        'O painel <strong>Operadores</strong> mostra cada agente de IA e o que ele está fazendo (ex: escaneando portas, testando SQL injection). ' +
        'A <strong>Fila de Tarefas</strong> mostra o que ainda precisa ser feito. ' +
        'O <strong>Stream de Raciocínio</strong> mostra o pensamento da IA e quais ferramentas ela está usando — tudo transparente.' +
        '<div class="ux-tip">💡 Se estiver vazio, é porque nenhuma missão está rodando. Volte à Sala de Guerra e lance uma missão primeiro.</div>'
      );
    }

    // RECEIPTS
    var receipts = el('page-receipts');
    if (receipts) {
      insertExplainer(receipts,
        '<strong>🧾 Para que servem os Recibos de Escopo?</strong> ' +
        'Os recibos são seu <strong>portão de segurança</strong>. Antes do T3MP3ST executar qualquer ação que toque em sistemas reais ' +
        '(scan de rede, teste de exploração, etc.), ele pede sua <strong>aprovação explícita</strong> aqui. ' +
        'Isso garante que nada é executado sem sua autorização. ' +
        '<strong>Aprovar</strong> = permite a ação. <strong>Rejeitar</strong> = bloqueia aquela ação específica. ' +
        '"Aprovar Pendentes" aprova tudo de uma vez.' +
        '<div class="ux-tip">⚠️ Se a missão parecer travada, verifique se há recibos pendentes aqui — eles bloqueiam o progresso.</div>'
      );
    }

    // OPERATORS
    var operators = el('page-operators');
    if (operators) {
      insertExplainer(operators,
        '<strong>🤖 O que são os Operativos?</strong> ' +
        'Cada operativo é um <strong>agente de IA especialista</strong> em uma área de segurança. ' +
        'Exemplos: um especialista em Web (testa OWASP Top 10), um em Rede (roda nmap, DNS), um em Criptografia, etc. ' +
        '<strong>Formações</strong> são combinações pré-prontas: "Kill Chain Completa" ativa todos, "Assalto Web" foca em web. ' +
        'Clique em qualquer operativo para ver/editar seu prompt, ferramentas e parâmetros.' +
        '<div class="ux-tip">💡 Para uma primeira missão, use a formação "Kill Chain Completa" — ela cobre todas as áreas.</div>'
      );
    }

    // EVIDENCE
    var evidence = el('page-evidence');
    if (evidence) {
      insertExplainer(evidence,
        '<strong>🔐 O que é o Cofre de Evidências?</strong> ' +
        'Aqui ficam todas as <strong>vulnerabilidades encontradas</strong> durante as missões. ' +
        'Cada achado tem: <strong>severidade</strong> (Crítico → Baixo), <strong>tipo</strong> (SQL injection, XSS, etc.), ' +
        'e <strong>prova</strong> de que é real (rastreável até o comando que produziu). ' +
        '"Verificado" = uma ferramenta real confirmou. ' +
        'Use <strong>Exportar</strong> para gerar um relatório.' +
        '<div class="ux-tip">💡 Se tudo está zerado, é porque nenhuma missão foi concluída ainda. Lance uma na Sala de Guerra.</div>'
      );
    }

    // ARSENAL
    var arsenal = el('page-arsenal');
    if (arsenal) {
      insertExplainer(arsenal,
        '<strong>📡 O que é o Arsenal?</strong> ' +
        'O Arsenal é seu <strong>armário de ferramentas</strong> de segurança. São 85+ ferramentas em 14 categorias. ' +
        'Clique numa ferramenta para <strong>armá-la</strong> (adicioná-la ao loadout da missão). ' +
        'Use os filtros por categoria (OSINT, SCAN, WEB, etc.) para encontrar o que precisa. ' +
        'Botões rápidos: <strong>"ARMAR TUDO"</strong> arma todas as ferramentas visíveis, ' +
        '<strong>"ATRIBUIR → TODOS"</strong> distribui para todos os operadores.' +
        '<div class="ux-tip">💡 O loadout é consultivo — os operadores podem usar qualquer ferramenta mesmo se não estiver armada.</div>'
      );
    }

    // TERMINAL
    var terminal = el('page-terminal');
    if (terminal) {
      insertExplainer(terminal,
        '<strong>💻 Terminal do T3MP3ST</strong> ' +
        'Terminal de comandos integrado para operações avançadas. ' +
        'Digite <strong>help</strong> para ver todos os comandos disponíveis. ' +
        'Comandos úteis: <strong>status</strong> (ver estado), <strong>scan &lt;alvo&gt;</strong> (iniciar scan), ' +
        '<strong>formation &lt;nome&gt;</strong> (mudar formação de operadores).'
      );
    }

    // BENCHMARKS
    var benchmarks = el('page-benchmarks');
    if (benchmarks) {
      // Renomear OBSIDIVM para algo mais claro
      var obsTitle = benchmarks.querySelector('.card-title');
      if (obsTitle && obsTitle.textContent.indexOf('OBSIDIVM') !== -1) {
        obsTitle.textContent = '📈 Centro de Testes de Desempenho';
      }
      // Renomear na sidebar
      var navBench = document.querySelector('[data-page="benchmarks"] .icon');
      if (navBench) {
        var navText = navBench.parentNode;
        if (navText) {
          var textNodes = Array.from(navText.childNodes).filter(function(n){ return n.nodeType === 3; });
          textNodes.forEach(function(t) {
            if (t.nodeValue.trim() === 'OBSIDIVM') t.nodeValue = ' Centro de Testes';
          });
        }
      }

      insertExplainer(benchmarks,
        '<strong>📈 O que é o Centro de Testes de Desempenho?</strong> ' +
        'Aqui você mede a <strong>capacidade real</strong> do T3MP3ST em desafios de segurança padronizados. ' +
        'São testes baseados em CTFs reais (Cybench, NYU, HTB, CSAW) e frameworks (OWASP Top 10, MITRE ATT&CK, CWE Top 25). ' +
        '<br><br>' +
        '<strong>Como usar:</strong><br>' +
        '• <strong>⚙️ Checagem de Config</strong> — Teste rápido e seguro, valida se tudo está configurado corretamente, sem tocar em nenhum sistema<br>' +
        '• <strong>🔴 Teste ao Vivo</strong> — Teste real onde a IA tenta resolver os desafios (consome tokens da LLM)<br>' +
        '• <strong>Presets rápidos</strong> — Botões para selecionar conjuntos prontos (OWASP, MITRE, CTF, etc.)<br>' +
        '• <strong>Categorias</strong> — Escolha quais tipos de teste rodar (Web, Binário, Cripto, Reversão, Forense, Ops Autônomos)' +
        '<div class="ux-tip">💡 Para um primeiro teste, clique em "⚙️ Checagem de Config" — é seguro e rápido.</div>'
      );
    }

    // CTF RANGE
    var ctf = el('page-ctf-range');
    if (ctf) {
      insertExplainer(ctf,
        '<strong>🚩 O que é o Campo CTF?</strong> ' +
        'CTF = Capture The Flag. São <strong>desafios de segurança controlados</strong> em ambiente seguro. ' +
        'O T3MP3ST tenta "capturar a flag" (encontrar uma string secreta provando que explorou a vulnerabilidade). ' +
        'Ideal para testar o sistema sem riscos em alvos reais.' +
        '<div class="ux-tip">💡 Os desafios aqui são simulados localmente. Para testes com exploração real, use o Centro de Testes.</div>'
      );
    }

    // GENERAL (Comando Autônomo) - explainer movido para improveAdmiralPage()

    // SELF-IMPROVE
    var selfimprove = el('page-selfimprove');
    if (selfimprove) {
      insertExplainer(selfimprove,
        '<strong>🧬 O que é o Autoaperfeiçoamento?</strong> ' +
        'O T3MP3ST analisa seu <strong>próprio desempenho</strong> e propõe melhorias. ' +
        'Mostra: loops de melhoria rodados, configurações alteradas, lições aprendidas. ' +
        'Tudo precisa da <strong>sua aprovação</strong> — nada muda automaticamente.'
      );
    }

    // SETTINGS
    var settings = el('page-settings');
    if (settings) {
      insertExplainer(settings,
        '<strong>⚙️ Configurações — Por onde começar</strong> ' +
        'Esta é a tela de setup do T3MP3ST. O mais importante: <strong>conectar um provedor de IA</strong>. Sem isso, nada funciona. ' +
        '<br><br>' +
        '<strong>Se você usa Ollama local</strong> (como agora), o provider já está configurado no arquivo <code>~/.t3mp3st/.env</code>. ' +
        'Não precisa mexer aqui a menos que queira trocar de provedor. ' +
        '<br><br>' +
        '<strong>Se quiser usar um provedor de nuvem</strong>: escolha o provedor, cole a chave de API, selecione o modelo e salve.' +
        '<div class="ux-tip">💡 Seu setup atual: Ollama local com qwen2.5-coder:7b. Já está funcional.</div>'
      );
    }

    // CONFIGS
    var configs = el('page-configs');
    if (configs) {
      insertExplainer(configs,
        '<strong>💾 O que é a Biblioteca de Configurações?</strong> ' +
        'Salve "snapshots" de configurações do T3MP3ST para reutilizar depois. ' +
        'Útil para manter presets: um para testes web, outro para infra, outro para CTF. ' +
        'Clique "Salvar Config Atual" para guardar o estado atual.'
      );
    }

    // ABOUT
    var about = el('page-about');
    if (about) {
      insertExplainer(about,
        '<strong>ℹ️ Sobre o T3MP3ST</strong> ' +
        'Framework multi-agente de segurança ofensiva movido a IA. ' +
        'Licença AGPL-3.0. Abaixo: domínios cobertos, funcionalidades, e informações do projeto.'
      );
    }
  }

  // ═══════════════════════════════════════════════
  // MODAL DE AJUDA GENÉRICA
  // ═══════════════════════════════════════════════
  function showHelpModal(title, bodyHtml) {
    var existing = document.querySelector('.ux-modal-overlay');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'ux-modal-overlay';
    ov.innerHTML =
      '<div class="ux-modal">' +
      '  <div class="ux-modal-header"><h3>' + title + '</h3><button class="ux-modal-close">&times;</button></div>' +
      '  <div class="ux-modal-body">' + bodyHtml + '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('.ux-modal-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', onEsc); }
    });
  }

  // ═══════════════════════════════════════════════
  // TERMINAL: PAINEL LATERAL DE COMANDOS
  // ═══════════════════════════════════════════════
  var TERM_COMMANDS = {
    'Operadores': [
      { cmd: 'operators', label: 'operators', desc: 'Lista todos os operadores (agentes de IA) que estão ativos na missão atual, mostrando suas ferramentas.', example: 'operators' },
      { cmd: 'spawn ', label: 'spawn <tipo>', desc: 'Implanta (ativa) um operador específico. Tipos disponíveis: recon, scanner, exploiter, infiltrator, exfiltrator, ghost, coordinator, analyst. Cada operador é especialista em uma área.', example: 'spawn recon' },
      { cmd: 'recall ', label: 'recall <tipo>', desc: 'Remove (desativa) um operador ativo. O operador para de trabalhar imediatamente.', example: 'recall scanner' },
      { cmd: 'formation ', label: 'formation <nome>', desc: 'Ativa uma formação tática completa (grupo pré-configurado de operadores). Formações: full_killchain, recon_squad, strike_team, red_team, stealth_ops, apt_sim, web_assault, ad_attack.', example: 'formation full_killchain' },
    ],
    'Arsenal': [
      { cmd: 'tools', label: 'tools', desc: 'Lista todas as ferramentas de segurança disponíveis no arsenal, agrupadas por categoria (OSINT, SCAN, WEB, EXPLOIT, etc.).', example: 'tools' },
      { cmd: 'loadout', label: 'loadout', desc: 'Mostra o loadout atual da missão — quais ferramentas estão selecionadas e armadas para uso.', example: 'loadout' },
      { cmd: 'use ', label: 'use <ferramenta>', desc: 'Adiciona uma ferramenta ao loadout ativo. A ferramenta fica disponível para os operadores usarem durante a missão.', example: 'use nmap' },
      { cmd: 'run ', label: 'run <ferramenta>', desc: 'Carrega uma ferramenta e mostra informações detalhadas sobre ela (categoria, descrição, uso). Abre a tela do terminal com a ferramenta pronta.', example: 'run sqlmap' },
    ],
    'Missão': [
      { cmd: 'status', label: 'status', desc: 'Mostra o status geral da missão: quantos operadores ativos, alvos definidos, achados encontrados, ferramentas no loadout e se a missão está rodando.', example: 'status' },
      { cmd: 'targets', label: 'targets', desc: 'Lista todos os alvos que foram definidos para a missão atual, com seus escopos.', example: 'targets' },
      { cmd: 'findings', label: 'findings', desc: 'Lista todas as vulnerabilidades encontradas até agora, com severidade (CRITICAL, HIGH, MEDIUM, LOW).', example: 'findings' },
      { cmd: 'engage', label: 'engage', desc: 'Inicia a missão! Os operadores começam a trabalhar nos alvos definidos usando as ferramentas do loadout. Equivalente a clicar em ENGAJAR na Sala de Guerra.', example: 'engage' },
      { cmd: 'abort', label: 'abort', desc: 'Aborta a missão imediatamente. Todos os operadores param. Os achados coletados até agora são preservados.', example: 'abort' },
    ],
    'Provas': [
      { cmd: 'proof', label: 'proof', desc: 'Mostra o status da cadeia de provas: total de evidências coletadas, quantas verificadas, quantas são críticas.', example: 'proof' },
      { cmd: 'proof chain', label: 'proof chain', desc: 'Abre o visualizador de cadeia de evidências em detalhe — mostra cada passo rastreável até o comando original.', example: 'proof chain' },
      { cmd: 'proof export', label: 'proof export', desc: 'Exporta um relatório completo de provas em formato Markdown — ideal para compartilhar com a equipe de engenharia.', example: 'proof export' },
      { cmd: 'proof curls', label: 'proof curls', desc: 'Exporta os comandos cURL para reproduzir cada vulnerabilidade encontrada — útil para validação manual e reteste.', example: 'proof curls' },
    ],
    'Sistema': [
      { cmd: 'clear', label: 'clear', desc: 'Limpa toda a saída do terminal. O histórico de comandos é perdido.', example: 'clear' },
      { cmd: 'mode ', label: 'mode <tipo>', desc: 'Define o modo cognitivo dos operadores: adaptive (auto-seleciona), parallel (todos ao mesmo tempo), sequential (um por vez), debate (discussão entre agentes), bestofn (juiz escolhe o melhor).', example: 'mode parallel' },
      { cmd: 'checkpoint save', label: 'checkpoint save', desc: 'Salva um checkpoint manual da missão atual. Permite recuperar o estado depois se algo der errado.', example: 'checkpoint save' },
      { cmd: 'checkpoint recover', label: 'checkpoint recover', desc: 'Recupera o último checkpoint salvo, restaurando o estado da missão.', example: 'checkpoint recover' },
      { cmd: 'autonomous', label: 'autonomous', desc: 'Lança uma missão autônoma completa (BLITZ). O sistema planeja e executa tudo sozinho sem intervenção. ⚠️ Use com cuidado — só em alvos autorizados.', example: 'autonomous' },
    ],
  };

  function buildTerminalSidebar() {
    var termPage = el('page-terminal');
    if (!termPage) return;
    if (termPage.querySelector('.ux-term-sidebar')) return;

    var termCard = termPage.querySelector('.card');
    if (!termCard) return;

    var sidebar = document.createElement('div');
    sidebar.className = 'ux-term-sidebar';
    sidebar.innerHTML = '<div style="font-size:10px;color:#5a7a88;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Comandos Rápidos</div>';

    for (var group in TERM_COMMANDS) {
      var h = document.createElement('h4');
      h.textContent = group;
      sidebar.appendChild(h);

      var cmds = TERM_COMMANDS[group];
      for (var i = 0; i < cmds.length; i++) {
        (function (c) {
          var row = document.createElement('div');
          row.className = 'ux-cmd-row';

          var btn = document.createElement('button');
          btn.className = 'ux-cmd-btn';
          btn.textContent = c.label;
          btn.title = 'Inserir no terminal: ' + c.cmd.trim();
          btn.addEventListener('click', function () {
            var inp = el('terminalInput');
            if (inp) {
              inp.value = c.cmd;
              inp.focus();
            }
          });

          var help = document.createElement('button');
          help.className = 'ux-cmd-help';
          help.textContent = '?';
          help.title = 'O que faz este comando?';
          help.addEventListener('click', function () {
            showHelpModal(
              '💻 Comando: ' + c.label,
              '<p>' + c.desc + '</p>' +
              '<div class="ux-example">$ ' + c.example + '</div>'
            );
          });

          row.appendChild(btn);
          row.appendChild(help);
          sidebar.appendChild(row);
        })(cmds[i]);
      }
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'ux-term-layout';

    var termBody = termCard.querySelector('.terminal');
    var termInput = termCard.querySelector('div[style*="display: flex"]') || termCard.lastElementChild;

    var mainCol = document.createElement('div');
    mainCol.style.cssText = 'flex:1;min-width:0';

    if (termBody) { mainCol.appendChild(termBody); }
    if (termInput) { mainCol.appendChild(termInput); }

    wrapper.appendChild(mainCol);
    wrapper.appendChild(sidebar);
    termCard.appendChild(wrapper);
  }

  // ═══════════════════════════════════════════════
  // ÍCONES DE AJUDA "?" INLINE (Self-Improvement, Configs, etc.)
  // ═══════════════════════════════════════════════
  var HELP_DEFINITIONS = {
    'Tastemaker Quality Gate': {
      title: 'Portão de Qualidade Tastemaker',
      body: 'Um "árbitro de elite" revisa TODAS as saídas dos operadores antes de aceitar. Se a qualidade for baixa, o resultado é rejeitado e o operador tenta novamente. Isso garante que achados e relatórios tenham alta qualidade.'
    },
    'Self-Reflection Loops': {
      title: 'Loops de Auto-reflexão',
      body: 'Os operadores usam o ciclo OODA (Observe-Orient-Decide-Act) combinado com autocrítica. Depois de cada ação, eles refletem sobre o que aprenderam e ajustam a estratégia. Isso melhora o raciocínio ao longo da missão.'
    },
    'Strict Quality Mode': {
      title: 'Modo de Qualidade Estrita',
      body: 'Quando ativado, se uma saída for rejeitada pelo portão de qualidade, o operador tenta novamente até 2 vezes. Se todas as tentativas falharem, o resultado é descartado. Garante que só saídas de alta qualidade passem.'
    },
    'Cognitive Architecture Settings': {
      title: 'Configurações de Arquitetura Cognitiva',
      body: 'Define COMO os operadores pensam juntos:<br><br>' +
        '<strong>Adaptivo</strong> — o sistema escolhe automaticamente o melhor modo<br>' +
        '<strong>Sequencial</strong> — um agente por vez, em ordem<br>' +
        '<strong>Paralelo</strong> — todos trabalham ao mesmo tempo, resultados mesclados<br>' +
        '<strong>Debate</strong> — agentes discutem entre si para chegar à melhor resposta<br>' +
        '<strong>Melhor-de-N</strong> — cada agente dá sua resposta, um juiz escolhe a melhor'
    },
    'Auto-Apply': {
      title: 'Auto-Aplicar Mudanças',
      body: 'Quando ativado, as mudanças de configuração sugeridas pelo loop de autoaperfeiçoamento são aplicadas automaticamente, sem sua aprovação manual. ⚠️ Recomendado deixar desativado até você entender bem o sistema.'
    },
    'Auto-Improve After': {
      title: 'Auto-Melhorar Após',
      body: 'Define após quantas missões o sistema roda automaticamente um loop de autoaperfeiçoamento. Exemplo: "3" = a cada 3 missões, o sistema analisa seu desempenho e propõe melhorias.'
    },
    'Run Improvement Loop Only': {
      title: 'Rodar Só o Loop de Melhoria',
      body: 'Executa o loop de autoaperfeiçoamento AGORA, sem precisar rodar uma missão. O sistema analisa o desempenho passado, propõe mudanças de configuração e mostra os resultados para sua aprovação.'
    },
    // Self-Improvement extra
    'OBSIDIVM Evolution': {
      title: 'Evolução OBSIDIVM',
      body: 'O OBSIDIVM é o motor de benchmarks do T3MP3ST. A "evolução" é um processo onde o sistema testa diferentes configurações em desafios de CTF, mede o desempenho (pontuação), e evolui automaticamente para configurações melhores. É como "seleção natural" de configs — as que pontuam melhor sobrevivem.'
    },
    'Hunter thinking': {
      title: 'Modo de Pensamento do Caçador',
      body: 'Define como o agente "pensa" durante os benchmarks:<br><br>' +
        '<strong>stub</strong> — respostas fixas (rápido, sem custo, para testar o pipeline)<br>' +
        '<strong>live</strong> — usa a LLM real para raciocinar (consome tokens)<br>' +
        '<strong>t3mp3st</strong> — usa o pipeline completo do T3MP3ST com multi-agentes'
    },
    'Judge model': {
      title: 'Modelo do Juiz',
      body: 'O modelo de IA que avalia se as respostas do agente estão corretas. Normalmente usa o mesmo modelo configurado, mas pode usar um diferente para ter uma avaliação imparcial.'
    },
    'Accept threshold': {
      title: 'Limiar de Aceitação',
      body: 'Pontuação mínima (0 a 1) para uma configuração ser aceita na evolução. Exemplo: 0.5 = precisa acertar pelo menos 50% dos desafios. Quanto mais alto, mais exigente a seleção.'
    },
    'Propose for approval': {
      title: 'Propor para Aprovação',
      body: 'Modo seguro: o sistema propõe mudanças de configuração e memória, mas NÃO aplica automaticamente. Você revisa e aprova cada mudança. Recomendado para quem está começando.'
    },
    'Freeze all self-improvement': {
      title: 'Congelar Autoaperfeiçoamento',
      body: 'Desativa TODOS os loops de melhoria. Nenhuma mudança de configuração será proposta ou aplicada. Útil quando você quer manter a configuração estável (ex: durante uma missão importante).'
    },
    'T3MP3ST Agent Memory': {
      title: 'Memória do Agente T3MP3ST',
      body: 'O sistema aprende com cada missão. "Propostas de memória" são lições que o sistema identificou (ex: "nmap funciona melhor com -sV neste tipo de alvo"). Você pode aceitar ou rejeitar cada proposta. Aceitas viram parte do conhecimento permanente.'
    },
    'LearningEngine': {
      title: 'Motor de Aprendizado',
      body: 'Módulo experimental para aprendizado contínuo. Ainda em desenvolvimento (STUB). Quando pronto, vai ajustar automaticamente estratégias com base no histórico de missões.'
    },
    // Settings page
    'Universal API Config': {
      title: 'Configuração Universal de API',
      body: 'Configure seu provedor de IA em um lugar só. O T3MP3ST precisa de uma IA para funcionar — seja na nuvem (OpenRouter, Anthropic, OpenAI) ou local (Ollama). Escolha o provedor, cole a chave de API, selecione o modelo e salve.'
    },
    'API Keys': {
      title: 'Chaves de API',
      body: 'Chaves de acesso para cada provedor de IA. Cada provedor tem sua própria chave. <strong>OpenRouter</strong> é o mais versátil (acessa vários modelos). As chaves ficam salvas localmente no seu navegador — não são enviadas para nenhum servidor externo além do provedor escolhido.'
    },
    'Local Model': {
      title: 'Modelo Local (Ollama)',
      body: 'Configure uma IA rodando no seu próprio computador via Ollama ou qualquer servidor OpenAI-compatível. Vantagens: sem custo de tokens, seus dados não saem da máquina. Desvantagem: modelos menores são menos capazes.<br><br><strong>Seu setup atual:</strong> Ollama com qwen2.5-coder:7b em localhost:11434.'
    },
    'Egress Proxy': {
      title: 'Proxy de Egresso (SOCKS5)',
      body: 'Configure um proxy SOCKS5 para que o tráfego de teste saia por um IP diferente do seu. Importante para: (1) proteger seu IP real durante testes, (2) evitar ser bloqueado pelo alvo. Sem proxy, seu IP real é visível para o alvo.'
    },
    'Local Agents': {
      title: 'Agentes Locais',
      body: 'Conecte CLIs de IA que já rodam no seu computador (Claude Code, Codex, Hermes). O T3MP3ST usa o login deles para conduzir missões — sem precisar de chave de API separada. Clique "Detectar" para encontrar agentes ativos.'
    },
    'Model Selection': {
      title: 'Seleção de Modelo',
      body: 'Escolha qual modelo de IA usar para as operações. Modelos maiores (GPT-4, Claude) são mais capazes mas mais caros. Modelos menores (qwen2.5-coder:7b) são gratuitos localmente mas menos poderosos. O "Modelo de Reserva" é usado quando o principal falha.'
    },
    'Fallback Model': {
      title: 'Modelo de Reserva',
      body: 'Modelo usado quando o modelo principal está indisponível ou falha. Configure para garantir que o sistema continue funcionando mesmo se o provedor principal cair.'
    },
  };

  function addInlineHelpIcons() {
    var pages = ['page-selfimprove', 'page-configs', 'page-settings'];
    for (var p = 0; p < pages.length; p++) {
      var page = el(pages[p]);
      if (!page) continue;

      var labels = page.querySelectorAll('label, .card-title, h3, h4, .section-title, .toggle-label, .setting-label');
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        if (label.querySelector('.ux-inline-help')) continue;
        var text = label.textContent.trim();
        var helpKey = null;
        for (var key in HELP_DEFINITIONS) {
          if (text.indexOf(key) !== -1 || (DYNAMIC_DICT[key] && text.indexOf(DYNAMIC_DICT[key]) !== -1)) {
            helpKey = key;
            break;
          }
        }
        if (helpKey) {
          (function (k) {
            var btn = document.createElement('button');
            btn.className = 'ux-inline-help';
            btn.textContent = '?';
            btn.title = 'O que é isso?';
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              showHelpModal(HELP_DEFINITIONS[k].title, '<p>' + HELP_DEFINITIONS[k].body + '</p>');
            });
            label.appendChild(btn);
          })(helpKey);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR PÁGINA "COMANDO AUTÔNOMO" (ex-Op Admiral)
  // ═══════════════════════════════════════════════
  function improveAdmiralPage() {
    var page = el('page-general');
    if (!page) return;
    if (page.querySelector('.ux-admiral-improved')) return;

    var marker = document.createElement('div');
    marker.className = 'ux-admiral-improved';
    marker.style.display = 'none';
    page.appendChild(marker);

    insertExplainer(page,
      '<strong>🎯 O que é o Comando Autônomo?</strong> ' +
      'Esta tela é o <strong>piloto automático</strong> do T3MP3ST. Em vez de configurar cada detalhe manualmente, ' +
      'você descreve em <strong>português normal</strong> o que quer testar e o sistema planeja tudo sozinho. ' +
      '<br><br>' +
      '<strong>Como usar em 3 passos:</strong><br>' +
      '1️⃣ Escreva no campo grande o que você quer fazer (ex: "Teste a segurança do meu site example.com")<br>' +
      '2️⃣ Escolha o nível OPSEC (Encoberto = discreto, Barulhento = rápido) e urgência<br>' +
      '3️⃣ Clique em <strong>PLANEJAR OPERAÇÃO</strong> para ver o plano primeiro, ou <strong>AUTO COMPLETO</strong> para executar direto' +
      '<div class="ux-tip">💡 Para o primeiro uso, clique em "PLANEJAR OPERAÇÃO" — ele gera o plano sem executar nada. Você revisa e aprova antes.</div>'
    );

    // Traduzir labels específicos da página do Admiral
    var allText = page.querySelectorAll('*');
    for (var i = 0; i < allText.length; i++) {
      var el2 = allText[i];
      if (el2.childNodes.length === 1 && el2.childNodes[0].nodeType === 3) {
        var t = el2.textContent.trim();
        if (t === 'Rules of Engagement') el2.textContent = 'Regras de Engajamento';
        if (t === 'Situation Reports') el2.textContent = 'Relatórios de Situação';
        if (t === 'Strategic Assessment') el2.textContent = 'Avaliação Estratégica';
        if (t === 'Operation Plan') el2.textContent = 'Plano de Operação';
      }
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR PÁGINA SETTINGS (ícones de ajuda nos cabeçalhos)
  // ═══════════════════════════════════════════════
  function improveSettingsPage() {
    var page = el('page-settings');
    if (!page) return;
    if (page.querySelector('.ux-settings-improved')) return;

    var marker = document.createElement('div');
    marker.className = 'ux-settings-improved';
    marker.style.display = 'none';
    page.appendChild(marker);

    // Adicionar ícones "?" nos cabeçalhos de seção
    var sections = page.querySelectorAll('.settings-section, .card');
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var title = sec.querySelector('h3, h4, .card-title, .section-title');
      if (!title) continue;
      if (title.querySelector('.ux-inline-help')) continue;

      var text = title.textContent.trim();
      var helpKey = null;
      for (var key in HELP_DEFINITIONS) {
        if (text.indexOf(key) !== -1 || (DYNAMIC_DICT[key] && text.indexOf(DYNAMIC_DICT[key]) !== -1)) {
          helpKey = key;
          break;
        }
      }
      if (helpKey) {
        (function (k) {
          var btn = document.createElement('button');
          btn.className = 'ux-inline-help';
          btn.textContent = '?';
          btn.title = 'O que é isso?';
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showHelpModal(HELP_DEFINITIONS[k].title, '<p>' + HELP_DEFINITIONS[k].body + '</p>');
          });
          title.appendChild(btn);
        })(helpKey);
      }
    }

    // Traduzir textos específicos da página Settings
    var settingsTexts = {
      'Show': 'Mostrar', 'Hide': 'Ocultar',
      'Deep-ping agents (slower but more reliable)': 'Ping profundo nos agentes (mais lento mas mais confiável)',
      'Enable': 'Ativar', 'Disable': 'Desativar',
      'Detect': 'Detectar',
    };
    var allNodes = page.querySelectorAll('button, label, span');
    for (var j = 0; j < allNodes.length; j++) {
      var n = allNodes[j];
      var t = n.textContent.trim();
      if (settingsTexts[t]) n.textContent = settingsTexts[t];
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR PÁGINA SELF-IMPROVEMENT (ícones de ajuda nos cards)
  // ═══════════════════════════════════════════════
  function improveSelfImprovePage() {
    var page = el('page-selfimprove');
    if (!page) return;
    var root = el('siRoot');
    if (!root || !root.innerHTML.trim()) return;
    if (root.querySelector('.ux-si-improved')) return;

    var marker = document.createElement('div');
    marker.className = 'ux-si-improved';
    marker.style.display = 'none';
    root.appendChild(marker);

    // Traduzir textos estáticos
    var siTexts = {
      'Self-Improvement': 'Autoaperfeiçoamento',
      'Propose for approval': 'Propor para aprovação',
      'Auto-apply': 'Auto-aplicar',
      'Freeze all self-improvement': 'Congelar autoaperfeiçoamento',
      'manual': 'manual',
      'hourly': 'de hora em hora',
      'daily': 'diário',
      'weekly': 'semanal',
      'rollback ON': 'rollback ATIVO',
      'ablation ON': 'ablação ATIVO',
      'Run a pass now': 'Rodar uma passada agora',
      'Reset': 'Resetar',
      'Run a review pass': 'Rodar revisão agora',
      'Copy': 'Copiar',
      'Accept': 'Aceitar',
      'Reject': 'Rejeitar',
      'Pending proposals': 'Propostas pendentes',
      'No pending proposals': 'Nenhuma proposta pendente',
      'Re-show last summary': 'Mostrar último resumo',
      'REAL': 'REAL',
      'STUB': 'PROTÓTIPO',
      'Hunter thinking': 'Pensamento do caçador',
      'Judge model': 'Modelo do juiz',
      'Accept threshold': 'Limiar de aceitação',
      'Max gens': 'Máx gerações',
      'Target grade': 'Nota alvo',
      'Prune-after': 'Podar após',
      'stub': 'stub',
      'live': 'ao vivo',
      'OBSIDIVM Evolution': 'Evolução OBSIDIVM',
      'T3MP3ST Agent Memory': 'Memória do Agente T3MP3ST',
      'Evolution Timeline': 'Linha do Tempo da Evolução',
    };

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    var batch = [];
    while ((node = walker.nextNode())) batch.push(node);
    for (var i = 0; i < batch.length; i++) {
      var n = batch[i];
      if (!n.nodeValue) continue;
      var trimmed = n.nodeValue.trim();
      if (siTexts[trimmed]) {
        var lead = n.nodeValue.match(/^\s*/)[0];
        var tail = n.nodeValue.match(/\s*$/)[0];
        n.nodeValue = lead + siTexts[trimmed] + tail;
      }
    }

    // Adicionar ícones de ajuda nos cards e labels
    var allLabels = root.querySelectorAll('label, h3, h4, strong, .card-title');
    for (var j = 0; j < allLabels.length; j++) {
      var label = allLabels[j];
      if (label.querySelector('.ux-inline-help')) continue;
      var text = label.textContent.trim();
      var helpKey = null;
      for (var key in HELP_DEFINITIONS) {
        if (text === key || text === siTexts[key] || text.indexOf(key) !== -1) {
          helpKey = key;
          break;
        }
      }
      if (helpKey) {
        (function (k) {
          var btn = document.createElement('button');
          btn.className = 'ux-inline-help';
          btn.textContent = '?';
          btn.title = 'O que é isso?';
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showHelpModal(HELP_DEFINITIONS[k].title, '<p>' + HELP_DEFINITIONS[k].body + '</p>');
          });
          label.appendChild(btn);
        })(helpKey);
      }
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR PÁGINA CONFIGS
  // ═══════════════════════════════════════════════
  function improveConfigsPage() {
    var page = el('page-configs');
    if (!page) return;
    if (page.querySelector('.ux-configs-improved')) return;

    var marker = document.createElement('div');
    marker.className = 'ux-configs-improved';
    marker.style.display = 'none';
    page.appendChild(marker);

    // Traduzir botões e labels
    var configTexts = {
      'Save Current Config': 'Salvar Config Atual',
      'Load Default': 'Carregar Padrão',
      'Sort by Date': 'Ordenar por Data',
      'Sort by Score': 'Ordenar por Pontuação',
      'Sort by Name': 'Ordenar por Nome',
      'Load': 'Carregar',
      'Delete': 'Excluir',
      'configs saved': 'configs salvas',
      'No saved configurations yet': 'Nenhuma configuração salva ainda',
    };
    var allNodes = page.querySelectorAll('button, option, span');
    for (var j = 0; j < allNodes.length; j++) {
      var n = allNodes[j];
      var t = n.textContent.trim();
      if (configTexts[t]) n.textContent = configTexts[t];
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR BOTÕES DO ARSENAL
  // ═══════════════════════════════════════════════
  function improveArsenalButtons() {
    var page = el('page-arsenal');
    if (!page) return;

    var buttons = page.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var t = btn.textContent.trim();
      if (t === 'ARM ALL' || t === 'ARMAR TUDO') {
        btn.textContent = '⚔️ ARMAR TUDO';
        btn.title = 'Arma todas as ferramentas visíveis para a missão';
      }
      if (t === '+ARM' || t === '+ ARM') {
        btn.textContent = '➕ Armar';
        btn.title = 'Adiciona esta ferramenta ao loadout da missão';
      }
      if (t === 'ASSIGN' || t === 'ATRIBUIR') {
        btn.textContent = '📌 ATRIBUIR';
        btn.title = 'Atribui o loadout a um operador específico';
      }
      if (t === 'ASSIGN → ALL' || t === 'ATRIBUIR → TODOS') {
        btn.textContent = '📌 ATRIBUIR → TODOS';
        btn.title = 'Distribui o loadout para todos os operadores';
      }
      if (t === 'CLEAR' || t === 'LIMPAR') {
        if (page.contains(btn)) {
          btn.textContent = '🗑️ LIMPAR';
          btn.title = 'Remove todas as ferramentas do loadout';
        }
      }
    }
  }

  // ═══════════════════════════════════════════════
  // MELHORAR VARREDURA AO VIVO (Live Scan)
  // ═══════════════════════════════════════════════
  function improveLiveScanPage() {
    var page = el('page-live-scan');
    if (!page) return;

    // Traduzir labels do sumário (State, Phase, etc.)
    var summaryLabels = {
      'State': 'Estado', 'Phase': 'Fase', 'Progress': 'Progresso',
      'Operators': 'Operadores', 'Tasks': 'Tarefas', 'Stall': 'Travamento'
    };
    var summaryValues = {
      'Paused': 'Pausado', 'Running': 'Rodando', 'Stopped': 'Parado', 'none': 'nenhuma'
    };

    var summary = el('liveScanSummary');
    if (summary) {
      var cells = summary.children;
      for (var i = 0; i < cells.length; i++) {
        var labelEl = cells[i].querySelector('div:first-child');
        var valueEl = cells[i].querySelector('div:last-child');
        if (labelEl) {
          var lt = labelEl.textContent.trim();
          if (summaryLabels[lt]) labelEl.textContent = summaryLabels[lt];
        }
        if (valueEl) {
          var vt = valueEl.textContent.trim();
          if (summaryValues[vt]) valueEl.textContent = summaryValues[vt];
        }
      }

      // Adicionar efeito visual: barra de scan animada quando Running
      var stateCell = cells[0];
      if (stateCell) {
        var stateValue = stateCell.querySelector('div:last-child');
        if (stateValue) {
          var sv = stateValue.textContent.trim();
          if (sv === 'Running' || sv === 'Rodando') {
            stateCell.classList.add('ux-ls-running');
            stateValue.textContent = 'Rodando';
            if (!stateValue.querySelector('.ux-ls-dot')) {
              var dot = document.createElement('span');
              dot.className = 'ux-ls-dot';
              dot.style.cssText = 'display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff88;animation:uxPulse 1.2s ease infinite;margin-left:6px;vertical-align:middle';
              stateValue.appendChild(dot);
            }
          } else {
            stateCell.classList.remove('ux-ls-running');
          }
        }
      }

      // Adicionar barra de progresso visual
      var progressCell = cells[2];
      if (progressCell) {
        var pv = progressCell.querySelector('div:last-child');
        if (pv && !progressCell.querySelector('.ux-ls-progress')) {
          var pct = parseInt(pv.textContent, 10);
          if (!isNaN(pct)) {
            var bar = document.createElement('div');
            bar.className = 'ux-ls-progress';
            bar.innerHTML = '<div class="ux-ls-progress-bar" style="width:' + pct + '%"></div>';
            progressCell.appendChild(bar);
          }
        }
      }
    }

    // Traduzir contadores (e.g. "0 active" → "0 ativo(s)")
    var opCount = el('liveScanOperatorCount');
    if (opCount) {
      opCount.textContent = opCount.textContent
        .replace(/\bbusy\b/, 'ocupado(s)')
        .replace(/\bactive\b/, 'ativo(s)');
    }
    var taskCount = el('liveScanTaskCount');
    if (taskCount) {
      taskCount.textContent = taskCount.textContent.replace(/\btasks?\b/, 'tarefa(s)');
    }
    var feedCount = el('liveScanFeedCount');
    if (feedCount) {
      feedCount.textContent = feedCount.textContent.replace(/\bevents?\b/, 'evento(s)');
    }

    // Melhorar mensagens de estado vazio
    var opPanel = el('liveScanOperators');
    if (opPanel && opPanel.textContent.indexOf('No operator details') !== -1) {
      opPanel.innerHTML =
        '<div class="ux-ls-empty">' +
        '<div class="ux-ls-empty-icon">🤖</div>' +
        '<div class="ux-ls-empty-title">Nenhum operador ativo</div>' +
        '<div class="ux-ls-empty-desc">Os operadores aparecem aqui quando uma missão está rodando. Volte à <strong>Sala de Guerra</strong> e lance uma missão.</div>' +
        '</div>';
    }
    var taskPanel = el('liveScanTasks');
    if (taskPanel && taskPanel.textContent.indexOf('No mission tasks') !== -1) {
      taskPanel.innerHTML =
        '<div class="ux-ls-empty">' +
        '<div class="ux-ls-empty-icon">📋</div>' +
        '<div class="ux-ls-empty-title">Nenhuma tarefa enfileirada</div>' +
        '<div class="ux-ls-empty-desc">As tarefas dos operadores aparecem aqui durante uma missão ativa.</div>' +
        '</div>';
    }
    var feedPanel = el('liveScanFeed');
    if (feedPanel && feedPanel.textContent.indexOf('No live reasoning') !== -1) {
      feedPanel.innerHTML =
        '<div class="ux-ls-empty">' +
        '<div class="ux-ls-empty-icon">💭</div>' +
        '<div class="ux-ls-empty-title">Nenhum evento de raciocínio</div>' +
        '<div class="ux-ls-empty-desc">Aqui aparece em tempo real o que a IA está pensando e quais ferramentas está usando. Inicie uma missão na <strong>Sala de Guerra</strong> para começar.</div>' +
        '</div>';
    }

    // Traduzir status dos operadores e tarefas no painel
    var statusMap = {
      'tasked': 'designado', 'executing': 'executando', 'idle': 'ocioso',
      'completed': 'concluído', 'failed': 'falhou', 'pending': 'pendente',
      'queued': 'enfileirado', 'unknown': 'desconhecido', 'busy': 'ocupado'
    };
    var statusEls = page.querySelectorAll('div[style*="text-transform:uppercase"]');
    for (var s = 0; s < statusEls.length; s++) {
      var st = statusEls[s].textContent.trim().toLowerCase();
      if (statusMap[st]) statusEls[s].textContent = statusMap[st];
    }

    // Traduzir métricas de operadores ("X done · Y failed · risk Z")
    var metricEls = page.querySelectorAll('div[style*="font-size:10px"]');
    for (var m = 0; m < metricEls.length; m++) {
      metricEls[m].textContent = metricEls[m].textContent
        .replace(/\bdone\b/g, 'concluídas')
        .replace(/\bfailed\b/g, 'falharam')
        .replace(/\brisk\b/g, 'risco');
    }
  }

  // ═══════════════════════════════════════════════
  // RENOMEAR HEADERS DE PÁGINA
  // ═══════════════════════════════════════════════
  function renameHeaders() {
    // Traduzir o título dinâmico no header
    var pageTitle = el('pageTitle');
    if (!pageTitle) return;
    var TITLE_MAP = {
      'War Room': 'Sala de Guerra',
      'Live Scan': 'Varredura ao Vivo',
      'Scope Receipts': 'Recibos de Escopo',
      'Operatives': 'Operativos',
      'Evidence Vault': 'Cofre de Evidências',
      'OBSIDIVM': 'Centro de Testes',
      'CTF Range': 'Campo CTF',
      'Arsenal': 'Arsenal',
      'Terminal': 'Terminal',
      'Config Library': 'Biblioteca de Configs',
      'Op Admiral': 'Comando Autônomo',
      'Self-Improvement': 'Autoaperfeiçoamento',
      'Settings': 'Configurações',
      'About': 'Sobre',
    };
    var orig = window._origSetPageTitle || null;
    if (!orig) {
      // Interceptar mudanças de título
      var observer = new MutationObserver(function () {
        var t = pageTitle.textContent.trim();
        if (TITLE_MAP[t]) pageTitle.textContent = TITLE_MAP[t];
      });
      observer.observe(pageTitle, { childList: true, characterData: true, subtree: true });
      // Traduzir o atual
      var t = pageTitle.textContent.trim();
      if (TITLE_MAP[t]) pageTitle.textContent = TITLE_MAP[t];
    }
  }

  // ═══════════════════════════════════════════════
  // EXECUTAR TUDO
  // ═══════════════════════════════════════════════
  function run() {
    translateDynamic();
    addExplainers();
    renameHeaders();
    buildTerminalSidebar();
    addInlineHelpIcons();
    improveAdmiralPage();
    improveArsenalButtons();
    improveSettingsPage();
    improveSelfImprovePage();
    improveConfigsPage();
    improveLiveScanPage();
  }

  // Rodar quando a página estiver pronta
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 300); });
  } else {
    setTimeout(run, 300);
  }

  // Re-rodar quando mudar de página
  var origNav = window.navigateTo;
  if (typeof origNav === 'function') {
    // Cuidado: tour-pt.js também intercepta. Encadear.
    var currentNav = window.navigateTo;
    window.navigateTo = function (page) {
      currentNav(page);
      setTimeout(function () {
        translateDynamic();
        addExplainers();
        renameHeaders();
        buildTerminalSidebar();
        addInlineHelpIcons();
        improveAdmiralPage();
        improveArsenalButtons();
        improveSettingsPage();
        improveSelfImprovePage();
        improveConfigsPage();
        improveLiveScanPage();
      }, 200);
      // Self-Improvement renderiza com 60ms delay, então precisa de re-run adicional
      setTimeout(function () {
        improveSelfImprovePage();
        addInlineHelpIcons();
      }, 500);
    };
  }

  // Rodar periodicamente para pegar conteúdo gerado dinamicamente
  setInterval(function () { translateDynamic(); improveLiveScanPage(); }, 5000);

  window.__t3ux = { run: run, dict: DYNAMIC_DICT };
})();
