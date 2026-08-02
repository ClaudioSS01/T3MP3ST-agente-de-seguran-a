/*
 * T3MP3ST — camada de tradução PT-BR (i18n overlay)
 * -------------------------------------------------------------
 * Não-invasivo e 100% reversível: NÃO altera o markup/JS originais.
 * Troca apenas TEXTO VISÍVEL por correspondência EXATA de string via
 * dicionário. O que não estiver no dicionário permanece em inglês
 * (degrada com elegância, nunca quebra a UI).
 *
 * Segurança:
 *  - só substitui strings inteiras (nunca parciais) → não corrompe código;
 *  - ignora <script>/<style>/<code>/<pre>/<textarea>, terminais, logs e
 *    streams de eventos (conteúdo técnico/ao vivo);
 *  - preserva emojis/ícones no início/fim e o espaçamento original;
 *  - desconecta o MutationObserver durante a aplicação (sem loop).
 *
 * Para DESLIGAR: remova a linha <script src="i18n-pt.js"> do index.html,
 * ou no console rode  window.__t3i18nOff()  e recarregue.
 */
(function () {
  'use strict';
  if (window.__t3i18n) return;

  // ── Dicionário EN → PT (rótulos discretos da interface) ──
  var DICT = {
    // Navegação / seções
    'Main': 'Principal', 'Ranges': 'Campos de Treino', 'Toolkit': 'Ferramental',
    'Command': 'Comando', 'System': 'Sistema',
    'War Room': 'Sala de Guerra', 'Live Scan': 'Varredura ao Vivo',
    'Scope Receipts': 'Recibos de Escopo', 'Operatives': 'Operativos',
    'Evidence Vault': 'Cofre de Evidências', 'CTF Range': 'Campo CTF',
    'Arsenal': 'Arsenal', 'Terminal': 'Terminal', 'Config Library': 'Biblioteca de Configs',
    'Settings': 'Configurações', 'About': 'Sobre', 'Self-Improvement': 'Autoaperfeiçoamento',
    'Op Admiral': 'Comando Autônomo',

    // Barra superior / estados de conexão
    'Actions': 'Ações', 'Theme': 'Tema', 'Initializing...': 'Inicializando...',
    'Initializing agent...': 'Inicializando agente...', 'Initializing agent…': 'Inicializando agente…',
    'Checking...': 'Verificando...', 'Reconnect': 'Reconectar', 'Re-scan': 'Re-escanear',
    'Reconnaissance': 'Reconhecimento', 'Refresh': 'Atualizar',
    'checking backend': 'verificando backend', 'checking arsenal': 'verificando arsenal',
    'No agent or API backend connected': 'Nenhum agente ou backend de API conectado',

    // Painel de comando (War Room)
    'Mission': 'Missão', 'Status': 'Status', 'Elapsed': 'Decorrido',
    'Findings': 'Achados', 'Quality': 'Qualidade', 'Backend': 'Backend',
    'Local Agents': 'Agentes Locais', 'Awaiting orders': 'Aguardando ordens',
    'Awaiting orders — point at a target and engage.': 'Aguardando ordens — aponte para um alvo e engaje.',
    'Awaiting first situation report...': 'Aguardando primeiro relatório de situação...',
    'Detecting local agents…': 'Detectando agentes locais…',
    'Connect Local Agents': 'Conectar Agentes Locais', 'Connect Selected': 'Conectar Selecionados',
    'Arm Local': 'Armar Local', 'Force Allocation': 'Forçar Alocação',

    // Botões de ação da missão
    'Abort': 'Abortar', 'Abort mission (Esc)': 'Abortar missão (Esc)',
    'Pause mission': 'Pausar missão', 'Pause/resume stream': 'Pausar/retomar stream',
    'Launch': 'Lançar', 'Launch Range': 'Lançar Campo', 'Launch mission (Enter / Ctrl+Enter)': 'Lançar missão (Enter / Ctrl+Enter)',
    'Guided tour': 'Tour guiado', 'Take the guided tour': 'Fazer o tour guiado',
    'Guided': 'Guiado', 'Guided Starts': 'Inícios Guiados',
    'Search': 'Buscar', 'Search tools...': 'Buscar ferramentas...',
    'Reset': 'Redefinir', 'Reset to Defaults': 'Restaurar Padrões',
    'Save': 'Salvar', 'Save config': 'Salvar config', 'Save & apply': 'Salvar e aplicar',
    'Save Current Config': 'Salvar Config Atual', 'Save & apply': 'Salvar e aplicar',
    'Clear': 'Limpar', 'CLEAR': 'LIMPAR', 'Clear All Data': 'Limpar Todos os Dados',
    'Clear Cache': 'Limpar Cache', 'Clear Feed': 'Limpar Feed', 'Clear History': 'Limpar Histórico',
    'Export': 'Exportar', 'Export Report': 'Exportar Relatório', 'Export Results': 'Exportar Resultados',
    'Export evidence report': 'Exportar relatório de evidências',
    'Download Report': 'Baixar Relatório', 'Copy All': 'Copiar Tudo', 'Copy Snapshot': 'Copiar Resumo',
    'Copy a plain-English mission snapshot.': 'Copie um resumo da missão em linguagem simples.',
    'Run': 'Executar', 'Stop': 'Parar', 'Stop All': 'Parar Tudo', 'Start All': 'Iniciar Tudo',
    'Deploy All': 'Implantar Tudo', 'Expand': 'Expandir', 'Show': 'Mostrar', 'Hide Setup': 'Ocultar Setup',
    'Reject': 'Rejeitar', 'Approve Pending': 'Aprovar Pendentes', 'Approval Requests': 'Pedidos de Aprovação',
    'Import': 'Importar', 'Import from file': 'Importar de arquivo', 'Bulk Import': 'Importação em Massa',
    'From File': 'De Arquivo', 'Bundle': 'Pacote', 'Template...': 'Modelo...',

    // Entrada de alvo / diretiva
    'Target': 'Alvo', 'Targets': 'Alvos', 'Target Intake': 'Entrada de Alvos',
    'No targets': 'Sem alvos', 'Paste or import a list of targets': 'Cole ou importe uma lista de alvos',
    'Host': 'Host', 'Host / IP': 'Host / IP', 'Port': 'Porta', 'Type': 'Tipo', 'Role': 'Papel',
    'Objectives': 'Objetivos', 'Directive': 'Diretiva', 'Urgency': 'Urgência',
    'Constraints (Optional)': 'Restrições (Opcional)', 'Scope Hints (Optional)': 'Dicas de Escopo (Opcional)',
    'Rules of Engagement': 'Regras de Engajamento', 'Admiral’s Intent': 'Intenção do Almirante',
    'Admiral’s Strategic Rationale': 'Racional Estratégico do Almirante',
    'Operation Plan': 'Plano de Operação', 'Op Codename': 'Codinome da Op',
    'Assign to operator...': 'Atribuir ao operador...', 'Pick an operator before assignment.': 'Escolha um operador antes de atribuir.',
    'Enter command...': 'Digite o comando...', 'Enter': 'Enter',
    'Type \'help\' for commands': 'Digite \'help\' para ver os comandos',

    // OPSEC / modos
    'OPSEC Level': 'Nível OPSEC', 'OPSEC Control': 'Controle OPSEC',
    'Stealth': 'Furtivo', 'Stealth Recon': 'Recon Furtivo', 'Aggressive': 'Agressivo',
    'Balanced': 'Balanceado', 'Normal': 'Normal', 'Covert (Default)': 'Encoberto (Padrão)',
    'Silent (Passive Only)': 'Silencioso (Só Passivo)', 'Loud (Max Coverage)': 'Barulhento (Cobertura Máxima)',
    'Balanced speed and noise level': 'Equilíbrio entre velocidade e nível de ruído',
    'Minimize detection risk — slower, quieter scans': 'Minimiza risco de detecção — varreduras mais lentas e silenciosas',
    'Minimizes detection risk — slower, quieter scans': 'Minimiza risco de detecção — varreduras mais lentas e silenciosas',
    'Maximum speed, no stealth — may trigger IDS/WAF': 'Velocidade máxima, sem furtividade — pode disparar IDS/WAF',
    'Configurable stealth levels from quiet recon to aggressive exploitation.': 'Níveis de furtividade configuráveis, do recon silencioso à exploração agressiva.',
    'Mode': 'Modo', 'Modal': 'Modal', 'Breadth': 'Amplitude', 'Depth': 'Profundidade',

    // Modelo / provedores
    'Model': 'Modelo', 'Model tag': 'Tag do modelo', 'Model Selection': 'Seleção de Modelo',
    'Model Selection': 'Seleção de Modelo', 'Fallback Model': 'Modelo de Reserva',
    'AI Backbone': 'Espinha Dorsal de IA', 'LLM Backbone': 'Espinha Dorsal LLM',
    'active backbone': 'espinha dorsal ativa',
    'Provider': 'Provedor', 'API Provider': 'Provedor de API', 'API Path': 'Caminho da API', 'API path': 'caminho da API',
    'API Key': 'Chave de API', 'API Keys': 'Chaves de API', 'Base URL': 'URL Base',
    'Max Context Tokens': 'Máx. Tokens de Contexto', 'Max Attempts': 'Máx. Tentativas',
    'Fetch models': 'Buscar modelos', 'Loading models...': 'Carregando modelos...',
    'Test connection': 'Testar conexão', 'Test': 'Testar', 'Test connection': 'Testar conexão',
    'Select your preferred AI model for agent operations': 'Selecione o modelo de IA preferido para as operações dos agentes',
    'Use the local model for all LLM calls': 'Usar o modelo local para todas as chamadas de LLM',
    'Universal API Config': 'Config Universal de API', 'Current Configuration': 'Configuração Atual',
    'Optimized Configuration': 'Configuração Otimizada', 'Quick Setup': 'Setup Rápido',
    'Quick Start': 'Início Rápido', 'Quick Launch': 'Lançamento Rápido', 'Quick Recon': 'Recon Rápido',
    'Quick Demo': 'Demo Rápida', 'Quick 5': 'Rápido 5',

    // Evidências / achados
    'Evidence': 'Evidência', 'Evidence Ledger': 'Registro de Evidências',
    'Evidence Workbench': 'Bancada de Evidências', 'Evidence Contract': 'Contrato de Evidências',
    'Evidence Gates': 'Portões de Evidência', 'View evidence chain': 'Ver cadeia de evidências',
    'Findings & Loot': 'Achados & Espólio', 'Finding': 'Achado', 'Findings / Retest': 'Achados / Reteste',
    'Severity': 'Severidade', 'Proof': 'Prova', 'Proof Chain': 'Cadeia de Provas', 'Proof State': 'Estado da Prova',
    'log finding': 'registrar achado', 'log evidence': 'registrar evidência',
    'No findings yet. Engage a mission to discover vulnerabilities.': 'Nenhum achado ainda. Engaje uma missão para descobrir vulnerabilidades.',
    'No findings yet. Start a mission to collect evidence.': 'Nenhum achado ainda. Inicie uma missão para coletar evidências.',
    'No pending scope receipts.': 'Nenhum recibo de escopo pendente.',
    'No saved configurations yet': 'Nenhuma configuração salva ainda',
    'No tools approved yet.': 'Nenhuma ferramenta aprovada ainda.',
    'No tools assigned - click tools below to add to the loadout': 'Nenhuma ferramenta atribuída — clique nas ferramentas abaixo para montar o loadout',
    'No execution results yet. Run the benchmark to see agent performance.': 'Nenhum resultado de execução ainda. Rode o benchmark para ver o desempenho dos agentes.',
    'No operator': 'Sem operador', 'Secure storage for findings, credentials, and attack paths.': 'Armazenamento seguro para achados, credenciais e caminhos de ataque.',

    // Operadores / arquétipos
    'Operator': 'Operador', 'Operators': 'Operadores', 'Operator Inbox': 'Caixa do Operador',
    'Operator Archetypes': 'Arquétipos de Operador', 'Operator Clarity Layer': 'Camada de Clareza do Operador',
    'Autonomous Operatives': 'Operativos Autônomos', 'Active Formation': 'Formação Ativa',
    'Agent Progress': 'Progresso do Agente', 'Agent Success Rate': 'Taxa de Sucesso do Agente',
    'Agent lanes': 'Faixas de Agentes', 'Agent Lanes': 'Faixas de Agentes', 'Hunt Lanes': 'Faixas de Caça',
    'Task Queue': 'Fila de Tarefas', 'Hunt Queue': 'Fila de Caça', 'LLM Queue': 'Fila de LLM',
    'Work Order Board': 'Quadro de Ordens de Serviço', 'Specialist Work Orders': 'Ordens de Serviço Especialistas',
    'Specialist Swarm': 'Enxame Especialista',

    // Domínios (tiles de cobertura)
    'Web': 'Web', 'Code': 'Código', 'CTF': 'CTF', 'Cloud': 'Cloud', 'Mobile': 'Mobile',
    'Binary': 'Binário', 'Binary / RE': 'Binário / RE', 'Reverse': 'Reversão', 'Reverse / binary': 'Reversão / binário',
    'Network / Infra': 'Rede / Infra', 'Crypto': 'Cripto', 'Crypto / secrets': 'Cripto / segredos',
    'Code / supply chain': 'Código / cadeia de suprimentos', 'Cloud / infra': 'Cloud / infra',
    'Identity / AD': 'Identidade / AD', 'Web / API': 'Web / API', 'Web Only': 'Somente Web',
    'Social / OSINT': 'Social / OSINT', 'Intelligence & OSINT': 'Inteligência & OSINT',
    'Smart contracts': 'Smart contracts', 'Data extraction': 'Extração de dados',
    'Lateral movement': 'Movimento lateral', 'Network scanning': 'Varredura de rede',
    'Vulnerability exploitation': 'Exploração de vulnerabilidades', 'Anti-forensics': 'Anti-forense',
    'Forensics': 'Forense', 'Reporting': 'Relatórios', 'Reports / remediation': 'Relatórios / remediação',
    'Apps, APIs, auth flows, OWASP Top 10. XBEN 90.1% pass@1.': 'Apps, APIs, fluxos de auth, OWASP Top 10. XBEN 90,1% pass@1.',
    'Wargames, ranges, challenges. Cybench 23/40 hint-free.': 'Wargames, campos de treino, desafios. Cybench 23/40 sem dicas.',
    'Live recon engine (nmap/DNS/HTTP). Lateral + privesc experimental.': 'Motor de recon ao vivo (nmap/DNS/HTTP). Lateral + privesc experimental.',
    'Firmware, robotics, ICS/SCADA. Coordinated-disclosure CVE pipeline live.': 'Firmware, robótica, ICS/SCADA. Pipeline de divulgação coordenada de CVE ao vivo.',
    'Dependency audits, install-without-confirmation. Dedicated class; real held-out hit.': 'Auditorias de dependências, instalação-sem-confirmação. Classe dedicada; acerto real no conjunto retido.',
    'Smart contracts, DeFi, Solidity. Reproduction only — not novel discovery yet.': 'Smart contracts, DeFi, Solidity. Só reprodução — ainda não é descoberta inédita.',
    'AWS/GCP/Azure misconfig, IAM, serverless.': 'Misconfig de AWS/GCP/Azure, IAM, serverless.',
    'Android / iOS app security.': 'Segurança de apps Android / iOS.',
    'Kerberos, pass-the-hash, Active Directory.': 'Kerberos, pass-the-hash, Active Directory.',
    'Overflows, ROP, exploit dev. Needs specialized tooling.': 'Overflows, ROP, dev de exploits. Precisa de ferramental especializado.',
    'White-box source audits. Held-out CVE-Zero: single-agent 8/10 exact file/line/CWE, 10/10 found (7 languages).': 'Auditorias white-box de código-fonte. CVE-Zero retido: agente único 8/10 arquivo/linha/CWE exatos, 10/10 encontrados (7 linguagens).',
    'A domain lights up only when there’s a benchmark behind it. Greyed tiles are in development.': 'Um domínio só acende quando há um benchmark por trás. Blocos acinzentados estão em desenvolvimento.',
    'Mix domains for cross-boundary hunts.': 'Misture domínios para caças além das fronteiras.',

    // Estados / badges
    'ACTIVE': 'ATIVO', 'Access': 'Acesso', 'STANDBY': 'EM ESPERA', 'Standby': 'Em espera',
    'STANDING BY': 'EM ESPERA', 'Offline': 'Offline', 'DEGRADED': 'DEGRADADO',
    'Coming soon': 'Em breve', 'COMING SOON': 'EM BREVE', 'Unknown': 'Desconhecido',
    'None': 'Nenhum', 'All': 'Todos', 'ALL': 'TODOS', 'All Categories': 'Todas as Categorias',
    'All tools': 'Todas as ferramentas', 'All operators reason simultaneously, results merged': 'Todos os operadores raciocinam simultaneamente, resultados mesclados',
    'Categories': 'Categorias', 'Category': 'Categoria', 'Coverage': 'Cobertura',
    'High': 'Alta', 'Medium': 'Média', 'Low': 'Baixa', 'Critical': 'Crítico',
    'Critical (ASAP)': 'Crítico (o quanto antes)', 'High (Fast)': 'Alta (Rápido)',
    'Low (Thorough)': 'Baixa (Minucioso)', 'Not benchmarked': 'Sem benchmark',
    'Not Built': 'Não construído', 'not run': 'não executado', 'not synced': 'não sincronizado',
    'no traffic': 'sem tráfego', 'Waiting for gated tool calls…': 'Aguardando chamadas de ferramenta travadas…',
    'Waiting for gated tool calls...': 'Aguardando chamadas de ferramenta travadas...',
    'no API keys needed': 'nenhuma chave de API necessária', 'egress gated': 'egresso travado',
    'ledger required': 'registro obrigatório', 'active tools require approval': 'ferramentas ativas exigem aprovação',

    // Config / benchmarks
    'Config': 'Config', 'Config Check': 'Checagem de Config', 'Saved Configurations': 'Configurações Salvas',
    'Current Configuration': 'Configuração Atual', 'Overall Results': 'Resultados Gerais',
    'Overall Score': 'Pontuação Geral', 'Total Points': 'Pontos Totais', 'Range Status': 'Status do Campo',
    'Results & History': 'Resultados & Histórico', 'History': 'Histórico', 'Mission history': 'Histórico de missões',
    'Challenge': 'Desafio', 'Challenge Browser': 'Navegador de Desafios', 'Challenges Solved': 'Desafios Resolvidos',
    'Flag': 'Flag', 'Time': 'Tempo', 'Time Limit (per challenge)': 'Limite de Tempo (por desafio)',
    'Accuracy': 'Precisão', 'Tests Passed': 'Testes Aprovados', 'Phase': 'Fase', 'Phases': 'Fases',
    'Industry Benchmarks': 'Benchmarks do Setor', 'Run Full Benchmark': 'Rodar Benchmark Completo',
    'Build Images': 'Construir Imagens', 'Build All Images': 'Construir Todas as Imagens',
    'Check Docker': 'Checar Docker', 'Verify Docker daemon is running and accessible.': 'Verifique se o daemon do Docker está rodando e acessível.',
    'Start all challenge containers.': 'Inicia todos os contêineres de desafio.',
    'Build Docker images for CTF challenges.': 'Constrói imagens Docker para os desafios de CTF.',
    'Containers Running': 'Contêineres Rodando', 'Range': 'Campo', 'Training Range': 'Campo de Treino',

    // Ajuda / textos maiores frequentes
    'Configure your API keys and launch your first mission.': 'Configure suas chaves de API e lance sua primeira missão.',
    'Configure API Keys →': 'Configurar Chaves de API →', 'Manage in Settings': 'Gerenciar em Configurações',
    'Set up in Settings →': 'Configurar em Configurações →', 'Connect in Settings →': 'Conectar em Configurações →',
    'Turn the AI coding agent you already run into a red team.': 'Transforme o agente de código de IA que você já usa em um red team.',
    'T3MP3ST is an AI-driven offensive-security workbench — you point operators at a target and it hunts, validates, and reports findings.': 'O T3MP3ST é uma bancada de segurança ofensiva movida a IA — você aponta os operadores para um alvo e ele caça, valida e reporta os achados.',
    'Multiple AI providers: OpenRouter, Anthropic, OpenAI, or local models via Ollama.': 'Múltiplos provedores de IA: OpenRouter, Anthropic, OpenAI ou modelos locais via Ollama.',
    'Extensible tool registry with automatic capability discovery.': 'Registro de ferramentas extensível com descoberta automática de capacidades.',
    'Coordinate complex operations with intelligent task delegation.': 'Coordene operações complexas com delegação inteligente de tarefas.',
    'Select, arm, and coordinate operator tools': 'Selecione, arme e coordene as ferramentas dos operadores',
    'Arm a few tools to shape the hunt profile.': 'Arme algumas ferramentas para moldar o perfil da caça.',
    'Ready to Start?': 'Pronto para começar?',
    'Getting started': 'Começando', 'Get started with execution-based CTF benchmarks in minutes. Requires Docker installed locally.': 'Comece com benchmarks de CTF baseados em execução em minutos. Requer Docker instalado localmente.',
    'Reconnect': 'Reconectar', 'Copy All': 'Copiar Tudo',

    // Termos genéricos curtos
    'Save': 'Salvar', 'Load Default': 'Carregar Padrão', 'Apply Configuration': 'Aplicar Configuração',
    'Generate Assessment': 'Gerar Avaliação', 'Generate Analysis': 'Gerar Análise',
    'Strategic Assessment': 'Avaliação Estratégica', 'Assessment will be generated after operation completes or on demand.': 'A avaliação será gerada quando a operação terminar ou sob demanda.',
    'Situation Reports': 'Relatórios de Situação', 'Request SITREP': 'Solicitar SITREP',
    'Next Moves': 'Próximos Passos', 'Recall': 'Rememorar', 'Reflection': 'Reflexão',
    'Sensor Posture': 'Postura dos Sensores', 'Time': 'Tempo',
    'Autonomous Operations': 'Operações Autônomas', 'Autonomous Ops': 'Ops Autônomas',
    'Auto Ops': 'Ops Automáticas', 'Auto-Apply': 'Auto-Aplicar', 'Auto-Improve After': 'Auto-Melhorar Após',
    'Run Improvement Loop Only': 'Rodar Só o Loop de Melhoria', 'Run Improvement Loop Only': 'Rodar Só o Loop de Melhoria',
    'Cognitive Architecture Settings': 'Configurações de Arquitetura Cognitiva',
    'Model Selection': 'Seleção de Modelo', 'Suggested Config Changes': 'Mudanças de Config Sugeridas',
    'Applied Configuration Changes': 'Mudanças de Configuração Aplicadas',
    'Recommended Improvements': 'Melhorias Recomendadas', 'Strengths': 'Pontos Fortes', 'Weaknesses': 'Fraquezas',
    'Full Kill Chain': 'Kill Chain Completa', 'Kill Chain Coverage': 'Cobertura da Kill Chain',
    'Multi-Agent Swarm': 'Enxame Multi-Agente', 'Multi-Agent Coordination': 'Coordenação Multi-Agente',
    'Real-Time Adaptation': 'Adaptação em Tempo Real', 'Attack Plan Generation': 'Geração de Plano de Ataque',
    'Live Test': 'Teste ao Vivo', 'LLM API Operational': 'API de LLM Operacional',
    'Config Check': 'Checagem de Config', 'Capability Preflight': 'Pré-Checagem de Capacidade',

    // Proxy / rede
    'Egress Proxy (SOCKS5)': 'Proxy de Egresso (SOCKS5)', 'SOCKS5 proxy': 'proxy SOCKS5',
    'Check IP now': 'Checar IP agora', 'Egress IP for test traffic — click to re-check': 'IP de egresso para o tráfego de teste — clique para re-checar',

    // Rodapé / diversos
    'Welcome to T3MP3ST': 'Bem-vindo ao T3MP3ST', 'Got it — I’ll explore on my own': 'Entendi — vou explorar por conta própria',
    'Team Preview': 'Prévia da Equipe', 'Installation': 'Instalação', 'installed': 'instalado',
    'OK': 'OK', 'YES': 'SIM', 'NO': 'NÃO', 'or': 'ou',
    'Loading self-improvement loops…': 'Carregando loops de autoaperfeiçoamento…',
    'Analyzing performance data...': 'Analisando dados de desempenho...',
    'Analyzing recommendations and generating optimal settings': 'Analisando recomendações e gerando as configurações ótimas',
    'LLM is optimizing your configuration...': 'A LLM está otimizando sua configuração...',
    'Starting optimization loop...': 'Iniciando loop de otimização...',
    'Scanning catalog...': 'Escaneando catálogo...', 'Scanning catalog…': 'Escaneando catálogo…',
    'Validating Configuration...': 'Validando Configuração...',
    // Widget de log flutuante (estava em italiano no original)
    'Chiudi': 'Fechar', 'Minimizza': 'Minimizar', 'In attesa di attività…': 'Aguardando atividade…',
    'Mostra/nascondi log live': 'Mostrar/ocultar log ao vivo',

    // Strings adicionais encontradas em testes
    'SYSTEM EVENTS': 'EVENTOS DO SISTEMA',
    'START A ZERO-DAY HUNT': 'INICIE UMA CAÇADA ZERO-DAY',
    'ENGAGE': 'ENGAJAR',
    'AUTONOMOUS MODE': 'MODO AUTÔNOMO',
    'Stage': 'Preparar', 'Sync': 'Sincronizar', 'Check': 'Checar', 'Watch': 'Observar',
    'Ledgers': 'Registros', 'Idea': 'Ideia', 'Hypothesis': 'Hipótese',
    'Work Order': 'Ordem de Trabalho', 'Retest': 'Reteste',
    'Route Preview': 'Prévia de Rota', 'Tool Plan': 'Plano de Ferramentas',
    'Target unclear': 'Alvo não definido', 'real ops': 'ops reais',
    'WEAPON': 'ARMAM.', 'DELIVER': 'ENTREGA', 'EXPLOIT': 'EXPLORAR',
    'INSTALL': 'INSTALAR', 'ACTIONS': 'AÇÕES',
    'Connected': 'Conectado', 'Disconnected': 'Desconectado',
    'Run': 'Executar', 'Collapse': 'Recolher',

    // Live Scan
    'Agent Progress': 'Progresso dos Agentes',
    'State': 'Estado', 'Phase': 'Fase', 'Progress': 'Progresso',
    'Stall': 'Travamento', 'Paused': 'Pausado',
    'Running': 'Rodando', 'Stopped': 'Parado',
    'Clear Feed': 'Limpar Feed',
    'No operator details available yet.': 'Nenhum detalhe de operador disponível ainda.',
    'No mission tasks are queued.': 'Nenhuma tarefa de missão enfileirada.',
    'No live reasoning events yet. Start or refresh a scan to populate this stream.': 'Nenhum evento de raciocínio ao vivo ainda. Inicie ou atualize uma varredura para popular este stream.',

    // Additional UI
    'Compact': 'Compacto', 'Density': 'Densidade',
    'Toggle compact density for the clarity layer.': 'Alterna a densidade compacta da camada de clareza.',
    'Jump to the first blocker or priority action.': 'Ir para o primeiro bloqueio ou ação prioritária.',
    'Let Op Admiral guide the setup': 'Deixe o Comando Autônomo guiar o setup',
    'Approve': 'Aprovar', 'Approved': 'Aprovado', 'Rejected': 'Rejeitado', 'Expired': 'Expirado',
    'Delete': 'Excluir', 'Confirm': 'Confirmar', 'Cancel': 'Cancelar',
    'Close': 'Fechar', 'Back': 'Voltar', 'Next': 'Próximo', 'Previous': 'Anterior',
    'Done': 'Concluído', 'Skip': 'Pular', 'Continue': 'Continuar',
    'Loading...': 'Carregando...', 'Loading': 'Carregando',
    'No data': 'Sem dados', 'No results': 'Sem resultados',
    'Error': 'Erro', 'Warning': 'Aviso', 'Info': 'Info', 'Success': 'Sucesso',
    'Pending': 'Pendente', 'Active': 'Ativo', 'Inactive': 'Inativo',
    'Enabled': 'Ativado', 'Disabled': 'Desativado',
    'On': 'Ligado', 'Off': 'Desligado',
    'Name': 'Nome', 'Description': 'Descrição', 'Date': 'Data', 'Score': 'Pontuação',
    'Total': 'Total', 'Count': 'Contagem', 'Size': 'Tamanho',
    'Version': 'Versão', 'Author': 'Autor', 'License': 'Licença',
    'Details': 'Detalhes', 'Summary': 'Resumo', 'Overview': 'Visão Geral',
  };

  // Atributos que também recebem tradução (por correspondência exata)
  var ATTRS = ['placeholder', 'title', 'aria-label'];

  // Não traduzir dentro destes elementos (código, logs, streams, terminal)
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  function inSkippedContainer(node) {
    var el = node.nodeType === 3 ? node.parentNode : node;
    while (el && el.nodeType === 1) {
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.hasAttribute && (el.hasAttribute('data-no-i18n') || el.isContentEditable)) return true;
      var id = el.id || '';
      var cls = (typeof el.className === 'string') ? el.className : '';
      if (/terminal|eventsStream|events-stream|log-stream|reasoning|ascii|banner-art/i.test(id + ' ' + cls)) return true;
      el = el.parentNode;
    }
    return false;
  }

  // Separa um prefixo/sufixo de emojis+símbolos+espaços do miolo textual,
  // para poder casar o rótulo "puro" no dicionário e re-anexar os ícones.
  var EDGE = /^([\s\p{Extended_Pictographic}←-⇿⌀-➿⬀-⯿️‍⃣·▶▸◉★☆⚓✓✨⭐↺↻→←↓•]*)([\s\S]*?)([\s\p{Extended_Pictographic}←-⇿⌀-➿⬀-⯿️‍⃣·→]*)$/u;

  function translateCore(s) {
    if (Object.prototype.hasOwnProperty.call(DICT, s)) return DICT[s];
    return null;
  }

  // Traduz uma string preservando espaços/emoji nas bordas. Retorna null se nada mudou.
  function translateString(raw) {
    var trimmed = raw.trim();
    if (!trimmed) return null;
    // 1) tentativa direta (miolo já trimado)
    var direct = translateCore(trimmed);
    if (direct != null) {
      var lead = raw.match(/^\s*/)[0];
      var tail = raw.match(/\s*$/)[0];
      return lead + direct + tail;
    }
    // 2) separa emojis/ícones das bordas e tenta o miolo
    var m = EDGE.exec(raw);
    if (m) {
      var pre = m[1], core = m[2].trim(), post = m[3];
      var t = translateCore(core);
      if (t != null) return pre + t + post;
    }
    return null;
  }

  var observer = null;
  function withObserverPaused(fn) {
    if (observer) observer.disconnect();
    try { fn(); } finally {
      if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  function processTextNode(node) {
    if (!node.nodeValue) return;
    if (inSkippedContainer(node)) return;
    var out = translateString(node.nodeValue);
    if (out != null && out !== node.nodeValue) node.nodeValue = out;
  }

  function processElementAttrs(el) {
    if (!el.getAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (el.hasAttribute(a)) {
        var v = el.getAttribute(a);
        var t = translateString(v);
        if (t != null && t !== v) el.setAttribute(a, t);
      }
    }
  }

  function walk(root) {
    // atributos
    var els = root.nodeType === 1 ? [root] : [];
    if (root.querySelectorAll) {
      els = els.concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    }
    for (var i = 0; i < els.length; i++) {
      if (SKIP_TAGS[els[i].tagName]) continue;
      processElementAttrs(els[i]);
    }
    // nós de texto
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var batch = [], n;
    while ((n = tw.nextNode())) batch.push(n);
    for (var j = 0; j < batch.length; j++) processTextNode(batch[j]);
  }

  function run() {
    withObserverPaused(function () { walk(document.body); });
  }

  function start() {
    // Observa conteúdo dinâmico (o app gera muita UI via JS).
    observer = new MutationObserver(function (muts) {
      withObserverPaused(function () {
        for (var i = 0; i < muts.length; i++) {
          var mu = muts[i];
          if (mu.type === 'characterData') { processTextNode(mu.target); continue; }
          for (var k = 0; k < mu.addedNodes.length; k++) {
            var nd = mu.addedNodes[k];
            if (nd.nodeType === 3) processTextNode(nd);
            else if (nd.nodeType === 1) walk(nd);
          }
          if (mu.type === 'attributes' && mu.target.nodeType === 1) processElementAttrs(mu.target);
        }
      });
    });
    run();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  window.__t3i18n = { dict: DICT, run: run };
  window.__t3i18nOff = function () {
    try { if (observer) observer.disconnect(); } catch (e) {}
    window.__t3i18n = null;
    console.log('[i18n-pt] desligado (recarregue para restaurar inglês por completo).');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
