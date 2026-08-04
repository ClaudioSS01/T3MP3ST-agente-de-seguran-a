# T3MP3ST — Customizações (Claudio)

Registro de tudo que foi ajustado nesta instância local do T3MP3ST. **Todas as mudanças de UI são via camada de overlay (não-invasivas e 100% reversíveis)** — o código original do T3MP3ST não foi alterado, exceto por tags `<script>` no `index.html` e o tour antigo comentado.

Última atualização: 2026-08-03 (v3 — sistema de conversas + PDF client-side + Chat como aba padrão).

---

## 🚀 TL;DR — o que este fork adiciona ao T3MP3ST upstream

**Interface completa em PT-BR + workflow de segurança pronto para uso.**

| Feature | Como usar | Arquivo |
|---|---|---|
| **Tradução PT-BR** completa da UI (~800 strings estáticas + dinâmicas) | Automático ao abrir | `docs/i18n-pt.js` + `docs/ux-improve-pt.js` |
| **Aba "Chat"** com o Comandante — LLM local (Ollama), sem chaves de API | Aba padrão no boot | `docs/chat-pt.js` |
| **Auto-detect de URL no chat** — cola `alvo.com` e o recon dispara | Digite URL + Enter | `docs/chat-recon-v2.js` |
| **Motor Recon V2 — 8 fases passivas** (Headers/DNS/DMARC/Shodan/crt.sh/paths/JS secrets/TLS) | Botão 🎯 Recon V2 ou auto-detect | `docs/chat-recon-v2.js` + `docs/RECON_METHODOLOGY.md` |
| **PDF client-side** com identidade visual — dossiê pronto para cliente | Botão 📄 Baixar PDF (após recon) | jsPDF lazy-load do CDN |
| **Sistema de conversas** — histórico, nova conversa limpa, título automático | Botão 💬 Conversas no topo do chat | `docs/chat-conversations.js` |
| **Cofre de Evidências** persistente com filtros e export Markdown | Menu lateral → Cofre | `docs/ux-improve-pt.js` (parte do overlay) |
| **Deploy VPS** com Cloudflare Access (Zero Trust) | Guia passo-a-passo | `docs/DEPLOY_VPS.md` |
| **Metodologia dos 60 pontos** black-box auditada e documentada | Referência para o Comandante | `docs/RECON_METHODOLOGY.md` |
| **Auto-instalador de ferramentas** sob demanda (nuclei/httpx/sqlmap) | `~/install-t3mp3st-tool.ps1 <nome>` | Windows-safe |
| **Launcher instância única** (Windows) | `~/T3MP3ST.cmd` | `~/start-t3mp3st.ps1` |

**Para começar rápido:**

```bash
# 1. Ollama + modelo
ollama serve
ollama pull qwen2.5:3b   # ou qwen2.5-coder:7b se tiver 5GB+ RAM

# 2. Servidor T3MP3ST
npm install && npm run build && npm run server:prod

# 3. Abre http://127.0.0.1:3333/ui/ → Chat já é a aba padrão
# 4. Cola uma URL autorizada → Recon V2 dispara → Baixar PDF
```

---

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

## 2.1. Iniciadores auto-checkin (`00_Iniciar.bat` / `00_iniciar.ps1` / `00_iniciar.sh`)

Três arquivos na **raiz do repo** que instalam tudo que falta e sobem o servidor. Ideal para dar duplo-clique quando montar o projeto em outra máquina.

**O que cada um checa/instala em ordem (9 passos):**
1. **Node.js ≥ 20** — instala via `winget install OpenJS.NodeJS.LTS` (Win) / NodeSource + apt (Linux) / brew (macOS) se faltar
2. **npm** — verifica que veio com Node
3. **Ollama** — instala via `winget install Ollama.Ollama` / `curl install.sh` / brew
4. **Daemon Ollama** — sobe `ollama serve` em background se `:11434` estiver frio
5. **Modelo LLM** — se `qwen2.5:3b` não está instalado, roda `ollama pull qwen2.5:3b` (com fallback)
6. **`~/.t3mp3st/.env`** — cria com defaults locais (provider=local, model=qwen2.5:3b, port=3333, arsenal=true) se faltar
7. **`node_modules`** — `npm ci` se ausente ou desatualizado (via mtime de package-lock.json)
8. **`dist/server.js`** — `npm run build` se ausente ou desatualizado (via mtime de src/server.ts)
9. **Servidor T3MP3ST** — `node dist/server.js` em background, checa `:3333/api/health` até 200 OK

Ao final: abre `http://127.0.0.1:3333/ui/` no browser (usa `xdg-open`/`open`/`Start-Process`).

**Uso Windows:**
- Duplo-clique em `00_Iniciar.bat` (wrapper que chama o .ps1 com `-ExecutionPolicy Bypass`)
- OU: `pwsh -File 00_iniciar.ps1`
- Flags: `-SkipBrowser`, `-SkipBuild`, `-Model qwen2.5-coder:7b`

**Uso Linux/macOS:**
- `chmod +x 00_iniciar.sh && ./00_iniciar.sh`
- Flags: `--no-browser`, `--skip-build`, `--model=<nome>`
- Env: `MODEL=qwen2.5:3b ./00_iniciar.sh`

**Fica idempotente** — se algo já está instalado/rodando, pula. Se `:3333` já responde, avisa e não sobe segunda instância.

**Validado:** rodei end-to-end em 04/08/2026 (Windows 11, Node v24.14, Ollama 0.31.1) — 9/9 passos verdes.

**Modelo padrão:** `qwen2.5-coder:7b` (definido após benchmark que comparou 3 modelos — ver seção 4.1).

## 2.2. Killall (`00_killall.bat` / `00_killall.ps1` / `00_killall.sh`)

Três arquivos irmãos dos iniciadores para **parar tudo com segurança**.

**O que cada um mata (4 passos):**
1. Processo Node ligado à porta **:3333** (T3MP3ST server) — encontrado via `Get-NetTCPConnection` / `lsof -ti :3333` / `fuser` / `ss`
2. Processos `node` que têm `dist/server.js` na linha de comando (double-check via `Win32_Process.CommandLine` / `pgrep -f`)
3. Daemon **Ollama** (:11434) + processos `ollama.exe` filhos — opt-out com `-KeepOllama` / `--keep-ollama`
4. Limpa `t3mp3st-stdout.log`, `t3mp3st-stderr.log` (e `ollama.log` no Linux) de `%TEMP%` / `/tmp`

**Não mata `node.exe` genericamente** — só os que estão bound ao :3333 OU rodando `dist/server.js`. Protege outros apps Node do usuário (VSCode, dev servers, etc).

**No Linux:** tenta `brew services stop` e `systemctl stop ollama` primeiro (se instalado assim), depois força kill por PID como fallback. Kill graceful (SIGTERM → 2s → SIGKILL).

**Uso Windows:**
- Duplo-clique em `00_killall.bat`
- OU: `pwsh -File 00_killall.ps1 [-KeepOllama]`

**Uso Linux/macOS:**
- `./00_killall.sh` (mata tudo, incluindo Ollama)
- `./00_killall.sh --keep-ollama` (preserva Ollama)

**Validado:** subiu server, matou com `-KeepOllama`, confirmado :3333 morto e :11434 vivo. Reversão: `./00_iniciar.sh` ou `00_Iniciar.bat`.

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

## 3.2. Auto-instalador de ferramentas (`~/install-t3mp3st-tool.ps1`)

Instala ferramentas **sob demanda, por ferramenta** (só o que vai usar), sem admin p/ a maioria. Fontes OFICIAIS.
- `install-t3mp3st-tool.ps1 list` — mostra o estado de cada uma.
- `install-t3mp3st-tool.ps1 nuclei` — instala uma. `... all` — todas as sem-admin.
- Métodos: **pd** (release oficial GitHub do ProjectDiscovery: httpx/nuclei/naabu/katana — resolve a última versão pelo redirect `/releases/latest`, SEM api.github.com), **winget** (ffuf), **git-python** (sqlmap via git clone + wrapper `sqlmap.cmd`, usa o Python 3.11 do PC), **winget-admin** (nmap — avisa que precisa de admin/Npcap).
- Instala em `~/.t3mp3st-tools/bin` e adiciona ao PATH do usuário. O **launcher** prepende esse bin ao PATH do servidor.
- Testado: `nuclei` instalado do zero (v3.11.0, release oficial) → servidor passou a achá-lo (`/api/tools/execute nuclei` deixou de dar ENOENT). httpx já estava.
- ⚠️ Honestidade: NÃO é "instala sozinho no meio da chamada pelo navegador" — isso exigiria o servidor baixar+executar binários da internet sob demanda (risco de segurança). É um comando por ferramenta; o Chat mostra o comando exato quando falta. nmap continua precisando de admin.

### `chat-recon-v2.js` (~570 linhas) — **NOVO** motor de recon expandido

Cobre **40+ dos 60 pontos** do checklist de auditoria web black-box passiva (ver `docs/RECON_METHODOLOGY.md`). Adiciona um botão **🎯 Recon V2** na barra do Chat.

**8 fases automáticas** — todas passivas, todas passando pelo portão de aprovação `/api/approvals/authorize-target`:
1. **HTTP + Security Headers** (curl -sSI) — CSP/HSTS/XFO/XCT/CORS/Permissions-Policy + cookies flags
2. **DNS + DMARC/SPF** (via `dns.google` proxy pelo curl) — A/AAAA/MX/TXT/NS/DMARC — detecta SPF fraco (`~all`/`?all`) e DMARC `p=none`/ausente
3. **Shodan InternetDB** — portas + CVEs indexadas + tags — sem API key, passivo
4. **Certificate Transparency** (crt.sh) — descobre todos os subdomínios do domínio raiz
5. **Common paths** (~40) com **SPA-aware fallback detection** — compara content-length com um path aleatório inexistente para filtrar falso-positivo de catch-all
6. **JS bundle secrets** — 19 regex TruffleHog-style (AKIA/AIza/eyJ/sk_live_/ghp_/xoxb-/VITE_/NEXT_PUBLIC_/REACT_APP_/Supabase URL/S3/GCS/Azure/Discord+Slack webhooks/service_role)
7. **HTML markers** — Replit dev banner, bolt.new badge, comentários TODO/FIXME/senha/backup, sourcemap references
8. **TLS check** (openssl s_client -tls1/-tls1_1/-tls1_2) — sinaliza TLS 1.0/1.1 habilitados como MÉDIO

Cada achado é registrado no **Cofre** via `window.addFinding()` (integra com a persistência já existente em `t3ux_findings_v1`). Testado com `scripts/test-chat-recon-v2.mjs` — **25/25 unidade + integração opt-in** (server up).

**Base metodológica:** `docs/RECON_METHODOLOGY.md` documenta cada um dos 60 pontos com comandos executáveis e status (✅ automatizado / 🟡 semi / 🔒 exige auth / ⚠️ manual).

### `chat-recon-v2.js` v2.3 — extras acima do motor base

- **Auto-detect de URL:** colar `alvo.com` no chat (sem palavra-chave) já dispara o Recon V2. Intercepta click no botão Enviar E tecla Enter no textarea via listener em `capture: true`.
- **Relatório inline formatado:** sumário no próprio chat com headings coloridos, blocos escuros terminal-style, bullets, agrupamento por severidade — **não** redireciona para Cofre.
- **3 botões dentro da bubble** (fixa layout flex que esticava botões antes):
  - **📄 Baixar PDF** — lazy-load do jsPDF via CDN (cdnjs + fallback unpkg). Renderiza capa azul com badge CONFIDENCIAL, sumário, cards de achado com borda esquerda colorida, footer com número de página.
  - **📝 Baixar Markdown** — blob download com estrutura profissional.
  - **📋 Copiar** — `navigator.clipboard` com o Markdown.
- **Persistência independente** em `t3rv2_messages_v1` (cap 20 recons), throttle 500ms.
- **Restauração automática** ao voltar de outra aba (MutationObserver em `#page-chat.active`).
- **Botão "🧹 Limpar recons"** no header para reset manual.

### `chat-conversations.js` (~400 linhas) — **NOVO** sistema de conversas

Adicionado em 2026-08-03. Permite manter múltiplas conversas separadas com o Comandante — cada uma com seu próprio histórico.

- **Botão "💬 Conversas"** no header do chat abre drawer lateral direito
- **Botão "+ Nova conversa"** cria conversa limpa (auto-titula pela 1ª mensagem)
- **Lista de conversas** com título + data/hora + contador de mensagens
- **Delete por conversa** com confirmação
- **Storage isolado por conversa:** `t3conv_msgs_<id>` (cap 200 msg/conv, 20 conv máx)
- **Migração automática** do formato antigo `t3rv2_messages_v1` → "Recons anteriores (migrado)"
- **Chat geral capturado** via `MutationObserver` — perguntas comuns ao Comandante são salvas na conversa ativa (não só recons)
- **Chat vira aba padrão** no boot inicial (via `__t3chat.open()`) — não é mais Sala de Guerra

**Bug fix crítico:** `safeParse(localStorage.getItem(key), [])` retornava `null` quando chave não existia porque `JSON.parse(null) === null` no JS. Corrigido com check explícito.

### System prompt aprimorado (`chat-pt.js`) — Comandante bem informado

O `SYSTEM_PROMPT` do LLM local foi expandido para ~50 linhas de contexto denso. O Comandante agora sabe:

- **As 8 fases do Recon V2** e como interpretá-las
- **Metodologia dos 60 pontos** black-box (footprinting, injection, headers, storage, buckets, etc)
- **Padrões de achado reconhecidos** — HSTS/CSP/CORS wildcard, Swagger público, NgRx prod, DMARC p=none, Google API keys sem restrição, Supabase RLS, Replit deploys, bolt.new, x-render-origin-server, x-wix-request-id
- **Stacks comuns MedSimples** — Base44 (Wix), Render.com, FastAPI, Cloudflare
- **Regras invioláveis:** nunca inventar, evidência literal, PII stop, comando pronto pra copiar
- **Formato:** Markdown, conciso por padrão, expande se pedirem

Resultado: chat vira útil para **qualquer pergunta de segurança** (não só recon). Ex: "explica CSP frame-ancestors", "como funciona Cloudflare Access", "riscos de Supabase anon key exposta" — o Comandante responde com profundidade técnica.

## 3.6. Benchmark de modelos LLM (2026-08-04)

Comparei 3 modelos Ollama em 3 tarefas técnicas do Comandante (DMARC/SPF, TURNSTILE+CORS+rate-limit, interpretação de headers HTTP). Prompts em `scripts/test-llm-comparison.mjs`. Métrica: score heurístico baseado em palavras-chave técnicas + tamanho + estrutura.

| Modelo | Score | Latência média | Tamanho | RAM ativa |
|---|---|---|---|---|
| 🥇 **qwen2.5-coder:7b** | **57.7/100** | 136s | 4.36 GB | ~5 GB |
| 🥈 llama3.1:8b | 57.4/100 | 174s | 4.58 GB | ~5.5 GB |
| 🥉 qwen2.5:3b | 48.1/100 | 37s | 1.80 GB | ~2 GB |

**Vencedor:** `qwen2.5-coder:7b` — 20% melhor score que qwen2.5:3b, empate técnico com llama3.1:8b mas 20% mais rápido. Estruturação clara com Markdown, menciona termos técnicos precisos ("phishing", "spoofing", "quarantine", "reject"), dá plano de correção com código inline.

**Trade-off honesto:** 3.7× mais lento que qwen2.5:3b em CPU (136s vs 37s). Se a máquina tem GPU (CUDA/Metal), fica sub-30s. Se não tem GPU e prioriza velocidade, volte para qwen2.5:3b:

```bash
node scripts/set-default-model.mjs qwen2.5:3b
```

**Como definir modelo padrão:** `scripts/set-default-model.mjs <nome>` — escreve `TEMPEST_LOCAL_MODEL` no `~/.t3mp3st/.env`. Depois killall + iniciar novamente.

**Reproduzir benchmark:** `node scripts/test-llm-comparison.mjs --models=qwen2.5:3b,qwen2.5-coder:7b,llama3.1:8b`

**Validado no Chrome:** perguntei ao Comandante (qwen2.5-coder:7b) sobre DMARC p=none. Respondeu com definição completa de DMARC e SPF, identificou o risco de "phishing e spoofing", e deu plano de correção estruturado (p=quarantine → p=reject, ~all → -all). Resposta em ~1min30s, qualidade próxima de análise humana.

## 3.7. RAG local — 33 livros de segurança como base de conhecimento (2026-08-04)

O Comandante agora consulta uma **base de conhecimento local** com 33 livros/apostilas de segurança (PT+EN, ~50-500 páginas cada) antes de responder perguntas técnicas.

**Pipeline (100% offline, sem API keys):**
- **Extração:** `pdf-parse` v2 lê os PDFs (`~/Documents/agentes/ciber segurança/LIVROS HACKERS-.../*.pdf`)
- **Chunking:** RecursiveCharacterTextSplitter — chunks de 512 tokens (~2048 chars) com 64 tokens de overlap. Filtra chunks <50 chars (headers/footers).
- **Embedding:** `nomic-embed-text` via Ollama (`/api/embed`, 768 dim, ~275 MB). Chunks vetorizados uma vez, cached.
- **Storage:** JSON gzipped por livro em `docs/rag-data/*.json.gz` + `_manifest.json` (índice). **Ficam no repo git** — clone traz o conhecimento junto, sem re-treino.
- **Retrieval:** cosine similarity top-K=5, threshold `sim >= 0.35`. Client-side em JS puro (sem servidor extra).
- **Injeção:** `<context>[n] fonte: livro\n<trecho>\n[...]</context>\n\nPergunta: <query>` prefixado no último user message. System prompt instrui o LLM a citar `[n]`.
- **Trigger inteligente:** regex técnica (`cve|nmap|sqlmap|xss|csrf|payload|exploit|dmarc|clickjack|phish|owasp|kali|...`) + `("como"|"por que")` para queries >30 chars. Skip em saudações e queries <15 chars — evita RAG em "oi".

**Números do corpus:**
| Métrica | Valor |
|---|---|
| Livros processados | 33 (100%) |
| Chunks totais | 3.088 |
| Tamanho gzipped | 13 MB |
| Dimensão de embedding | 768 (nomic-embed-text) |
| Tempo de build (CPU) | ~40 min |

**Prova cabal (test-rag-one-shot.mjs):**
Perguntei: *"No livro sobre Clickjacking do CSIRT PoP-MG (autor Alison), qual é a técnica de Frame Busting recomendada?"*

- **SEM RAG (qwen2.5-coder:7b):** "Não tenho essa informação nos meus livros." (42 chars, LLM admite honestamente)
- **COM RAG:** Cita fonte `[2]` do "Clickjacking.pdf" do CSIRT PoP-MG, menciona "página em branco" (frase EXATA do livro), explica em detalhe técnico (835 chars com citações)

**Testes automatizados:**
- ✅ `test-rag.mjs` — 33/33 asserts (chunker, cosine, trigger, embed integração, manifest schema)
- ✅ `test-rag-knowledge.mjs` — 15/16 (93.8%) retrieval quality em 4 tópicos técnicos
- ✅ `test-rag-one-shot.mjs` — A/B com LLM real, prova impacto do RAG

**Arquivos:**
- `scripts/rag-build.mjs` (~220 linhas) — pipeline PDF → chunks → embeddings → JSON.gz
- `docs/rag-client.js` (~230 linhas) — overlay que intercepta `fetch('/api/chat')` e injeta contexto
- `scripts/test-rag.mjs`, `test-rag-knowledge.mjs`, `test-rag-one-shot.mjs` — testes unitários + integração
- `docs/rag-data/*.json.gz` — 33 arquivos + `_manifest.json` (13 MB total)

**API de controle (via console do browser):**
```javascript
window.__t3rag.stats()              // { booksLoaded, totalChunks, allLoaded, manifestBooks }
window.__t3rag.search("clickjacking", 5)  // top-5 chunks
window.__t3rag.config.topK = 3      // ajusta top-K
window.__t3rag.config.minSim = 0.4  // ajusta threshold
window.__t3rag.disable()            // desativa (restaura fetch original)
window.__t3rag.lastSearch           // último retrieval feito
```

**Limitação conhecida:** `nomic-embed-text` tem viés English-first, então queries em PT contra livros EN têm recall ~15% menor. Para paridade real, migrar para `bge-m3` (2 GB, multilíngue robusto) via `ollama pull bge-m3` e trocar `EMBED_MODEL` em `rag-build.mjs` + `rag-client.js`. **Não fizemos** porque o corpus é 95% PT e o nomic responde bem.

## 4. Diagnósticos importantes

- **"Could not connect to local LLM"** = Ollama não estava rodando (não auto-sobe após reboot). Resolvido; launcher agora garante.
- **"stalled in reconnaissance: N required task(s) failed"** = faltam **nmap** e **dig** (o recon roda `dig +short` e `nmap`). No PC: nmap/dig ausentes, curl/nslookup presentes. nmap precisa de instalação com admin+GUI (Npcap) — ação do Claudio.

## 5. Realidade do projeto (pesquisa no upstream `elder-plinius/T3MP3ST`)

Ver `FEATURES.md` e `WHITEPAPER.md` do próprio repo. Em resumo:
- **Real:** RECON, SCANNER, ANALYST; Arsenal de recon/scan (com o binário instalado); KnowledgeBase; EvasionEngine; Cofre; OPSEC; relatório Markdown.
- **Experimental (roda ferramenta real, exploração ponta-a-ponta NÃO comprovada — 0 exploits em full-chain):** EXPLOITER, INFILTRATOR, EXFILTRATOR, GHOST, COORDINATOR.
- **Removido/stub (encenação):** Pliny Specials (LEVIATHAN, GORGON, HYDRA, etc. — RETIRADOS, rotas `/api/pliny/*` removidas); módulos avançados em stub (ExploitEngine, SwarmController, CloudSecurityEngine, PersistenceController, etc.); fases da kill chain após o recon.
- **Exploração autônoma (exploit/lateral/exfil/persistência/C2) não é um bug a corrigir** — é problema não resolvido da área e não foi implementado como capacidade real. O caminho legítimo é usar ferramentas-padrão reais (nuclei/sqlmap/httpx) human-in-the-loop nos alvos autorizados.

## 6. Deploy fora da máquina (VPS DigitalOcean)

Ver **`docs/DEPLOY_VPS.md`** — guia passo-a-passo para rodar o T3MP3ST no VPS `164.92.90.27`:

- Docker Compose já pronto no repo (Dockerfile alpine + Ollama no host)
- Nginx + Let's Encrypt (HTTPS)
- **Cloudflare Access (Zero Trust)** como camada de auth (MFA + SSO), com fallback para basic-auth
- Systemd para restart no boot
- Firewall (`ufw`) fecha 3333 externo
- Rate limiting + fail2ban recomendados
- Custo: ~$12/mês (2 GB RAM recomendado para qwen 7b)

Após deploy: acessa `https://t3mp3st.seudominio.com` do celular / notebook / qualquer lugar — não precisa mais deixar o PC ligado.

## 7. Testes automatizados

Execute com o servidor rodando para pegar integração; sem servidor os testes unitários também passam (5 checks pulados quando offline).

```bash
npm run test:chat-recon-v2   # 32 checks: regex secrets, SPA fallback, fases, integração
npm run test:arsenal-tools   # 97 checks: guard shell-injection do arsenal
npm run test:autodetect      # 15 checks
npm run test:no-fitting      # 0 tells challenge-specific
```

Todos passando na última execução (2026-08-03).

## Como reverter tudo (voltar ao T3MP3ST original)

Remover do `index.html` as 6 linhas `<script src="*-pt.js">` + `chat-recon-v2.js` + `chat-conversations.js` e descomentar o bloco `TOUR_REMOVED`. Os arquivos `docs/*-pt.js` + `docs/chat-recon-v2.js` + `docs/chat-conversations.js` podem ser apagados. Backup do index em inglês: `docs/index.html.bak-en`.

Para limpar dados persistidos (localStorage), abrir DevTools no browser e rodar:
```js
Object.keys(localStorage).filter(k => k.startsWith('t3conv_') || k.startsWith('t3rv2_') || k.startsWith('t3ux_')).forEach(k => localStorage.removeItem(k))
```
