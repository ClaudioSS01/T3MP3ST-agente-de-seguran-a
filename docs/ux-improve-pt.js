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
    // Sistema de ABAS (usado em todas as telas)
    '.ux-tabs-bar{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 18px;padding:6px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.07);border-radius:12px}',
    '.ux-tab{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:9px 15px;border-radius:9px;border:1px solid transparent;background:none;cursor:pointer;color:#8a99a5;transition:all .18s;text-align:left;flex:1 1 auto;min-width:120px}',
    '.ux-tab:hover{background:rgba(255,255,255,.04);color:#c0d8e0}',
    '.ux-tab.active{background:linear-gradient(135deg,rgba(47,255,210,.13),rgba(0,136,255,.06));border-color:rgba(47,255,210,.38);color:#fff}',
    '.ux-tab-top{display:flex;align-items:center;gap:7px;width:100%}',
    '.ux-tab-num{font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#2fffd2;opacity:.85;white-space:nowrap}',
    '.ux-tab-name{font-size:13px;font-weight:700;line-height:1.2}',
    '.ux-tab-hint{font-size:10px;color:#5a7a88;line-height:1.3}',
    '.ux-tab.active .ux-tab-hint{color:#8ab8cc}',
    '.ux-tab-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-left:auto;background:#3a4a52;transition:background .3s}',
    '.ux-tab-dot.ok{background:#00ff88;box-shadow:0 0 8px rgba(0,255,136,.5)}',
    '.ux-tab-dot.run{background:#2fffd2;animation:uxPulse 1.1s ease infinite}',
    '.ux-tab-dot.warn{background:#ffaa00}',
    '.ux-tab-dot.wait{background:#3a4a52}',
    '.ux-tab-guide{padding:11px 16px;margin:-6px 0 16px;background:linear-gradient(135deg,rgba(0,136,255,.08),rgba(47,255,210,.04));border:1px solid rgba(0,136,255,.2);border-radius:10px;font-size:12.5px;line-height:1.6;color:#a8c4d4}',
    '.ux-tab-guide strong{color:#2fffd2}',
    '.ux-tab-guide .ux-tab-guide-step{display:inline-block;background:rgba(47,255,210,.14);color:#2fffd2;font-weight:800;border-radius:5px;padding:1px 8px;margin-right:8px;font-size:11px}',
    '@media(max-width:640px){.ux-tab{min-width:calc(50% - 3px)}}',
    // Sub-abas (dentro de uma aba principal)
    '.ux-subtabs{margin:0 0 12px;padding:5px;background:rgba(0,0,0,.35);border-color:rgba(255,255,255,.05)}',
    '.ux-subtabs .ux-tab{padding:7px 12px;min-width:100px}',
    '.ux-subtabs .ux-tab-name{font-size:12px}',
    '.ux-subguide{margin:-6px 0 14px;font-size:12px;background:linear-gradient(135deg,rgba(47,255,210,.06),rgba(0,136,255,.04));border-color:rgba(47,255,210,.18)}',
    // Banner de status REAL da execução
    '.ux-exec-status{padding:12px 16px;margin:0 0 14px;border-radius:10px;font-size:13px;line-height:1.55;display:flex;align-items:flex-start;gap:10px}',
    '.ux-exec-status .ux-es-icon{font-size:20px;flex-shrink:0;line-height:1}',
    '.ux-exec-status.blocked{background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.4);color:#ffb0b0}',
    '.ux-exec-status.blocked strong{color:#ff6666}',
    '.ux-exec-status.live{background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.4);color:#a8f0cc}',
    '.ux-exec-status.live strong{color:#00ff88}',
    '.ux-exec-status.warn{background:rgba(255,170,0,.1);border:1px solid rgba(255,170,0,.4);color:#ffd88a}',
    '.ux-exec-status.warn strong{color:#ffaa00}',
    '.ux-exec-status.idle{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#8a99a5}',
    '.ux-exec-status .ux-es-act{margin-top:6px}',
    '.ux-exec-status .ux-es-btn{display:inline-block;margin-top:6px;padding:4px 12px;border-radius:6px;background:rgba(255,68,68,.15);border:1px solid rgba(255,68,68,.4);color:#ff8888;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none}',
    '.ux-exec-status .ux-es-btn:hover{background:rgba(255,68,68,.25)}',
    // Espelho ao vivo de achados (Etapa 3)
    '.ux-live-findings{padding:12px 14px;margin:0 0 14px;background:rgba(0,0,0,.28);border:1px solid rgba(255,68,68,.2);border-radius:10px}',
    '.ux-lf-head{font-size:12.5px;color:#c0d8e0;margin-bottom:8px}',
    '.ux-lf-head strong{color:#ff8888;font-size:15px}',
    '.ux-lf-sub{color:#5a7a88;font-size:11px}',
    '.ux-lf-list{display:flex;flex-direction:column;gap:4px}',
    '.ux-lf-row{display:grid;grid-template-columns:58px 1fr 130px;gap:8px;align-items:center;padding:5px 8px;background:rgba(255,255,255,.02);border-radius:6px;font-size:11px}',
    '.ux-lf-sev{border:1px solid;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:800;text-align:center;text-transform:uppercase}',
    '.ux-lf-title{color:#d8e4ea;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ux-lf-tgt{color:#7a8a95;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ux-lf-empty{color:#5a7a88;font-size:11.5px;padding:4px 0}',
    // Cofre de Evidências — registro com filtros + notas
    '.ux-ev-ledger{margin-top:16px;padding:14px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);border-radius:12px}',
    '.ux-ev-title{font-size:13px;font-weight:800;color:#2fffd2;margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.ux-ev-title .ux-ev-count{font-size:11px;color:#7a8a95;font-weight:600}',
    '.ux-ev-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
    '.ux-ev-filters select,.ux-ev-filters input{padding:6px 10px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#d8e4ea;font-size:12px}',
    '.ux-ev-filters input{flex:1;min-width:120px}',
    '.ux-ev-overview{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
    '.ux-ev-chip{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid}',
    '.ux-ev-item{padding:10px 12px;margin-bottom:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-left-width:3px;border-radius:8px}',
    '.ux-ev-item-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}',
    '.ux-ev-sev{padding:1px 7px;border-radius:4px;font-size:9px;font-weight:800;text-transform:uppercase}',
    '.ux-ev-item-title{font-size:13px;color:#e4edf2;font-weight:600}',
    '.ux-ev-meta{font-size:10.5px;color:#7a8a95;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:6px}',
    '.ux-ev-note{width:100%;box-sizing:border-box;margin-top:4px;padding:7px 9px;background:rgba(0,0,0,.3);border:1px solid rgba(47,255,210,.15);border-radius:6px;color:#cfe0e8;font-size:12px;font-family:inherit;resize:vertical;min-height:34px}',
    '.ux-ev-note::placeholder{color:#4a5a62}',
    '.ux-ev-empty{text-align:center;color:#5a7a88;padding:26px;font-size:12.5px}',
    '.ux-ev-btn{padding:5px 12px;border-radius:6px;background:rgba(47,255,210,.1);border:1px solid rgba(47,255,210,.3);color:#2fffd2;font-size:11px;font-weight:700;cursor:pointer}',
    '.ux-ev-btn:hover{background:rgba(47,255,210,.18)}',
    '.ux-ev-btn[disabled]{cursor:default}',
    // Abas dentro do modal
    '.ux-mt{padding:6px 14px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:none;color:#8a99a5;font-size:12px;font-weight:600;cursor:pointer}',
    '.ux-mt.active{background:rgba(47,255,210,.12);border-color:rgba(47,255,210,.4);color:#2fffd2}',
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
    'Credentials': 'Credenciais',
    'Critical': 'Crítico',
    'Active Formation': 'Formação Ativa',
    'Custom Deployment': 'Implantação Customizada',

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
        '<div class="ux-tip">💡 Dica: Use o botão <strong>?</strong> no canto inferior direito para um tour detalhado desta tela.</div>' +
        '<div class="ux-tip" style="background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.3);color:#ffcf6b;display:block;margin-top:8px">⚠️ <strong>Importante (documentação oficial do T3MP3ST):</strong> só o operador de <strong>Recon</strong> executa ferramentas de verdade (nmap, DNS, HTTP). As fases seguintes (exploração, etc.) são <strong>andaime/simulação</strong>, não exploração autônoma — nem no projeto original. E o recon precisa do <strong>nmap</strong> instalado, senão a missão trava em "reconnaissance". Para o 1º teste real, use um alvo simples como <code>scanme.nmap.org</code>.</div>'
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
  // MOTOR DE ABAS GENÉRICO (não-invasivo: só mostra/esconde blocos)
  // ═══════════════════════════════════════════════
  // Retorna o ancestral de `anchorEl` que é filho direto de `boundary`.
  function blockOf(anchorEl, boundary) {
    if (!anchorEl) return null;
    var node = anchorEl;
    while (node && node.parentNode && node.parentNode !== boundary) {
      node = node.parentNode;
    }
    return (node && node.parentNode === boundary) ? node : null;
  }
  function blockById(id, boundary) {
    return blockOf(el(id), boundary || null);
  }

  // Cria a barra de abas. def = { page, key, guide, onActivate, tabs:[{num,name,hint,blocks:[el],statusFn}] }
  function makeTabs(def) {
    var page = def.page;
    if (!page) return null;
    if (page.querySelector(':scope > .ux-tabs-bar')) return null;

    // Filtrar blocos nulos
    def.tabs.forEach(function (t) { t.blocks = (t.blocks || []).filter(Boolean); });

    var bar = document.createElement('div');
    bar.className = 'ux-tabs-bar';

    var guide = null;
    if (def.guide) {
      guide = document.createElement('div');
      guide.className = 'ux-tab-guide';
    }

    def.tabs.forEach(function (t, i) {
      var btn = document.createElement('button');
      btn.className = 'ux-tab' + (i === 0 ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('data-ux-tab', i);
      btn.innerHTML =
        '<div class="ux-tab-top">' +
        (t.num ? '<span class="ux-tab-num">' + t.num + '</span>' : '') +
        '<span class="ux-tab-name">' + t.name + '</span>' +
        '<span class="ux-tab-dot wait"></span>' +
        '</div>' +
        (t.hint ? '<span class="ux-tab-hint">' + t.hint + '</span>' : '');
      btn.addEventListener('click', function () { activate(i); });
      bar.appendChild(btn);
    });

    function activate(i, noScroll) {
      var btns = bar.querySelectorAll('.ux-tab');
      for (var b = 0; b < btns.length; b++) btns[b].classList.toggle('active', b === i);
      // esconder todos os blocos gerenciados
      def.tabs.forEach(function (t) {
        t.blocks.forEach(function (el2) { el2.style.display = 'none'; });
      });
      // mostrar os da aba ativa
      def.tabs[i].blocks.forEach(function (el2) { el2.style.display = ''; });
      if (guide) guide.innerHTML = def.tabs[i].guide || '';
      if (typeof def.onActivate === 'function') def.onActivate(i);
      if (!noScroll) { try { page.scrollIntoView({ block: 'start' }); } catch (e) {} }
    }

    // Registrar cada bloco → função de ativar sua aba (para o tour revelar)
    def.tabs.forEach(function (t, ti) {
      t.blocks.forEach(function (el2) {
        try { el2.__uxActivate = function () { activate(ti, true); }; } catch (e) {}
      });
    });

    // Inserir a barra: depois do explainer se houver, senão no topo
    var explainer = page.querySelector(':scope > .ux-explainer');
    if (explainer && explainer.nextSibling) {
      page.insertBefore(bar, explainer.nextSibling);
    } else if (explainer) {
      page.appendChild(bar);
    } else {
      page.insertBefore(bar, page.firstChild);
    }
    if (guide) bar.parentNode.insertBefore(guide, bar.nextSibling);

    // Ativar a primeira aba
    activate(0);

    // Guardar referência para atualização de status
    page.__uxTabs = def;
    page.__uxTabsBar = bar;
    updateTabStatus(page);
    return bar;
  }

  // Atualiza os pontos de status (verde=ok, ciano=rodando, cinza=aguardando)
  function updateTabStatus(page) {
    if (!page || !page.__uxTabs || !page.__uxTabsBar) return;
    var def = page.__uxTabs;
    var dots = page.__uxTabsBar.querySelectorAll('.ux-tab-dot');
    def.tabs.forEach(function (t, i) {
      if (typeof t.statusFn !== 'function' || !dots[i]) return;
      var s = t.statusFn();
      dots[i].className = 'ux-tab-dot ' + (s || 'wait');
    });
  }

  // ═══════════════════════════════════════════════
  // SUB-ABAS (dentro de uma aba principal)
  // ═══════════════════════════════════════════════
  function buildSubTabs(sections) {
    var bar = document.createElement('div');
    bar.className = 'ux-tabs-bar ux-subtabs';
    var guide = document.createElement('div');
    guide.className = 'ux-tab-guide ux-subguide';
    var cur = 0;
    sections.forEach(function (s, i) {
      s.blocks = (s.blocks || []).filter(Boolean);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ux-tab' + (i === 0 ? ' active' : '');
      b.innerHTML = '<div class="ux-tab-top"><span class="ux-tab-name">' + s.name + '</span></div>' +
        (s.hint ? '<span class="ux-tab-hint">' + s.hint + '</span>' : '');
      b.addEventListener('click', function () { setActive(i); });
      bar.appendChild(b);
    });
    function setActive(i) {
      cur = i;
      var btns = bar.querySelectorAll('.ux-tab');
      for (var b = 0; b < btns.length; b++) btns[b].classList.toggle('active', b === i);
      sections.forEach(function (s) { s.blocks.forEach(function (e) { e.style.display = 'none'; }); });
      sections[i].blocks.forEach(function (e) { e.style.display = ''; });
      guide.innerHTML = sections[i].guide || '';
    }
    function reapply() { setActive(cur); }
    // Registro para o tour revelar a sub-aba certa
    sections.forEach(function (s, i) {
      s.blocks.forEach(function (e) { try { e.__uxSubActivate = function () { setActive(i); }; } catch (err) {} });
    });
    return { bar: bar, guide: guide, setActive: setActive, reapply: reapply };
  }

  // ═══════════════════════════════════════════════
  // DETECTOR DE STATUS REAL DA MISSÃO
  // ═══════════════════════════════════════════════
  function setExecStatus(kind, html) {
    var es = el('uxExecStatus');
    if (!es) return;
    es.className = 'ux-exec-status ' + kind;
    es.innerHTML = html;
  }
  function execStatusIdleHtml() {
    return '<span class="ux-es-icon">🕒</span><div><strong>Aguardando lançamento.</strong> ' +
      'Nenhuma missão iniciada nesta sessão. Ao clicar em ENGAJAR, este aviso dirá na hora se a missão ' +
      '<strong>iniciou de verdade</strong> no backend ou se foi bloqueada por um portão de segurança.</div>';
  }
  function installMissionWatcher() {
    if (window.__uxMissionWatch) return;
    var of = window.fetch;
    if (typeof of !== 'function') return;
    window.__uxMissionWatch = true;
    window.fetch = function () {
      var url = '';
      try { url = (arguments[0] && arguments[0].url) || arguments[0] || ''; } catch (e) {}
      var p = of.apply(this, arguments);
      try {
        if (typeof url === 'string' && /\/api\/mission\/(start|stop)/.test(url)) {
          if (/\/start/.test(url)) {
            setExecStatus('warn', '<span class="ux-es-icon">⏳</span><div><strong>Iniciando missão…</strong> pedindo ao backend para despachar os operadores.</div>');
            p.then(function (r) {
              var status = r.status;
              if (status >= 200 && status < 300) {
                setExecStatus('live', '<span class="ux-es-icon">✅</span><div><strong>Missão iniciada no backend — execução REAL em andamento.</strong> Os operadores foram despachados de verdade. Acompanhe o SITREP e os eventos abaixo. Os achados aparecem aqui e na Etapa 4, e são salvos automaticamente.</div>');
              } else if (status === 403) {
                r.clone().json().then(function (j) {
                  var id = j && j.approval && j.approval.id;
                  setExecStatus('blocked',
                    '<span class="ux-es-icon">⛔</span><div><strong>Missão BLOQUEADA — nada está rodando de verdade ainda.</strong> O backend exige aprovação de escopo antes de tocar no alvo (portão de segurança). Os eventos "Deployed the…" que aparecem são o roteiro da interface, não execução real.' +
                    '<div class="ux-es-act">👉 Aprove em <strong>Recibos de Escopo</strong>' + (id ? ' (pedido <code>' + id + '</code>)' : '') + ', ou confirme se o alvo está na sua lista de ativos autorizados.</div>' +
                    '<a class="ux-es-btn" onclick="if(window.navigateTo)navigateTo(\'receipts\')">Abrir Recibos de Escopo →</a></div>');
                }).catch(function () {
                  setExecStatus('blocked', '<span class="ux-es-icon">⛔</span><div><strong>Missão BLOQUEADA (403).</strong> Aprovação de escopo pendente — nada está rodando de verdade. Abra Recibos de Escopo para aprovar.</div>');
                });
              } else {
                r.clone().json().then(function (j) {
                  setExecStatus('warn', '<span class="ux-es-icon">⚠️</span><div><strong>Não foi possível iniciar (' + status + ').</strong> ' + ((j && j.error) ? escapeText(j.error) : 'Verifique se há um alvo definido e uma IA conectada.') + '</div>');
                }).catch(function () {
                  setExecStatus('warn', '<span class="ux-es-icon">⚠️</span><div><strong>Não foi possível iniciar (' + status + ').</strong> Verifique alvo e IA conectada.</div>');
                });
              }
            }).catch(function () {
              setExecStatus('warn', '<span class="ux-es-icon">⚠️</span><div><strong>Falha de rede ao iniciar.</strong> O servidor respondeu com erro. Veja os eventos do sistema.</div>');
            });
          } else {
            setExecStatus('idle', '<span class="ux-es-icon">⏹️</span><div><strong>Missão parada.</strong> Os achados coletados continuam salvos (Etapa 4 e Cofre de Evidências).</div>');
          }
        }
      } catch (e) {}
      return p;
    };
  }
  function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Liga os botões de lançamento para avançar à Etapa 3 (Execução)
  function wireWarRoomLaunch(page, execSub) {
    if (page.__uxLaunchWired) return;
    var opsSection = el('opsSection');
    var toExec = opsSection && opsSection.__uxActivate;
    var btns = page.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var oc = btns[i].getAttribute('onclick') || '';
      if (/launchMission|launchAutonomousMission|startZeroDayHunt|startMissionFromDashboard/i.test(oc)) {
        btns[i].addEventListener('click', function () {
          setTimeout(function () {
            try { if (toExec) toExec(); } catch (e) {}
            try { if (execSub) execSub.setActive(0); } catch (e) {}
            try { window.scrollTo(0, 0); } catch (e) {}
          }, 50);
        });
      }
    }
    page.__uxLaunchWired = true;
  }

  // ═══════════════════════════════════════════════
  // ABAS DA SALA DE GUERRA (etapas do teste)
  // ═══════════════════════════════════════════════
  function txt(id) { var e = el(id); return e ? (e.textContent || '') : ''; }

  function buildWarRoomTabs() {
    var page = el('page-warroom');
    if (!page) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { updateTabStatus(page); return; }

    // Localizar a coluna interna de setup (dentro de .warroom-main-grid)
    var mainGrid = page.querySelector('.warroom-main-grid');
    var setupCol = mainGrid ? mainGrid.querySelector(':scope > div') : null;

    // Blocos de setup (filhos diretos da coluna)
    var preflightCard = setupCol ? blockById('check-operators', setupCol) : null;
    var targetCard = setupCol ? blockById('targetHost', setupCol) : null;
    var swarmCard = setupCol ? blockById('swarmGrid', setupCol) : null;
    var configCard = setupCol ? (blockById('missionName', setupCol) || blockById('opsecLevel', setupCol)) : null;
    var qualityCard = setupCol ? (blockById('qualityBar', setupCol) || blockById('metric-approval', setupCol)) : null;
    var statsCard = setupCol ? blockById('statTargets', setupCol) : null;
    // Quick demo: primeiro filho da coluna que contém onclick launchQuickDemo
    var quickDemoCard = null;
    if (setupCol) {
      var kids = setupCol.children;
      for (var k = 0; k < kids.length; k++) {
        if (kids[k].innerHTML && kids[k].innerHTML.indexOf('launchQuickDemo') !== -1) { quickDemoCard = kids[k]; break; }
      }
    }

    // Blocos de nível de página
    var cmdHeader = blockById('cmdMissionName', page);
    var statusBar = el('systemStatusBar');
    var hero = el('zeroDayHuntHero');
    var opsSection = el('opsSection');
    var clarity = el('operatorDesignLab');
    var cockpit = el('missionCockpit');
    var pliny = el('plinyCodeOpsLayer');
    var findings = el('findingsPanel');

    // ── Sub-abas da Etapa 3 (Execução) + banner de status REAL ──
    var execStatus = document.createElement('div');
    execStatus.id = 'uxExecStatus';
    execStatus.className = 'ux-exec-status idle';
    execStatus.innerHTML = execStatusIdleHtml();

    var liveFindings = document.createElement('div');
    liveFindings.id = 'uxLiveFindings';
    liveFindings.className = 'ux-live-findings';

    var execSub = buildSubTabs([
      {
        name: '⚡ Ao Vivo', hint: 'O que está acontecendo agora',
        guide: 'A <strong>verdade ao vivo</strong>: o SITREP (relatório de situação) e o fluxo de eventos do backend. ⚠️ Os eventos "Deployed the…" e o banner verde são o roteiro da interface — só é <strong>execução real</strong> quando o aviso acima estiver <strong style="color:#00ff88">verde</strong>. Os achados vão aparecendo e sendo salvos aqui embaixo.',
        blocks: [execStatus, liveFindings, cmdHeader, opsSection]
      },
      {
        name: '👥 Operadores', hint: 'O que cada agente faz',
        guide: 'A <strong>Camada de Clareza do Operador</strong>: o que cada agente faz agora, decisões pendentes, estado das travas de segurança e nível de prova coletada.',
        blocks: [clarity]
      },
      {
        name: '📋 Missão', hint: 'Gravador, provas, tarefas',
        guide: 'A <strong>Espinha da Missão</strong>: gravador de voo, bancada de evidências, quadro de ordens, entrada de alvos e recibos — tudo numa superfície só.',
        blocks: [cockpit]
      },
      {
        name: '⚙️ Avançado', hint: 'Camada de operações',
        guide: 'A <strong>Camada de Operações</strong> (avançado): aprovação de ferramentas, pulso da caçada, cognição do enxame, registro de evidências, fila de caça e portões.',
        blocks: [pliny]
      }
    ]);

    makeTabs({
      page: page,
      key: 'warroom',
      guide: true,
      onActivate: function (i) { if (i === 2) setTimeout(execSub.reapply, 0); },
      tabs: [
        {
          num: 'Etapa 1', name: 'Preparação',
          hint: 'Conecte e escolha o alvo',
          guide: '<span class="ux-tab-guide-step">1 de 4</span> <strong>Prepare o terreno.</strong> Verifique se o <strong>Backend</strong> está verde (ONLINE) no Status do Sistema, depois digite o alvo (site, IP, repo ou pacote) no campo de caça. O ponto ao lado da aba fica <strong style="color:#00ff88">verde</strong> quando está tudo pronto.',
          blocks: [statusBar, hero, preflightCard, quickDemoCard, targetCard],
          statusFn: function () {
            var backendOk = /ONLINE|online/.test(txt('sysBackend'));
            var targetOk = (parseInt(txt('targetCount'), 10) || 0) > 0 || ((el('targetHost') && el('targetHost').value.trim()) ? true : false) || ((el('heroHuntTarget') && el('heroHuntTarget').value.trim()) ? true : false);
            return (backendOk && targetOk) ? 'ok' : (backendOk || targetOk) ? 'warn' : 'wait';
          }
        },
        {
          num: 'Etapa 2', name: 'Configuração',
          hint: 'Operadores e modo',
          guide: '<span class="ux-tab-guide-step">2 de 4</span> <strong>Monte a equipe.</strong> Escolha os operadores (agentes de IA) e a formação, defina o nível de furtividade (OPSEC) e o modo. Para começar rápido, a formação "Kill Chain Completa" cobre tudo. O ponto fica verde quando há operadores ativos.',
          blocks: [swarmCard, configCard],
          statusFn: function () {
            var ops = (parseInt(txt('swarmCount'), 10) || parseInt(txt('activeUnitCount'), 10) || 0);
            return ops > 0 ? 'ok' : 'wait';
          }
        },
        {
          num: 'Etapa 3', name: 'Execução',
          hint: 'Lance e acompanhe',
          guide: '<span class="ux-tab-guide-step">3 de 4</span> <strong>Execute e observe.</strong> Ao clicar em ENGAJAR você vem direto para cá. Use as <strong>sub-abas</strong> abaixo para focar. O aviso colorido diz se a missão <strong>iniciou de verdade</strong> no backend ou se foi bloqueada.',
          blocks: [execSub.bar, execSub.guide, cmdHeader, opsSection, clarity, cockpit, pliny],
          statusFn: function () {
            var st = txt('cmdMissionStatus').toLowerCase();
            if (/run|execut|hunt|active|ativ|rodando|engaj/.test(st)) return 'run';
            if (/done|complet|conclu/.test(st)) return 'ok';
            return 'wait';
          }
        },
        {
          num: 'Etapa 4', name: 'Resultados',
          hint: 'Achados e provas',
          guide: '<span class="ux-tab-guide-step">4 de 4</span> <strong>Colha os resultados.</strong> Veja as vulnerabilidades encontradas, com severidade e prova. Use os filtros (Crítico → Baixo) e exporte o relatório. O ponto fica verde quando há achados registrados.',
          blocks: [findings, qualityCard, statsCard],
          statusFn: function () {
            var f = parseInt(txt('findingsCount'), 10) || parseInt(txt('statFindings'), 10) || 0;
            return f > 0 ? 'ok' : 'wait';
          }
        }
      ]
    });

    // Inserir a sub-barra/sub-guia + banners logo após o guia principal
    var mainGuide = page.querySelector(':scope > .ux-tab-guide');
    if (mainGuide && !page.querySelector('.ux-subtabs')) {
      // ordem final: guia principal → sub-bar → sub-guide → status → achados ao vivo
      mainGuide.parentNode.insertBefore(liveFindings, mainGuide.nextSibling);
      mainGuide.parentNode.insertBefore(execStatus, mainGuide.nextSibling);
      mainGuide.parentNode.insertBefore(execSub.guide, mainGuide.nextSibling);
      mainGuide.parentNode.insertBefore(execSub.bar, mainGuide.nextSibling);
    }
    execSub.setActive(0);
    mirrorLive();

    // Ao lançar (ENGAJAR/BLITZ/CAÇAR), avançar para a Execução
    wireWarRoomLaunch(page, execSub);
    // Vigia real: intercepta mission/start e diz se iniciou ou foi bloqueada
    installMissionWatcher();
  }

  // ═══════════════════════════════════════════════
  // ABAS: OPERATIVOS
  // ═══════════════════════════════════════════════
  function buildOperatorsTabs() {
    var page = el('page-operators');
    if (!page) return;
    // Traduzir a área de formação (conteúdo dinâmico)
    translateDynamic();
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var roster = el('operativesRoster');
    // Formation bar = o div flex logo após o roster
    var formationBar = roster ? roster.nextElementSibling : null;

    // Traduzir "Active Formation" e nomes de formação já cobertos pelo dict.
    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '👥', name: 'Especialistas',
          hint: 'Sua equipe de agentes de IA',
          guide: '<strong>Cada especialista</strong> é um agente de IA focado numa área (web, rede, cripto...). Clique num deles para ver/editar prompt, ferramentas e parâmetros. Use "Implantar Tudo" para ativar todos.',
          blocks: [roster]
        },
        {
          num: '⚔️', name: 'Formações',
          hint: 'Combinações prontas de equipe',
          guide: '<strong>Formações</strong> são grupos pré-montados para cenários diferentes: "Kill Chain Completa" ativa todos, "Assalto Web" foca em web, etc. Clique numa formação para ativar os operadores correspondentes de uma vez.',
          blocks: [formationBar]
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: BENCHMARKS (renomeado "Centro de Provas")
  // ═══════════════════════════════════════════════
  function buildBenchmarksTabs() {
    var page = el('page-benchmarks');
    if (!page) return;

    // Renomear OBSIDIVM → Centro de Provas
    var titleEl = page.querySelector('.card-title');
    if (titleEl && titleEl.textContent.indexOf('OBSIDIVM') !== -1) {
      titleEl.textContent = '📈 Centro de Provas de Capacidade';
    }

    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var mainCard = page.querySelector(':scope > .card');
    if (!mainCard) return;

    // Seções internas do card (irmãs)
    function findChild(anchorId) { return blockById(anchorId, mainCard); }
    var catSel = findChild('benchmarkCategorySelector');
    var runOptions = catSel ? catSel.previousElementSibling : null; // Run Options row
    var loopProgress = el('loopProgress');
    var improveBtn = el('selfImprovementBtn') ? blockById('selfImprovementBtn', mainCard) : null;
    var cognitive = mainCard.querySelector('details');

    // Presets: procurar o div que contém loadBenchmarkSuite
    var presets = null, industry = null;
    var kids = mainCard.children;
    for (var i = 0; i < kids.length; i++) {
      var h = kids[i].innerHTML || '';
      if (!presets && h.indexOf('loadBenchmarkSuite') !== -1) presets = kids[i];
      else if (!industry && h.indexOf('loadRealBenchmarks') !== -1) industry = kids[i];
    }

    // Resultados: cards/seções após o mainCard (nível de página)
    var resultBlocks = [];
    var pk = page.children;
    var started = false;
    for (var j = 0; j < pk.length; j++) {
      if (pk[j] === mainCard) { started = true; continue; }
      if (started && pk[j].classList && !pk[j].classList.contains('ux-tabs-bar') && !pk[j].classList.contains('ux-tab-guide') && !pk[j].classList.contains('ux-explainer')) {
        resultBlocks.push(pk[j]);
      }
    }

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '1', name: 'Escolher Testes',
          hint: 'O que você quer avaliar',
          guide: '<strong>Escolha os testes.</strong> Use um preset rápido (OWASP, MITRE, CTF...) ou marque as categorias que quer avaliar (Web, Cripto, Forense...). Cada categoria testa uma habilidade diferente do sistema.',
          blocks: [presets, industry, findChild('benchmarkCategorySelector')]
        },
        {
          num: '2', name: 'Opções',
          hint: 'Como rodar (juiz, auto-melhoria)',
          guide: '<strong>Ajuste como rodar.</strong> "Juiz LLM" usa uma IA para avaliar as respostas. "Auto-Melhorar" roda o loop de aperfeiçoamento após os testes. As configurações cognitivas controlam como os agentes pensam juntos.',
          blocks: [runOptions, improveBtn, cognitive, loopProgress]
        },
        {
          num: '3', name: 'Resultados',
          hint: 'Pontuações e histórico',
          guide: '<strong>Veja os resultados.</strong> Pontuação geral, desempenho por categoria e histórico das execuções. Comece com "⚙️ Checagem de Config" (seguro, rápido) antes de rodar o "🔴 Teste ao Vivo" (consome tokens).',
          blocks: resultBlocks
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: CAMPO CTF (renomeado "Treino CTF")
  // ═══════════════════════════════════════════════
  function buildCtfTabs() {
    var page = el('page-ctf-range');
    if (!page) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var wizard = el('ctfSetupWizard');
    // Range control = próximo grid após o wizard
    var rangeControl = wizard ? wizard.nextElementSibling : null;
    // Blocos de resultado restantes
    var resultBlocks = [];
    var pk = page.children;
    var afterRange = false;
    for (var j = 0; j < pk.length; j++) {
      if (pk[j] === rangeControl) { afterRange = true; continue; }
      if (afterRange && pk[j].classList && !pk[j].classList.contains('ux-tabs-bar') && !pk[j].classList.contains('ux-tab-guide') && !pk[j].classList.contains('ux-explainer')) {
        resultBlocks.push(pk[j]);
      }
    }

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '⚙️', name: 'Preparação',
          hint: 'Configurar o ambiente',
          guide: '<strong>Prepare o ambiente de treino.</strong> Estes desafios rodam em contêineres Docker locais. ⚠️ Você não usa Docker — esta tela é mais ilustrativa. Para testes reais verificados, use o <strong>Centro de Provas</strong>.',
          blocks: [wizard]
        },
        {
          num: '🚩', name: 'Desafios',
          hint: 'Explorar e resolver',
          guide: '<strong>Os desafios (CTF = Capturar a Bandeira).</strong> O sistema tenta encontrar uma "flag" (string secreta) que prova que explorou a vulnerabilidade. Aqui as flags são só verificadas por formato, não contra um alvo real.',
          blocks: [rangeControl].concat(resultBlocks)
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: ARSENAL (mantém a beleza; só organiza catálogo vs loadout)
  // ═══════════════════════════════════════════════
  function buildArsenalTabs() {
    var page = el('page-arsenal');
    if (!page) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var loadout = blockById('loadoutPreview', page) || el('loadoutPreview');
    var grid = blockById('arsenalGrid', page) || el('arsenalGrid');
    var filterBar = page.querySelector('.arsenal-filter-bar');

    if (!grid) return;

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '🧰', name: 'Catálogo',
          hint: 'Escolher e armar ferramentas',
          guide: '<strong>Escolha suas ferramentas.</strong> São 85+ ferramentas em 14 categorias. Use os filtros por categoria e clique numa ferramenta para <strong>armá-la</strong> (adicionar ao loadout). O botão "➕ Armar" adiciona à missão.',
          blocks: [filterBar, grid]
        },
        {
          num: '⚔️', name: 'Meu Loadout',
          hint: 'Ferramentas selecionadas',
          guide: '<strong>Seu loadout ativo.</strong> As ferramentas que você armou para a próxima missão. "⚔️ ARMAR TUDO" arma todas as visíveis, "📌 ATRIBUIR" distribui para operadores. O loadout é consultivo — operadores podem usar qualquer ferramenta.',
          blocks: [loadout]
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: CONFIGURAÇÕES (por categoria)
  // ═══════════════════════════════════════════════
  function buildSettingsTabs() {
    var page = el('page-settings');
    if (!page) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var sections = Array.prototype.slice.call(page.querySelectorAll(':scope > .settings-section'));
    if (!sections.length) return;

    function byTitle(kw) {
      return sections.filter(function (s) {
        var t = s.querySelector('.settings-title');
        return t && kw.some(function (k) { return t.textContent.indexOf(k) !== -1; });
      });
    }

    var cloud = byTitle(['Universal API', 'API Keys', 'Chaves de API', 'Model Selection', 'Seleção de Modelo', 'API Server']);
    var local = byTitle(['Local Model', 'Modelo Local', 'Local Agents', 'Agentes Locais']);
    var net = byTitle(['Egress Proxy', 'Proxy de Egresso']);
    var data = byTitle(['Data', 'Dados']);

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '☁️', name: 'IA na Nuvem',
          hint: 'Provedor, chave e modelo',
          guide: '<strong>Conecte uma IA na nuvem.</strong> Escolha o provedor (OpenRouter é o mais versátil), cole a chave de API e selecione o modelo. É o essencial — sem uma IA conectada, nada funciona.',
          blocks: cloud
        },
        {
          num: '🖥️', name: 'IA Local',
          hint: 'Ollama e agentes locais',
          guide: '<strong>Use uma IA no seu próprio PC.</strong> Sem custo de tokens, dados não saem da máquina. Seu setup atual: Ollama com qwen2.5-coder:7b. Ou conecte um agente já autenticado (Claude Code, Codex).',
          blocks: local
        },
        {
          num: '🧅', name: 'Rede & Privacidade',
          hint: 'Proxy de egresso',
          guide: '<strong>Proteja seu IP.</strong> Configure um proxy SOCKS5 para que o tráfego de teste saia por outro IP (Tor, VPS, túnel SSH). Sem proxy, o alvo vê seu IP real.',
          blocks: net
        },
        {
          num: '⚠️', name: 'Dados',
          hint: 'Limpar dados salvos',
          guide: '<strong>Zona de perigo.</strong> "Limpar Todos os Dados" apaga configurações, chaves e histórico salvos no navegador. Use com cuidado — não tem volta.',
          blocks: data
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: AUTOAPERFEIÇOAMENTO
  // ═══════════════════════════════════════════════
  function buildSelfImproveTabs() {
    var page = el('page-selfimprove');
    if (!page) return;
    var root = el('siRoot');
    if (!root || !root.innerHTML.trim()) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    // O conteúdo é gerado em #siRoot; usamos os cards diretos como blocos.
    var cards = Array.prototype.slice.call(root.children).filter(function (c) {
      return c.nodeType === 1 && !c.classList.contains('ux-si-improved');
    });
    if (cards.length < 2) return;

    // Agrupar: 1º card (governança) = Controles; resto = por conteúdo
    var governanceBlocks = [], evolutionBlocks = [], memoryBlocks = [];
    cards.forEach(function (c) {
      var h = (c.textContent || '').toLowerCase();
      if (h.indexOf('memór') !== -1 || h.indexOf('memory') !== -1 || h.indexOf('propost') !== -1) memoryBlocks.push(c);
      else if (h.indexOf('evolu') !== -1 || h.indexOf('obsid') !== -1 || h.indexOf('timeline') !== -1 || h.indexOf('learning') !== -1 || h.indexOf('aprendiz') !== -1) evolutionBlocks.push(c);
      else governanceBlocks.push(c);
    });

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '🎛️', name: 'Controles',
          hint: 'Como as melhorias são aplicadas',
          guide: '<strong>Você no controle.</strong> "Propor para aprovação" (seguro — você revisa cada mudança) vs "Auto-aplicar". Use "Congelar" para desativar tudo. Nada muda sem sua permissão.',
          blocks: governanceBlocks.length ? governanceBlocks : cards.slice(0, 1)
        },
        {
          num: '🧬', name: 'Evolução',
          hint: 'Testes e aprendizado',
          guide: '<strong>O sistema evolui.</strong> Roda testes, mede desempenho e propõe configurações melhores — como "seleção natural" das configs. Os ícones "?" explicam cada opção.',
          blocks: evolutionBlocks.length ? evolutionBlocks : cards.slice(1)
        },
        {
          num: '🧠', name: 'Memória',
          hint: 'Lições aprendidas',
          guide: '<strong>Memória do agente.</strong> Lições que o sistema identificou nas missões (ex: "nmap funciona melhor com -sV aqui"). Você aceita ou rejeita cada proposta. As aceitas viram conhecimento permanente.',
          blocks: memoryBlocks
        }
      ].filter(function (t) { return t.blocks && t.blocks.length; })
    });
  }

  // ═══════════════════════════════════════════════
  // ABAS: BIBLIOTECA DE CONFIGS
  // ═══════════════════════════════════════════════
  function buildConfigsTabs() {
    var page = el('page-configs');
    if (!page) return;
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var currentCard = blockById('currentConfigSummary', page);
    var savedCard = blockById('configLibraryGrid', page);
    if (!currentCard || !savedCard) return;

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '📊', name: 'Config Atual',
          hint: 'O que está ativo agora',
          guide: '<strong>Sua configuração ativa.</strong> Mostra operadores, formação, modelo e a pontuação do último teste. Use "Salvar Config Atual" (no topo) para guardar este estado e reutilizar depois.',
          blocks: [currentCard]
        },
        {
          num: '💾', name: 'Configs Salvas',
          hint: 'Presets guardados',
          guide: '<strong>Seus presets salvos.</strong> Mantenha configurações diferentes: uma para testes web, outra para infra, outra para CTF. Ordene por data, pontuação ou nome. "Carregar" aplica, a estrela define como padrão.',
          blocks: [savedCard]
        }
      ]
    });
  }

  // ═══════════════════════════════════════════════
  // CLAREZA: RECIBOS DE ESCOPO
  // ═══════════════════════════════════════════════
  var RC_PAGE = 0;
  var RC_SIZE = 8;

  function rcApprovals() {
    try { if (typeof ReceiptsState !== 'undefined' && ReceiptsState && Array.isArray(ReceiptsState.approvals)) return ReceiptsState.approvals; }
    catch (e) {}
    return [];
  }
  function rcDate(a) {
    return a.createdAt || a.requestedAt || a.timestamp || a.time || a.expiresAt || null;
  }

  function improveReceiptsPage() {
    var page = el('page-receipts');
    if (!page) return;
    if (!page.querySelector('.ux-receipts-steps')) {
      var explainer = page.querySelector('.ux-explainer');
      var steps = document.createElement('div');
      steps.className = 'ux-receipts-steps ux-tab-guide';
      steps.innerHTML =
        '<strong>O que é esta tela:</strong> o histórico de tudo que o sistema pediu para fazer nos alvos (cada busca/ação vira um registro). ' +
        '⚠️ Os itens <strong style="color:#ffaa00">pendentes</strong> estão <strong>esperando sua permissão</strong> — é aqui que você libera o que estava bloqueado (aquele erro 403). ' +
        'Clique em qualquer item para ver <strong>todos os detalhes</strong>. Use a busca e o filtro de data abaixo.';
      if (explainer && explainer.nextSibling) page.insertBefore(steps, explainer.nextSibling);
      else if (explainer) page.appendChild(steps);
    }

    // Construir a barra de filtros + lista customizada (uma vez)
    if (!el('uxRcControls')) {
      var origList = el('receiptsList');
      if (!origList) return;
      // Esconder a lista original; usamos a nossa (mesmo dado, com filtros/paginação)
      origList.style.display = 'none';

      var controls = document.createElement('div');
      controls.id = 'uxRcControls';
      controls.className = 'ux-ev-filters';
      controls.style.margin = '0 0 12px';
      controls.innerHTML =
        '<input id="uxRcSearch" type="text" placeholder="🔎 Buscar por alvo, ação, motivo ou ID...">' +
        '<input id="uxRcFrom" type="date" title="De">' +
        '<input id="uxRcTo" type="date" title="Até">' +
        '<select id="uxRcStatus"><option value="">Todo status</option><option value="pending">Pendente</option><option value="approved">Aprovado</option><option value="rejected">Rejeitado</option><option value="expired">Expirado</option></select>';
      origList.parentNode.insertBefore(controls, origList);

      var mine = document.createElement('div');
      mine.id = 'uxRcList';
      origList.parentNode.insertBefore(mine, origList);

      var pager = document.createElement('div');
      pager.id = 'uxRcPager';
      pager.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:center;padding:12px;';
      origList.parentNode.insertBefore(pager, origList.nextSibling);

      ['uxRcSearch', 'uxRcFrom', 'uxRcTo', 'uxRcStatus'].forEach(function (id) {
        var e = el(id);
        if (e) e.addEventListener(id === 'uxRcSearch' ? 'input' : 'change', function () { RC_PAGE = 0; renderReceiptsUx(); });
      });

      // Re-renderizar periodicamente (o app atualiza ReceiptsState a cada 4s)
      setInterval(function () {
        if (el('page-receipts') && el('page-receipts').classList.contains('active')) renderReceiptsUx();
      }, 2000);
    }
    renderReceiptsUx();
  }

  function rcFiltered() {
    var all = rcApprovals().slice();
    var q = ((el('uxRcSearch') || {}).value || '').toLowerCase();
    var from = (el('uxRcFrom') || {}).value || '';
    var to = (el('uxRcTo') || {}).value || '';
    var st = (el('uxRcStatus') || {}).value || '';
    return all.filter(function (a) {
      if (st && (a.status || '') !== st) return false;
      if (q) {
        var hay = ((a.id || '') + ' ' + (a.target || '') + ' ' + (a.action || '') + ' ' + (a.reason || '') + ' ' + (a.requestedBy || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (from || to) {
        var d = rcDate(a);
        if (d) {
          var day = new Date(d).toISOString().slice(0, 10);
          if (from && day < from) return false;
          if (to && day > to) return false;
        }
      }
      return true;
    });
  }

  function rcStatusColor(s) {
    s = String(s || '').toLowerCase();
    if (s === 'approved') return '#00ff88';
    if (s === 'pending') return '#ffaa00';
    if (s === 'rejected' || s === 'expired') return '#ff6666';
    return '#8a99a5';
  }
  function rcStatusLabel(s) {
    var m = { approved: 'Aprovado', pending: 'Pendente', rejected: 'Rejeitado', expired: 'Expirado' };
    return m[String(s || '').toLowerCase()] || (s || '—');
  }

  function renderReceiptsUx() {
    var list = el('uxRcList'); if (!list) return;
    var filtered = rcFiltered();
    var total = filtered.length;
    var pages = Math.max(1, Math.ceil(total / RC_SIZE));
    if (RC_PAGE >= pages) RC_PAGE = pages - 1;
    var slice = filtered.slice(RC_PAGE * RC_SIZE, RC_PAGE * RC_SIZE + RC_SIZE);

    if (!rcApprovals().length) {
      list.innerHTML = '<div class="ux-ev-empty">Nenhum registro ainda. Quando o sistema pedir para executar ações nos alvos, elas aparecem aqui.</div>';
    } else if (!total) {
      list.innerHTML = '<div class="ux-ev-empty">Nenhum registro corresponde aos filtros.</div>';
    } else {
      list.innerHTML = slice.map(function (a, i) {
        var idx = RC_PAGE * RC_SIZE + i;
        var color = rcStatusColor(a.status);
        var d = rcDate(a);
        var when = d ? new Date(d).toLocaleString() : '';
        return '<div class="ux-ev-item" style="border-left-color:' + color + ';cursor:pointer" onclick="window.__t3ux.rcModal(' + idx + ')">' +
          '<div class="ux-ev-item-top">' +
          '<span class="ux-ev-sev" style="color:' + color + ';background:rgba(255,255,255,.04)">' + escapeText(rcStatusLabel(a.status)) + '</span>' +
          '<span class="ux-ev-item-title">' + escapeText(a.target || '-') + '</span>' +
          '</div>' +
          '<div class="ux-ev-meta"><span>⚙️ ' + escapeText(a.action || '-') + '</span>' + (when ? '<span>🕒 ' + escapeText(when) + '</span>' : '') + '<span style="font-family:monospace;font-size:9px">' + escapeText(a.id || '') + '</span></div>' +
          (a.reason ? '<div style="font-size:11.5px;color:#9fb0bd">' + escapeText(String(a.reason).slice(0, 120)) + '</div>' : '') +
          (String(a.status).toLowerCase() === 'pending'
            ? '<div style="margin-top:8px;display:flex;gap:8px" onclick="event.stopPropagation()"><button class="ux-ev-btn" style="background:rgba(0,255,136,.12);border-color:rgba(0,255,136,.4);color:#00ff88" onclick="if(window.approveReceipt)approveReceipt(\'' + escapeText(a.id) + '\')">✓ Aprovar</button><button class="ux-ev-btn" style="background:rgba(255,68,68,.1);border-color:rgba(255,68,68,.35);color:#ff8888" onclick="if(window.rejectReceipt)rejectReceipt(\'' + escapeText(a.id) + '\')">✕ Rejeitar</button></div>'
            : '') +
          '</div>';
      }).join('');
    }

    var pager = el('uxRcPager');
    if (pager) {
      if (total > RC_SIZE) {
        pager.style.display = 'flex';
        pager.innerHTML =
          '<button class="ux-ev-btn" id="uxRcPrev"' + (RC_PAGE <= 0 ? ' disabled style="opacity:.4"' : '') + '>← Anterior</button>' +
          '<span style="font-size:12px;color:#8a99a5">Página ' + (RC_PAGE + 1) + ' de ' + pages + ' · ' + total + ' registros</span>' +
          '<button class="ux-ev-btn" id="uxRcNext"' + (RC_PAGE >= pages - 1 ? ' disabled style="opacity:.4"' : '') + '>Próxima →</button>';
        var pv = el('uxRcPrev'), nx = el('uxRcNext');
        if (pv) pv.addEventListener('click', function () { if (RC_PAGE > 0) { RC_PAGE--; renderReceiptsUx(); } });
        if (nx) nx.addEventListener('click', function () { if (RC_PAGE < pages - 1) { RC_PAGE++; renderReceiptsUx(); } });
      } else {
        pager.style.display = 'none';
      }
    }
  }

  function rcModal(idx) {
    var a = rcFiltered()[idx];
    if (!a) return;
    var color = rcStatusColor(a.status);
    var d = rcDate(a);
    var when = d ? new Date(d).toLocaleString() : '—';
    var expires = a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '—';

    var resumo =
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      rcRow('Status', '<span style="color:' + color + ';font-weight:700">' + escapeText(rcStatusLabel(a.status)) + '</span>') +
      rcRow('Alvo', escapeText(a.target || '-')) +
      rcRow('Ação', escapeText(a.action || '-')) +
      rcRow('Pedido por', escapeText(a.requestedBy || '-')) +
      rcRow('Quando', escapeText(when)) +
      rcRow('Expira', escapeText(expires)) +
      rcRow('ID', '<code>' + escapeText(a.id || '') + '</code>') +
      '</table>';

    var detalhes = '<div style="font-size:13px;line-height:1.6;color:#c0d4de">' +
      (a.reason ? '<p><strong style="color:#2fffd2">Motivo:</strong><br>' + escapeText(a.reason) + '</p>' : '<p style="color:#7a8a95">Sem motivo detalhado.</p>') +
      (a.scope ? '<p><strong style="color:#2fffd2">Escopo:</strong> ' + escapeText(typeof a.scope === 'string' ? a.scope : JSON.stringify(a.scope)) + '</p>' : '') +
      (a.tool ? '<p><strong style="color:#2fffd2">Ferramenta:</strong> ' + escapeText(a.tool) + '</p>' : '') +
      (a.risk ? '<p><strong style="color:#2fffd2">Risco:</strong> ' + escapeText(a.risk) + '</p>' : '') +
      '</div>';

    var json = '<pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;color:#8ab8cc;background:rgba(0,0,0,.3);padding:10px;border-radius:6px;max-height:300px;overflow:auto">' + escapeText(JSON.stringify(a, null, 2)) + '</pre>';

    var acao = String(a.status).toLowerCase() === 'pending'
      ? '<div style="font-size:13px;color:#c0d4de;line-height:1.6"><p>Este pedido está <strong style="color:#ffaa00">aguardando sua decisão</strong>. Aprovar libera a ação no alvo; rejeitar bloqueia.</p>' +
        '<div style="display:flex;gap:10px;margin-top:12px">' +
        '<button class="ux-ev-btn" style="background:rgba(0,255,136,.14);border-color:rgba(0,255,136,.45);color:#00ff88;padding:8px 16px" onclick="if(window.approveReceipt)approveReceipt(\'' + escapeText(a.id) + '\');document.querySelector(\'.ux-modal-overlay\').remove()">✓ Aprovar</button>' +
        '<button class="ux-ev-btn" style="background:rgba(255,68,68,.12);border-color:rgba(255,68,68,.4);color:#ff8888;padding:8px 16px" onclick="if(window.rejectReceipt)rejectReceipt(\'' + escapeText(a.id) + '\');document.querySelector(\'.ux-modal-overlay\').remove()">✕ Rejeitar</button>' +
        '</div></div>'
      : '<div style="font-size:13px;color:#8a99a5">Este pedido já foi <strong style="color:' + color + '">' + escapeText(rcStatusLabel(a.status)) + '</strong>. Nenhuma ação pendente.</div>';

    var body =
      '<div class="ux-modal-tabs" style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">' +
      '<button class="ux-mt active" data-t="0">Resumo</button>' +
      '<button class="ux-mt" data-t="1">Detalhes</button>' +
      '<button class="ux-mt" data-t="2">Ação</button>' +
      '<button class="ux-mt" data-t="3">Dados</button>' +
      '</div>' +
      '<div class="ux-mt-panel" data-p="0">' + resumo + '</div>' +
      '<div class="ux-mt-panel" data-p="1" style="display:none">' + detalhes + '</div>' +
      '<div class="ux-mt-panel" data-p="2" style="display:none">' + acao + '</div>' +
      '<div class="ux-mt-panel" data-p="3" style="display:none">' + json + '</div>';

    showHelpModal('🔎 Detalhes do registro', body);

    // Ligar as abas do modal
    var ov = document.querySelector('.ux-modal-overlay');
    if (ov) {
      var tabs = ov.querySelectorAll('.ux-mt');
      var panels = ov.querySelectorAll('.ux-mt-panel');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
          var t = this.getAttribute('data-t');
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('active', tabs[j] === this);
          for (var k = 0; k < panels.length; k++) panels[k].style.display = panels[k].getAttribute('data-p') === t ? '' : 'none';
        });
      }
    }
  }
  function rcRow(k, v) {
    return '<tr><td style="padding:6px 10px 6px 0;color:#7a8a95;white-space:nowrap;vertical-align:top">' + k + '</td><td style="padding:6px 0;color:#d8e4ea">' + v + '</td></tr>';
  }

  // ═══════════════════════════════════════════════
  // CLAREZA: COFRE DE EVIDÊNCIAS
  // ═══════════════════════════════════════════════
  function improveEvidencePage() {
    var page = el('page-evidence');
    if (!page) return;
    // Traduzir labels dos stat-cards
    var labelMap = { 'Critical': 'Crítico', 'High': 'Alto', 'Medium': 'Médio', 'Credentials': 'Credenciais' };
    var labels = page.querySelectorAll('.stat-label');
    for (var i = 0; i < labels.length; i++) {
      var t = labels[i].textContent.trim();
      if (labelMap[t]) labels[i].textContent = labelMap[t];
    }
    if (page.querySelector(':scope > .ux-tabs-bar')) { return; }

    var statsGrid = page.querySelector('.stats-grid');
    var findingsCard = blockById('findingsGrid', page);
    if (!statsGrid || !findingsCard) return;

    makeTabs({
      page: page,
      guide: true,
      tabs: [
        {
          num: '📊', name: 'Resumo',
          hint: 'Contagem por severidade',
          guide: '<strong>Visão geral dos achados.</strong> Contagem por severidade: <strong style="color:#ff4444">Crítico</strong> (risco imediato), <strong style="color:#ffaa00">Alto</strong>, <strong style="color:#00aaff">Médio</strong>, e Credenciais encontradas. Zero em tudo = nenhuma missão concluída ainda.',
          blocks: [statsGrid]
        },
        {
          num: '🔓', name: 'Achados',
          hint: 'Lista detalhada + provas',
          guide: '<strong>Cada vulnerabilidade encontrada.</strong> Com tipo, severidade, alvo e prova rastreável até o comando que produziu o resultado. "Verificado" = uma ferramenta real confirmou, não é a IA supondo. Use "Exportar" para o relatório.',
          blocks: [findingsCard]
        }
      ]
    });
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
      'Scope Receipts': 'Histórico de Buscas',
      'Operatives': 'Agentes',
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
  // PERSISTÊNCIA DE ACHADOS (localStorage) + REGISTRO
  // ═══════════════════════════════════════════════
  var FKEY = 't3ux_findings_v1';
  var NKEY = 't3ux_notes_v1';
  var _evLast = [];

  function mfArray() {
    try { return (typeof missionFindings !== 'undefined' && Array.isArray(missionFindings)) ? missionFindings : null; }
    catch (e) { return null; }
  }
  function fkeyOf(f) { return (f.timestamp || '') + '|' + (f.title || '') + '|' + (f.target || ''); }
  function stampFinding(f) {
    if (f && !f._uxTs) { try { f._uxTs = Date.now(); f._uxDate = new Date().toISOString().slice(0, 10); } catch (e) {} }
    return f;
  }
  function loadSaved() { try { return JSON.parse(localStorage.getItem(FKEY) || '[]'); } catch (e) { return []; } }
  function saveFindings() {
    var mf = mfArray(); if (!mf) return;
    try {
      localStorage.setItem(FKEY, JSON.stringify(mf.map(function (f) {
        return { timestamp: f.timestamp, severity: f.severity, type: f.type, title: f.title, target: f.target, phase: f.phase, detail: f.detail, evidence: f.evidence, provenance: f.provenance, _uxDate: f._uxDate, _uxTs: f._uxTs };
      })));
    } catch (e) {}
  }
  function loadNotes() { try { return JSON.parse(localStorage.getItem(NKEY) || '{}'); } catch (e) { return {}; } }
  function saveNote(k, v) { var n = loadNotes(); if (v && v.trim()) n[k] = v; else delete n[k]; try { localStorage.setItem(NKEY, JSON.stringify(n)); } catch (e) {} }

  function restoreFindings() {
    var mf = mfArray(); if (!mf) return;
    var saved = loadSaved(); if (!saved.length) return;
    var seen = {}; mf.forEach(function (f) { seen[fkeyOf(f)] = true; });
    var added = 0;
    saved.forEach(function (s) {
      if (seen[fkeyOf(s)]) return;
      seen[fkeyOf(s)] = true;
      s.id = mf.length + 1;
      mf.push(s); added++;
    });
    if (added) {
      try {
        var body = el('findingsBody');
        if (body && typeof window.renderFindingsRow === 'function') {
          body.innerHTML = '';
          mf.forEach(function (f) { window.renderFindingsRow(f); });
        }
        if (typeof window.renderFindings === 'function') window.renderFindings();
        var cnt = el('findingsCount'); if (cnt) cnt.textContent = '(' + mf.length + ')';
        var sf = el('statFindings'); if (sf) sf.textContent = mf.length;
      } catch (e) {}
    }
  }

  function installFindings() {
    if (window.addFinding && !window.addFinding.__uxWrapped) {
      var orig = window.addFinding;
      window.addFinding = function (f) {
        try { if (f) stampFinding(f); } catch (e) {}
        var r = orig.apply(this, arguments);
        try { saveFindings(); mirrorLive(); renderEvidenceLedger(); } catch (e) {}
        return r;
      };
      window.addFinding.__uxWrapped = true;
    }
    if (window.clearFindings && !window.clearFindings.__uxWrapped) {
      var oc = window.clearFindings;
      window.clearFindings = function () {
        var r = oc.apply(this, arguments);
        try { localStorage.removeItem(FKEY); mirrorLive(); renderEvidenceLedger(); } catch (e) {}
        return r;
      };
      window.clearFindings.__uxWrapped = true;
    }
    // Substituir o modal de detalhe do achado pelo nosso (rico, em PT, com "replicar")
    if (!window.__uxFindingModal) {
      window.showFindingDetail = function (index) {
        var mf = mfArray();
        var f = mf && mf[index];
        if (f) findingModalFor(f);
      };
      window.__uxFindingModal = true;
    }

    restoreFindings();
    mirrorLive();
  }

  // Espelho ao vivo dos achados na Etapa 3
  function mirrorLive() {
    var box = el('uxLiveFindings'); if (!box) return;
    var mf = mfArray() || loadSaved();
    var n = mf.length;
    var last = mf.slice(-6).reverse();
    var sevColor = { critical: '#ff0040', high: '#ff4444', medium: '#ffaa00', low: '#0088ff', info: '#888' };
    box.innerHTML =
      '<div class="ux-lf-head">🎯 Achados nesta sessão: <strong>' + n + '</strong> <span class="ux-lf-sub">· salvos automaticamente · veja todos na Etapa 4 e no Cofre de Evidências</span></div>' +
      (n
        ? '<div class="ux-lf-list">' + last.map(function (f) {
            var c = sevColor[(f.severity || 'info').toLowerCase()] || '#888';
            return '<div class="ux-lf-row"><span class="ux-lf-sev" style="color:' + c + ';border-color:' + c + '">' + escapeText((f.severity || '').toUpperCase()) + '</span><span class="ux-lf-title">' + escapeText(f.title || '') + '</span><span class="ux-lf-tgt">' + escapeText(f.target || '-') + '</span></div>';
          }).join('') + '</div>'
        : '<div class="ux-lf-empty">Nenhum achado ainda. Quando os operadores encontrarem algo, aparece aqui na hora — mesmo que você troque de aba, continua rodando e salvando.</div>');
  }

  // ═══════════════════════════════════════════════
  // COFRE DE EVIDÊNCIAS — registro com filtros + notas
  // ═══════════════════════════════════════════════
  function unionFindings() {
    var mf = mfArray() || [];
    var map = {};
    mf.forEach(function (f) { map[fkeyOf(f)] = f; });
    loadSaved().forEach(function (s) { if (!map[fkeyOf(s)]) map[fkeyOf(s)] = s; });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function buildEvidenceLedger() {
    var page = el('page-evidence'); if (!page) return;
    if (el('uxEvLedger')) return;
    var findingsCard = page.querySelector('.card');
    if (!findingsCard) return;

    var ledger = document.createElement('div');
    ledger.id = 'uxEvLedger';
    ledger.className = 'ux-ev-ledger';
    ledger.innerHTML =
      '<div class="ux-ev-title">🗂️ Registro de Achados <span class="ux-ev-count" id="uxEvCount"></span>' +
      '<button class="ux-ev-btn" style="margin-left:auto" id="uxEvExport">📥 Exportar</button></div>' +
      '<div class="ux-ev-filters">' +
      '<select id="uxEvSev"><option value="">Toda severidade</option><option value="critical">Crítico</option><option value="high">Alto</option><option value="medium">Médio</option><option value="low">Baixo</option><option value="cred">Credenciais</option></select>' +
      '<select id="uxEvTarget"><option value="">Todo alvo / projeto</option></select>' +
      '<select id="uxEvDate"><option value="">Toda data</option></select>' +
      '<input id="uxEvSearch" type="text" placeholder="Buscar no texto do achado...">' +
      '</div>' +
      '<div class="ux-ev-overview" id="uxEvOverview"></div>' +
      '<div id="uxEvList"></div>';
    findingsCard.appendChild(ledger);

    ['uxEvSev', 'uxEvTarget', 'uxEvDate'].forEach(function (id) {
      var e = el(id); if (e) e.addEventListener('change', renderEvidenceLedger);
    });
    var srch = el('uxEvSearch'); if (srch) srch.addEventListener('input', renderEvidenceLedger);
    var exp = el('uxEvExport'); if (exp) exp.addEventListener('click', exportLedger);

    renderEvidenceLedger();
  }

  function renderEvidenceLedger() {
    var list = el('uxEvList'); if (!list) return;
    var all = unionFindings();
    // popular selects de alvo e data (uma vez por render, preservando seleção)
    var tgtSel = el('uxEvTarget'), dateSel = el('uxEvDate');
    if (tgtSel) {
      var curT = tgtSel.value;
      var targets = {}; all.forEach(function (f) { if (f.target) targets[f.target] = 1; });
      tgtSel.innerHTML = '<option value="">Todo alvo / projeto</option>' + Object.keys(targets).sort().map(function (t) { return '<option value="' + escapeText(t) + '">' + escapeText(t) + '</option>'; }).join('');
      tgtSel.value = curT;
    }
    if (dateSel) {
      var curD = dateSel.value;
      var dates = {}; all.forEach(function (f) { if (f._uxDate) dates[f._uxDate] = 1; });
      dateSel.innerHTML = '<option value="">Toda data</option>' + Object.keys(dates).sort().reverse().map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
      dateSel.value = curD;
    }

    var fSev = (el('uxEvSev') || {}).value || '';
    var fTgt = (el('uxEvTarget') || {}).value || '';
    var fDate = (el('uxEvDate') || {}).value || '';
    var fTxt = ((el('uxEvSearch') || {}).value || '').toLowerCase();

    var filtered = all.filter(function (f) {
      if (fSev === 'cred') { if ((f.type || '') !== 'cred') return false; }
      else if (fSev && (f.severity || '') !== fSev) return false;
      if (fTgt && (f.target || '') !== fTgt) return false;
      if (fDate && (f._uxDate || '') !== fDate) return false;
      if (fTxt) {
        var hay = ((f.title || '') + ' ' + (f.detail || '') + ' ' + (f.target || '')).toLowerCase();
        if (hay.indexOf(fTxt) === -1) return false;
      }
      return true;
    });

    // overview
    var ov = el('uxEvOverview');
    if (ov) {
      var counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      all.forEach(function (f) { var s = (f.severity || 'info').toLowerCase(); if (counts[s] != null) counts[s]++; });
      var cc = { critical: '#ff0040', high: '#ff4444', medium: '#ffaa00', low: '#0088ff', info: '#888' };
      var lbl = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo', info: 'Info' };
      ov.innerHTML = Object.keys(counts).map(function (s) {
        return '<span class="ux-ev-chip" style="color:' + cc[s] + ';border-color:' + cc[s] + '">' + lbl[s] + ': ' + counts[s] + '</span>';
      }).join('');
    }
    var cnt = el('uxEvCount'); if (cnt) cnt.textContent = '(' + filtered.length + ' de ' + all.length + ')';

    if (!all.length) {
      list.innerHTML = '<div class="ux-ev-empty">Nenhum achado registrado ainda. Lance uma missão na Sala de Guerra — os achados aparecem aqui automaticamente e ficam salvos no seu navegador, mesmo depois de recarregar a página.</div>';
      return;
    }
    if (!filtered.length) {
      list.innerHTML = '<div class="ux-ev-empty">Nenhum achado corresponde aos filtros selecionados.</div>';
      return;
    }

    var notes = loadNotes();
    var sevColor = { critical: '#ff0040', high: '#ff4444', medium: '#ffaa00', low: '#0088ff', info: '#888' };
    var typeIcon = { vuln: '🔓', cred: '🔑', access: '🚪', info: 'ℹ️' };
    filtered.sort(function (a, b) { return (b._uxTs || 0) - (a._uxTs || 0); });
    _evLast = filtered;
    list.innerHTML = filtered.map(function (f, idx) {
      var c = sevColor[(f.severity || 'info').toLowerCase()] || '#888';
      var k = fkeyOf(f);
      var note = notes[k] || '';
      return '<div class="ux-ev-item" style="border-left-color:' + c + '">' +
        '<div class="ux-ev-item-top" style="cursor:pointer" onclick="window.__t3ux.evModal(' + idx + ')" title="Ver detalhes e como replicar"><span class="ux-ev-sev" style="color:' + c + ';background:rgba(255,255,255,.04)">' + escapeText((f.severity || '').toUpperCase()) + '</span>' +
        '<span>' + (typeIcon[f.type] || '') + '</span>' +
        '<span class="ux-ev-item-title">' + escapeText(f.title || '') + '</span><span style="margin-left:auto;font-size:11px;color:#5a7a88">detalhes ›</span></div>' +
        '<div class="ux-ev-meta"><span>🎯 ' + escapeText(f.target || '-') + '</span><span>📶 ' + escapeText(f.phase || '-') + '</span><span>🕒 ' + escapeText((f._uxDate ? f._uxDate + ' ' : '') + (f.timestamp || '')) + '</span></div>' +
        (f.detail ? '<div style="font-size:11.5px;color:#9fb0bd;margin-bottom:4px">' + escapeText(f.detail) + '</div>' : '') +
        '<textarea class="ux-ev-note" data-k="' + escapeText(k) + '" placeholder="✍️ Adicionar observação sobre este achado (salva automaticamente)...">' + escapeText(note) + '</textarea>' +
        '</div>';
    }).join('');

    // ligar notas
    var areas = list.querySelectorAll('.ux-ev-note');
    for (var i = 0; i < areas.length; i++) {
      areas[i].addEventListener('input', function () { saveNote(this.getAttribute('data-k'), this.value); });
    }
  }

  function exportLedger() {
    var all = unionFindings();
    var notes = loadNotes();
    var lines = ['# Registro de Achados — T3MP3ST', '', 'Total: ' + all.length + ' achado(s)', ''];
    all.sort(function (a, b) { return (b._uxTs || 0) - (a._uxTs || 0); });
    all.forEach(function (f) {
      lines.push('## [' + (f.severity || '').toUpperCase() + '] ' + (f.title || ''));
      lines.push('- Alvo: ' + (f.target || '-'));
      lines.push('- Fase: ' + (f.phase || '-'));
      lines.push('- Quando: ' + ((f._uxDate || '') + ' ' + (f.timestamp || '')));
      if (f.detail) lines.push('- Detalhe: ' + f.detail);
      var note = notes[fkeyOf(f)];
      if (note) lines.push('- 📝 Observação: ' + note);
      lines.push('');
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'achados-t3mp3st.md';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ═══════════════════════════════════════════════
  // MODAL RICO DE ACHADO (o que / onde / como / replicar)
  // ═══════════════════════════════════════════════
  function looksUrl(t) { return /^https?:\/\//i.test(t || ''); }
  function looksHostOrIp(t) { return t && t !== '-' && /^[a-z0-9._\-:]+$/i.test(t) && /[.:]/.test(t); }

  function genRepro(f) {
    var t = (f.target || '').trim();
    var toolBacked = (f.provenance || '').toLowerCase() === 'tool' && !!(f.evidence && String(f.evidence).trim());
    var cmds = [];
    if (t && t !== '-') {
      if (looksUrl(t)) {
        cmds.push({ label: 'Ver status + cabeçalhos HTTP da resposta', cmd: "curl -i -sS \"" + t + "\"" });
        cmds.push({ label: 'Baixar o corpo da resposta para inspecionar', cmd: "curl -sS \"" + t + "\" -o resposta.html && type resposta.html" });
        var host = t.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        cmds.push({ label: 'Ver certificado / serviços do host', cmd: 'nmap -sV -Pn ' + host });
      } else if (looksHostOrIp(t)) {
        cmds.push({ label: 'Resolver DNS do alvo', cmd: 'nslookup ' + t });
        cmds.push({ label: 'Escanear portas e versões de serviço', cmd: 'nmap -sV -Pn ' + t });
        cmds.push({ label: 'Testar resposta HTTP', cmd: "curl -i -sS \"http://" + t + "\"" });
      }
    }
    return { hasTarget: !!(t && t !== '-'), toolBacked: toolBacked, cmds: cmds };
  }

  function findingModalFor(f) {
    if (!f) return;
    var sevColor = { critical: '#ff0040', high: '#ff4444', medium: '#ffaa00', low: '#0088ff', info: '#888' };
    var c = sevColor[(f.severity || 'info').toLowerCase()] || '#888';
    var sevLabel = { critical: 'CRÍTICO', high: 'ALTO', medium: 'MÉDIO', low: 'BAIXO', info: 'INFO' }[(f.severity || 'info').toLowerCase()] || (f.severity || '').toUpperCase();
    var typeLabel = { vuln: 'Vulnerabilidade', cred: 'Credencial', access: 'Acesso', info: 'Informação' }[f.type] || (f.type || '-');
    var toolBacked = (f.provenance || '').toLowerCase() === 'tool' && !!(f.evidence && String(f.evidence).trim());

    // ── Aba "O que" ──
    var literal;
    if (f.evidence && String(f.evidence).trim()) {
      literal =
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#00ff88;margin:14px 0 4px">🔍 Valor / artefato literal capturado</div>' +
        '<pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;color:#9fd6c0;background:rgba(0,0,0,.4);padding:10px;border-radius:6px;max-height:220px;overflow:auto;border-left:3px solid #00ff88">' + escapeText(String(f.evidence)) + '</pre>';
    } else {
      literal =
        '<div style="margin-top:14px;font-size:12.5px;line-height:1.6;color:#ffd0a0;background:rgba(255,170,0,.09);border:1px solid rgba(255,170,0,.32);border-radius:8px;padding:11px">' +
        '⚠️ <strong>Não há um valor literal para mostrar.</strong> O texto acima é <em>tudo</em> que o sistema registrou sobre este achado. ' +
        'Não existe um artefato concreto por trás (a chave em si, o token, a resposta do servidor) porque <strong>nenhuma ferramenta extraiu nada</strong> — ' +
        'este achado foi apenas <strong>afirmado pela IA</strong> (veja a aba <em>Como / Prova</em>). Não é uma extração real; trate como um alerta a verificar, não como um dado capturado.</div>';
    }
    var oque =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="ux-ev-sev" style="color:' + c + ';background:rgba(255,255,255,.05);font-size:11px">' + escapeText(sevLabel) + '</span><span style="font-size:15px;color:#e4edf2;font-weight:700">' + escapeText(f.title || '-') + '</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      rcRow('Tipo', escapeText(typeLabel)) +
      rcRow('Descrição', escapeText(f.detail || f.title || '-')) +
      '</table>' + literal;

    // ── Aba "Onde" ──
    var onde =
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      rcRow('Alvo', f.target && f.target !== '-' ? '<code>' + escapeText(f.target) + '</code>' : '<span style="color:#ff8888">— (nenhum alvo associado)</span>') +
      rcRow('Fase da kill chain', escapeText(f.phase || '-')) +
      rcRow('Quando', escapeText((f._uxDate ? f._uxDate + ' ' : '') + (f.timestamp || '-'))) +
      '</table>';

    // ── Aba "Como / Prova" ──
    var provExplain = toolBacked
      ? '<span style="color:#00ff88;font-weight:700">✔ Tem prova de ferramenta (tool-backed)</span> — uma ferramenta real produziu este resultado. A evidência está abaixo.'
      : '<span style="color:#ffaa00;font-weight:700">⚠ Afirmado pelo modelo (model-asserted · não verificado)</span> — este achado foi <strong>deduzido pela IA</strong>, sem uma ferramenta que o comprove. Trate como hipótese a confirmar, não como fato.';
    var como =
      '<div style="font-size:13px;line-height:1.6;color:#c0d4de;margin-bottom:10px">' + provExplain + '</div>' +
      '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#7a8a95;margin-bottom:4px">Evidência</div>' +
      (f.evidence && String(f.evidence).trim()
        ? '<pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;color:#9fd6c0;background:rgba(0,0,0,.4);padding:10px;border-radius:6px;max-height:260px;overflow:auto">' + escapeText(String(f.evidence)) + '</pre>'
        : '<div style="color:#ff9999;font-style:italic;font-size:12.5px">Nenhuma evidência de ferramenta anexada — não há saída de comando comprovando este achado.</div>');

    // ── Aba "Replicar" ──
    var rep = genRepro(f);
    var replicar;
    if (!rep.hasTarget) {
      replicar = '<div style="font-size:13px;line-height:1.6;color:#ffb0b0;background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.3);border-radius:8px;padding:12px">' +
        '⛔ <strong>Não há como replicar este achado.</strong><br>Ele não tem um alvo associado (Alvo = "—") e ' + (toolBacked ? 'nenhum comando registrado' : 'foi afirmado pelo modelo, sem ferramenta por trás') + '. Não existe passo reproduzível — é só uma anotação/hipótese.</div>';
    } else {
      var head = toolBacked
        ? '<div style="font-size:12.5px;line-height:1.55;color:#a8f0cc;background:rgba(0,255,136,.07);border:1px solid rgba(0,255,136,.25);border-radius:8px;padding:10px;margin-bottom:12px">✔ Achado com prova. Os comandos abaixo ajudam você a <strong>confirmar manualmente</strong> no alvo. O payload exato do achado está na aba <em>Como / Prova</em>.</div>'
        : '<div style="font-size:12.5px;line-height:1.55;color:#ffd88a;background:rgba(255,170,0,.08);border:1px solid rgba(255,170,0,.28);border-radius:8px;padding:10px;margin-bottom:12px">⚠ Achado <strong>sem prova de ferramenta</strong>. Os comandos abaixo NÃO reproduzem o achado — servem para <strong>você mesmo investigar o alvo do zero</strong> e verificar se procede.</div>';
      var list = rep.cmds.map(function (x, i) {
        return '<div style="margin-bottom:10px"><div style="font-size:11px;color:#8a99a5;margin-bottom:3px">' + escapeText(x.label) + '</div>' +
          '<div style="display:flex;gap:6px;align-items:stretch">' +
          '<code style="flex:1;background:rgba(0,0,0,.45);padding:8px 10px;border-radius:6px;color:#8ab8cc;font-size:12px;overflow-x:auto;white-space:pre">' + escapeText(x.cmd) + '</code>' +
          '<button class="ux-ev-btn ux-copy-cmd" data-cmd="' + encodeURIComponent(x.cmd) + '" title="Copiar">⧉</button></div></div>';
      }).join('');
      replicar = head + list +
        '<div style="font-size:11px;color:#6a7a85;margin-top:8px">Dica: cole no terminal (cmd/PowerShell). <code>nmap</code> e <code>curl</code> precisam estar instalados. São comandos de recon básicos e não-destrutivos.</div>';
    }

    var body =
      '<div class="ux-modal-tabs" style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">' +
      '<button class="ux-mt active" data-t="0">O que achou</button>' +
      '<button class="ux-mt" data-t="1">Onde</button>' +
      '<button class="ux-mt" data-t="2">Como / Prova</button>' +
      '<button class="ux-mt" data-t="3">Replicar</button>' +
      '</div>' +
      '<div class="ux-mt-panel" data-p="0">' + oque + '</div>' +
      '<div class="ux-mt-panel" data-p="1" style="display:none">' + onde + '</div>' +
      '<div class="ux-mt-panel" data-p="2" style="display:none">' + como + '</div>' +
      '<div class="ux-mt-panel" data-p="3" style="display:none">' + replicar + '</div>';

    showHelpModal('[' + sevLabel + '] ' + escapeText(f.title || 'Achado'), body);

    var ov = document.querySelector('.ux-modal-overlay');
    if (ov) {
      var tabs = ov.querySelectorAll('.ux-mt');
      var panels = ov.querySelectorAll('.ux-mt-panel');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
          var t = this.getAttribute('data-t');
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('active', tabs[j] === this);
          for (var k = 0; k < panels.length; k++) panels[k].style.display = panels[k].getAttribute('data-p') === t ? '' : 'none';
        });
      }
      var copies = ov.querySelectorAll('.ux-copy-cmd');
      for (var m = 0; m < copies.length; m++) {
        copies[m].addEventListener('click', function () {
          var cmd = decodeURIComponent(this.getAttribute('data-cmd') || '');
          try { navigator.clipboard.writeText(cmd); this.textContent = '✓'; var self = this; setTimeout(function () { self.textContent = '⧉'; }, 1200); } catch (e) {}
        });
      }
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
    buildWarRoomTabs();
    buildOperatorsTabs();
    buildBenchmarksTabs();
    buildCtfTabs();
    buildArsenalTabs();
    buildSettingsTabs();
    buildSelfImproveTabs();
    buildConfigsTabs();
    improveReceiptsPage();
    improveEvidencePage();
    buildEvidenceLedger();
    installFindings();
    tagOperatorBadge();
    improveStopButton();
  }

  // Botão "Parar" claro na Sala de Guerra (relabela o ✕ de abortar)
  function improveStopButton() {
    var b = el('cmdAbortBtn');
    if (b && !b.__uxLabeled) {
      b.innerHTML = '⏹ Parar';
      b.title = 'Parar / abortar a missão (tecla Esc)';
      b.style.padding = '8px 16px';
      b.style.fontWeight = '700';
      b.__uxLabeled = true;
    }
  }

  // Tooltip explicando o badge de contagem de agentes ("8")
  function tagOperatorBadge() {
    var b = el('activeOperatorCount');
    if (b && !b.__uxTip) {
      b.title = 'Agentes ativos agora. O esquadrão padrão tem 8 (recon, scanner, exploiter, infiltrator, exfiltrator, ghost, coordinator, analyst). Não é um erro — é a contagem. Recolha agentes em "Agentes" para diminuir.';
      b.__uxTip = true;
    }
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
        buildWarRoomTabs();
        buildOperatorsTabs();
        buildBenchmarksTabs();
        buildCtfTabs();
        buildArsenalTabs();
        buildSettingsTabs();
        buildSelfImproveTabs();
        buildConfigsTabs();
        improveReceiptsPage();
        improveEvidencePage();
      }, 200);
      // Self-Improvement renderiza com 60ms delay, então precisa de re-run adicional
      setTimeout(function () {
        improveSelfImprovePage();
        addInlineHelpIcons();
      }, 500);
    };
  }

  // Rodar periodicamente para pegar conteúdo gerado dinamicamente
  setInterval(function () {
    translateDynamic();
    improveLiveScanPage();
    // Atualizar status das abas visíveis
    var wr = el('page-warroom');
    if (wr && wr.classList.contains('active')) updateTabStatus(wr);
  }, 5000);

  // Revela a aba que contém um elemento (usado pelo tour para destacar blocos ocultos)
  function revealFor(elOrId) {
    var target = typeof elOrId === 'string'
      ? (document.querySelector(elOrId) || el(elOrId))
      : elOrId;
    if (!target) return;
    var node = target, mainAct = null, subAct = null;
    while (node && node !== document.body) {
      if (!mainAct && node.__uxActivate) mainAct = node.__uxActivate;
      if (!subAct && node.__uxSubActivate) subAct = node.__uxSubActivate;
      node = node.parentNode;
    }
    if (mainAct) { try { mainAct(); } catch (e) {} }
    if (subAct) { try { subAct(); } catch (e) {} }
  }

  window.__t3ux = {
    run: run, dict: DYNAMIC_DICT, revealFor: revealFor, rcModal: rcModal,
    findingModal: findingModalFor,
    evModal: function (i) { if (_evLast && _evLast[i]) findingModalFor(_evLast[i]); }
  };
})();
