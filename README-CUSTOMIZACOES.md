# T3MP3ST — Customizações (Claudio)

Registro de tudo que foi ajustado nesta instância local do T3MP3ST. **Todas as mudanças de UI são via camada de overlay (não-invasivas e 100% reversíveis)** — o código original do T3MP3ST não foi alterado, exceto por tags `<script>` no `index.html` e o tour antigo comentado.

Última atualização: 2026-08-03.

---

## 1. Setup local (Ollama, 100% offline)

- **Ollama** reinstalado (`winget install Ollama.Ollama`), serve em `http://127.0.0.1:11434`.
- Provider local em **`~/.t3mp3st/.env`**: `LLM_PROVIDER=local`, `TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api`, `TEMPEST_LOCAL_MODEL=qwen2.5-coder:7b`.
- Modelo: **qwen2.5-coder:7b** (tool-calling nativo; o tool-calling do T3MP3ST é text-driven e roda em qualquer modelo local).
- Sem Docker (removido do PC).

## 2. Launcher de instância única (`~/start-t3mp3st.ps1` + `~/T3MP3ST.cmd`)

- Garante o **Ollama** no ar (porta 11434) e sobe o **servidor** (`node dist/server.js`) com **trava de instância única** (checa a porta 3333; recusa subir uma segunda).
- Motivo: em 2026-08-02 a máquina travou (93% RAM) por causa de **previews de browser vazados** (não do servidor). O launcher evita duplicar o servidor; e a regra passou a ser NÃO usar preview de browser embutido pra testar a UI pesada (Claudio testa no Chrome).
- ⚠️ O `.ps1` precisa ser salvo em **UTF-8 com BOM** (o caminho tem "Segurança"/ç; PowerShell 5.1 corrompe UTF-8-sem-BOM).

## 3. Tradução PT-BR + UX (arquivos overlay em `docs/`)

Carregados via `<script>` no fim do `index.html`:

### `i18n-pt.js` (~430 linhas)
- Dicionário EN→PT com correspondência exata + `MutationObserver` para conteúdo dinâmico. ~300 strings. Preserva emojis nas bordas. Desligar: `window.__t3i18nOff()`.

### `ux-improve-pt.js` (~2600 linhas)
- **Traduções dinâmicas** (DYNAMIC_DICT, 500+) que o i18n estático não pega (kill chain, inbox, eventos, etc.).
- **Explicadores por tela** (15) em PT.
- **Abas na Sala de Guerra** (Etapas 1–4: Preparação / Configuração / Execução / Resultados) com indicador de status por etapa.
- **Sub-abas na Etapa 3 (Execução):** Ao Vivo / Operadores / Missão / Avançado.
- **Detector de status REAL da missão:** intercepta `/api/mission/start` e mostra se iniciou (200), foi bloqueada por aprovação de escopo (403) ou falhou.
- **Auto-avanço** para a Execução ao clicar ENGAJAR/BLITZ/CAÇAR.
- **Persistência de achados** em `localStorage` (`t3ux_findings_v1`): wrap de `addFinding`, restaura no load — achados sobrevivem a reload e populam Etapa 4 + Cofre.
- **Espelho de achados ao vivo** na Etapa 3.
- **Cofre de Evidências** com filtros (severidade/alvo/data/busca), visão geral, **observações por achado** (`t3ux_notes_v1`) e exportar Markdown.
- **Modal rico de achado** (abas: O que achou / Onde / Como-Prova / Replicar) com **comando pronto pra copiar** (curl/nmap/nslookup) e honestidade: quando é `model-asserted` sem prova, diz que NÃO há valor literal nem como replicar.
- **"Histórico de Buscas"** (ex-Recibos de Escopo): busca por termo, filtro de data, status, **paginação** e **modal com abas** (Resumo/Detalhes/Ação/JSON). Mantém a função de aprovação (desbloqueia o 403).
- **"Agentes"** (ex-Operativos) + tooltip explicando o badge "8" (esquadrão padrão).
- **Botão "⏹ Parar"** na Sala de Guerra (era um `✕` sem rótulo).
- **Arsenal:** botões renomeados (➕ Armar, ⚔️ ARMAR TUDO, 📌 ATRIBUIR, 🗑️ LIMPAR).
- **Feedback visual na Varredura ao Vivo** (pulse, barra de progresso, estados vazios em PT).
- Ícones de ajuda "?" em Configurações / Autoaperfeiçoamento.
- **Nota honesta na Sala de Guerra:** só o operador de Recon executa ferramenta de verdade (per whitepaper upstream).

### `tour-pt.js` (~520 linhas)
- Tour guiado por tela com TTS (pt-BR), botão flutuante "?". Auto-launch desativado (causava overlay escuro). Substitui o tour antigo (comentado no `index.html`).

### `chat-pt.js` (~480 linhas)
- **Aba "Chat"** (acima de Sala de Guerra): conversa com o "Comandante" (LLM local via Ollama direto, com histórico + streaming; fallback `/api/llm/chat`). **Listar / trocar / baixar modelos** do Ollama.
- **Motor de Recon REAL (Chat → executa ferramentas):** detecta alvo + intenção → executa ferramentas de verdade pelo backend e mostra a saída literal + análise do LLM.
  - Micro-fluxo (orquestração determinística + LLM só em micro-tarefas de interpretação).
  - Fluxo de aprovação testado: `execute` → 403 → `authorize-target` → **retry com `approvalId` no corpo** → 200 (o `findApproval` do server só olha o approvalId do corpo).
  - `curl` (headers HTTP) funciona hoje; `nmap` entra automático quando instalado (degradação graciosa detecta `spawn nmap ENOENT`).
  - Testado (`test-chat-recon.mjs`): 12/12 — detecção 8/8, curl real 3/3 (headers reais).

## 3.1. Arsenal completo ligado (`T3MP3ST_FULL_ARSENAL=true`)

- Flag adicionada em **`~/.t3mp3st/.env`** e no **launcher** (`$env:T3MP3ST_FULL_ARSENAL='true'`). Reversível: remover as duas.
- Efeito: nas MISSÕES, os operadores passam a armar os adapters opt-in (nuclei, httpx, naabu, katana, ffuf, gobuster, feroxbuster, nikto, dalfox, sqlmap, semgrep, gitleaks, trivy, etc.). **Ainda exigem: (a) o CLI instalado, (b) aprovação por chamada** (portão de escopo). Metasploit/hydra são approval-gated + dangerous.
- Testado (`test-arsenal.mjs`, 9/9): servidor saudável pós-restart, LLM conectado, e o whitelist do `/api/tools/execute` **aceita** nuclei/httpx/whatweb/nikto/sqlmap/gobuster (todos pedem aprovação = prontos p/ quando instalar). Catálogo: **68 de 73 command-ready** (35 safe_command + 33 receipt_required).
- ⚠️ Ligar a flag NÃO instala nada nem "arma" nada perigoso sozinho — só deixa o catálogo pronto. As ferramentas só rodam com CLI instalado + você aprovando.

## 4. Diagnósticos importantes

- **"Could not connect to local LLM"** = Ollama não estava rodando (não auto-sobe após reboot). Resolvido; launcher agora garante.
- **"stalled in reconnaissance: N required task(s) failed"** = faltam **nmap** e **dig** (o recon roda `dig +short` e `nmap`). No PC: nmap/dig ausentes, curl/nslookup presentes. nmap precisa de instalação com admin+GUI (Npcap) — ação do Claudio.

## 5. Realidade do projeto (pesquisa no upstream `elder-plinius/T3MP3ST`)

Ver `FEATURES.md` e `WHITEPAPER.md` do próprio repo. Em resumo:
- **Real:** RECON, SCANNER, ANALYST; Arsenal de recon/scan (com o binário instalado); KnowledgeBase; EvasionEngine; Cofre; OPSEC; relatório Markdown.
- **Experimental (roda ferramenta real, exploração ponta-a-ponta NÃO comprovada — 0 exploits em full-chain):** EXPLOITER, INFILTRATOR, EXFILTRATOR, GHOST, COORDINATOR.
- **Removido/stub (encenação):** Pliny Specials (LEVIATHAN, GORGON, HYDRA, etc. — RETIRADOS, rotas `/api/pliny/*` removidas); módulos avançados em stub (ExploitEngine, SwarmController, CloudSecurityEngine, PersistenceController, etc.); fases da kill chain após o recon.
- **Exploração autônoma (exploit/lateral/exfil/persistência/C2) não é um bug a corrigir** — é problema não resolvido da área e não foi implementado como capacidade real. O caminho legítimo é usar ferramentas-padrão reais (nuclei/sqlmap/httpx) human-in-the-loop nos alvos autorizados.

## Como reverter tudo (voltar ao T3MP3ST original)

Remover do `index.html` as 4 linhas `<script src="*-pt.js">` e descomentar o bloco `TOUR_REMOVED`. Os arquivos `docs/*-pt.js` podem ser apagados. Backup do index em inglês: `docs/index.html.bak-en`.
