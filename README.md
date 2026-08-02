# 🌩️ T3MP3ST 🌩️

<!-- ⊰ sharp eye on the raw source. there's a flag for the curious: T3MP3ST{r3c31pt5_n0t_v1b3z} — the one that counts, you earn: run `npm run verify-claims`. LOVE PLINY ⊱ -->

```
 ▄▄▄█████▓▓█████  ███▄ ▄███▓ ██▓███  ▓█████   ██████ ▄▄▄█████▓
 ▓  ██▒ ▓▒▓█   ▀ ▓██▒▀█▀ ██▒▓██░  ██▒▓█   ▀ ▒██    ▒ ▓  ██▒ ▓▒
 ▒ ▓██░ ▒░▒███   ▓██    ▓██░▓██░ ██▓▒▒███   ░ ▓██▄   ▒ ▓██░ ▒░
 ░ ▓██▓ ░ ▒▓█  ▄ ▒██    ▒██ ▒██▄█▓▒ ▒▒▓█  ▄   ▒   ██▒░ ▓██▓ ░
   ▒██▒ ░ ░▒████▒▒██▒   ░██▒▒██▒ ░  ░░▒████▒▒██████▒▒  ▒██▒ ░
   ▒ ░░   ░░ ▒░ ░░ ▒░   ░  ░▒▓▒░ ░  ░░░ ▒░ ░▒ ▒▓▒ ▒ ░  ▒ ░░
     ░     ░ ░  ░░  ░      ░░▒ ░      ░ ░  ░░ ░▒  ░ ░    ░
   ░         ░   ░      ░   ░░          ░   ░  ░  ░    ░
             ░  ░       ░               ░  ░      ░
```

<div align="center">

**Um framework multi-agente de segurança ofensiva, construído para transformar o agente de código de IA que você já usa em um caçador de zero-days.**

![scores: re-derivable](https://img.shields.io/badge/scores-re--derivable-brightgreen) &nbsp; ![verify-claims 27/27](https://img.shields.io/badge/verify--claims-27%2F27-brightgreen) &nbsp; ![PRs welcome](https://img.shields.io/badge/PRs-welcome-purple) &nbsp; ![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue)

</div>

**Seu agente de código de IA já é um hacker — o T3MP3ST entrega a ele um arsenal.**

Aponte-o para um alvo autorizado e a kill chain se executa sozinha: **recon → exploit → report**, a partir de uma War Room no navegador ou da CLI, conduzida pelo agente em que você *já* está logado — Claude Code, Codex, Hermes, OpenCode, Oh My Pi — ou por um modelo que você roda **totalmente offline** (Ollama, LM Studio, vLLM). Sem novas chaves de API, sem tenant na nuvem, sem segunda fatura. Seu agente é o cérebro; o T3MP3ST é a máquina de guerra montada ao redor dele. **Tempestade auto-hospedada. Guerra sem chaves.** ⚡

E ele não vai pedir que você acredite na palavra dele. Na **própria suíte de 104 desafios da XBOW, ele marca 90,1% de pass@1** — acima dos 85% auto-reportados pela XBOW — junto com solves de CTF sem dicas e uma **caçada a frio de CVEs reais, pós-cutoff, que o modelo nunca tinha visto**. Todo número neste README se recalcula a partir de dados versionados com um único comando (`npm run verify-claims`). Barulhento quanto à missão, honesto quanto à construção — a [tabela de status](#o-que-entrega-hoje) diz exatamente o que está no ar, o que é andaime e o que ainda é roadmap; recibos completos em [Benchmarks](#benchmarks).

Três coisas o distinguem:

1. **Reproduzível.** Todo número neste README se recalcula a partir de dados versionados — `npm run verify-claims` re-deriva todos eles, 27/27 no verde. Uma afirmação que não pode ser reproduzida não entra. Nunca números do tipo "confie em mim".
2. **Sem chaves.** O agente de código de IA que já está na sua máquina é a espinha dorsal. Sem chaves de API, sem segunda fatura, sem porteiro.
3. **Honesto quanto ao escopo.** A [tabela de status](#o-que-entrega-hoje) marca exatamente o que é estável, experimental ou roadmap — porque red-teaming não deveria ser um sacerdócio, e com certeza não deveria rodar na base do "vibe".

**Pule para** → [Início rápido](#início-rápido) · [Guia de uso](docs/GETTING_STARTED.md) · [Guia do desenvolvedor](docs/DEVELOPER_GUIDE.md) · [Atualização](#atualizando-a-partir-do-upstream) · [O que ele caça](#o-que-ele-caça) · [O que entrega hoje](#o-que-entrega-hoje) · [Benchmarks](#benchmarks) · [Arquitetura](#arquitetura) · [Docs](#documentação)

## ⚠️ Uso autorizado apenas

O T3MP3ST é uma ferramenta de segurança **ofensiva**, construída para testes, pesquisa e educação **autorizados**. Aponte-o **somente** para sistemas que você possui ou tem **permissão explícita e por escrito** para testar. Acesso não autorizado a computadores, redes ou dados é ilegal na maioria das jurisdições — **você é o único responsável** por como usa este software e por permanecer dentro da lei e das suas regras de engajamento. Leve a tempestade aos *seus* alvos, não aos de outra pessoa.

O T3MP3ST é fornecido **no estado em que se encontra, sob a licença AGPL-3.0, sem garantia e sem responsabilização** por qualquer dano, perda ou uso indevido. Os autores não endossam, apoiam ou aprovam atividade não autorizada. Consiga permissão. Fique no escopo. Não seja uma ameaça. 🫡

## Por que ele existe

A segurança ofensiva fica atrás de anos de prática e ferramentas caras. A aposta por trás do T3MP3ST é que um enxame coordenado de agentes coloca a caça real a bugs ao alcance de pessoas que nunca receberam o convite, através de aplicações web, CTFs, smart contracts, código-fonte e OSS de embarcados/robótica. É uma aposta ambiciosa, e as seções abaixo têm o cuidado de separar o que já funciona do que ainda é uma aposta.

## O que ele caça

| Domínio | O que faz | Status |
|---|---|---|
| 🕸️ **Aplicações web** | Recon → exploit black-box, na perspectiva de atacante externo (suíte XBEN) | ✅ Estável |
| 🚩 **CTF** | Solves sem dicas, isolados em sandbox (Cybench) | ✅ Estável |
| 🤖 **Robótica / OT / embarcados** | Pipeline de divulgação coordenada para caça de vulns em OSS (OSV + PoC ao vivo + refutador) | ✅ Pipeline estável |
| 📂 **Código-fonte** | Análise white-box de repositório com decomposição cega mestre-construtor | ✅ Ingestão multilíngue (web-tree-sitter) |
| 💰 **Smart contracts** | Damn Vulnerable DeFi | ⚠️ reprodução, não descoberta inédita |
| ☁️ **Cloud (IaC)** | Benchmark de detecção de misconfig (`cloud:bench`) + arsenal de nuvem opcional (aws/az/gcloud + scoutsuite/cloudfox/pmapper; pacu com trava) | 🚧 Andaime de misconfig de IaC — exploração em nuvem ao vivo ainda sem benchmark |
| 📱 **Mobile** | Analisador estático embutido (misconfig de manifest + detecção de segredos/cleartext, `mobile:bench`) + arsenal opcional (mobsfscan/objection/drozer; frida com trava) | 🚧 Andaime de detecção estática — exploração dinâmica sem benchmark |
| 🔩 **Binário / RE** | Detector de sinks em saída decompilada (unsafe-copy / format-string / cmd-injection / int-overflow, `binary:bench`) + arsenal opcional (ghidra/radare2/objdump/checksec/strings; gdb com trava) | 🚧 Andaime de detecção estática de sinks — solving/pwn sem benchmark |

## Início rápido

Caminho mais rápido para uma War Room rodando (sem chaves, ~2 min para configurar; o tempo da missão depende do alvo):

```bash
npm install
npm run server        # War Room → http://127.0.0.1:3333/ui/
```

Na War Room, abra **Settings** e conecte um agente local (Claude Code / Codex / Hermes / OpenCode / Oh My Pi). Depois descreva um alvo ao **Op Admiral** em linguagem natural e dispare. O agente que você conectou é o cérebro. Nenhuma chave necessária.

Prefere trazer uma chave? Configure uma e pule a etapa de conexão:

```bash
export OPENROUTER_API_KEY=...     # ou VENICE_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY
export XAI_API_KEY=...            # Grok Build (grok-build-0.1) — modelo de código da xAI, com tool-calling nativo
```

Agentes locais lentos podem receber mais folga com `T3MP3ST_LOCAL_AGENT_TIMEOUT_MS`
para cada chamada de CLI, `T3MP3ST_TASK_TIMEOUT_MS` para as tarefas da missão e
`T3MP3ST_GENERAL_TIMEOUT_MS` para requisições de planejamento. Os valores são em milissegundos.

Ou rode **totalmente offline** no seu próprio modelo — sem chave, sem nuvem. Usa Ollama por padrão; aponte-o para qualquer servidor compatível com OpenAI (LM Studio, vLLM, llama.cpp):

```bash
ollama serve && ollama pull llama3                          # ou um servidor compatível com OpenAI
export TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api    # LM Studio: http://localhost:1234/v1
export TEMPEST_LOCAL_MODEL=llama3
npm run build                                               # necessário apenas a partir de um clone git
npx tempest                                                 # → "Change default provider" → local
```

O tool-calling funciona em qualquer modelo local (é conduzido por texto), então o Arsenal roda até em modelos sem function-calling nativo.

Confira os números você mesmo:

```bash
npm run verify-claims             # re-deriva cada manchete a partir do JSON versionado em bench/
```

O uso passo a passo pelo operador está em [Getting Started](docs/GETTING_STARTED.md). O uso como biblioteca/SDK, a API HTTP e a configuração de MCP estão em [docs/](docs/).

### Docker

Rode o servidor de API do T3MP3ST em um contêiner (somente localhost, não exposto externamente):

```bash
cp .env.example .env       # configure as chaves de API
docker compose up -d       # API → http://localhost:3333
docker compose logs -f     # veja os logs
```

**Nota de segurança:** o contêiner escuta em `127.0.0.1:3333` — acessível apenas a partir do localhost, não exposto à rede.

Teste a API:
```bash
curl http://localhost:3333/api/health
curl http://localhost:3333/api/bounty/platforms
```

Execute comandos dentro do contêiner:

```bash
docker compose exec app npm run verify-claims
docker compose exec app npm run cve:bench
```

Guia completo de implantação: [docs/DOCKER.md](docs/DOCKER.md).

## Atualizando a partir do upstream

Se você instalou a partir de um tarball de release ou copiou a árvore em vez de acompanhar com `git pull`, use o atualizador embutido para sincronizar com [github.com/elder-plinius/T3MP3ST](https://github.com/elder-plinius/T3MP3ST) sem perder segredos locais ou saída de bench. Ele mostra um plano numerado, pergunta **s/N** antes de mudar qualquer coisa e então roda `npm install`.

```bash
npm run update          # sincronização interativa a partir do main upstream
npm run update:dry      # apenas prévia — nenhuma mudança de git ou npm
npm run update:hard     # hard reset para upstream/main (ainda restaura caminhos protegidos)
```

Funciona em Windows (PowerShell), macOS, Linux e WSL. Requer **git** e **npm** no seu PATH.

### Modos de segurança

O atualizador é destrutivo **apenas quando explicitamente solicitado**:

| Comando | O que faz | Mudanças locais |
|---|---|---|
| `npm run update` | Sincronização interativa padrão | `git merge upstream/main`; caminhos protegidos são copiados e restaurados |
| `npm run update:dry` | Prévia somente leitura | Sem git init, fetch, merge, reset ou `npm install`; seguro em instalações via tarball |
| `npm run update:hard` | Hard reset opt-in | `git reset --hard upstream/main`; caminhos protegidos ainda são restaurados |

Todos os modos que não são dry-run perguntam **s/N** antes de mudar qualquer coisa. Passe `--force` apenas em automação confiável. No caminho de primeira vez (nenhum commit ainda), o atualizador substitui a árvore de trabalho pelo snapshot do upstream, mas os caminhos protegidos são copiados antes e restaurados depois.

### Caminhos protegidos (dentro do repo)

Antes de substituir arquivos, o atualizador faz backup de tudo em disco que corresponda a [`scripts/update-protected.txt`](scripts/update-protected.txt), e então restaura após a sincronização. **Apenas caminhos que existem localmente são afetados** — se você nunca os criou, nada acontece.

| Caminho | Por que é protegido |
|---|---|
| `.env`, `.env.*` | Chaves de API e overrides de env locais. `!.env.example` é uma exceção — o template **não** é protegido para que o upstream possa atualizá-lo. |
| `.keys.local` | Arquivo de colagem única de chaves, carregado pelos scripts de bench (ex.: `VENICE_API_KEY`) sem tocar no `.env`. |
| `.keys.bounty.json` | Credenciais de plataformas HackerOne / Bugcrowd / similares. |
| `bench/cybench/corpus-stage/` | Corpus grande clonado do Cybench (não redistribuído; caro de rebaixar). |
| `bench/cybench/service-stage/`, `bench/cybench/challenges/` | Staging Docker por execução e árvores de desafios do Cybench (regeneráveis, mas lentos de reconstruir). |
| `bench/xbow/stage/`, `bench/xbow/challenges/` | Staging de desafios XBOW/XBEN (árvores grandes de terceiros). |
| `bench/wild-hunt/` | Achados de caça a frio, PoCs, rascunhos de divulgação e resultados de campanha — material de vuln pré-coordenação. |
| `bench/decomposition-results/` | JSON de execuções de decomposição white-box (pode conter análise não reportada). |
| `bench/refusal-frontier/` | Artefatos de sondagem de fronteira de recusa (respostas cruas do modelo). |
| `bench/nyu/` | Conteúdo de CTF da NYU preparado por `nyu-prep.mjs`. |
| `docs/disclosures/` | Pacotes de divulgação para fornecedores gerados (saída do `disclosure-gen`). |
| `reports/` | Relatórios de engajamento e caça (saída persistente; mesma árvore dos volumes montados do Docker em setups de implantação). |
| `evidence/` | PoCs, capturas de tela e outras evidências de achados mantidas entre atualizações. |

Adicione seus próprios padrões em `scripts/update-protected.local.txt` (overlay local opcional; mesma sintaxe glob do manifesto principal).

### Nunca tocado (fora do repo)

Estes ficam fora da árvore do projeto — uma atualização nunca os lê ou escreve:

- `%APPDATA%\t3mp3st-nodejs\Config\config.json` (ou o caminho do store `conf` no macOS/Linux) — salvo por `npm run setup`
- **localStorage** do navegador da War Room, na origem da War Room
- Auth do agente local (`~/.codex`, `%LOCALAPPDATA%\hermes`, etc.)

## O que entrega hoje

O framework é uma kill chain de 8 operadores, e esta tabela não vai vender fumaça sobre isso. **O Recon é um motor vivo, apoiado em ferramentas** — e os dentes já são reais: 90,1% de pass@1 no XBEN, 8/10 CVEs pós-cutoff retidos fixados em arquivo/linha/CWE exatos, e um pipeline de divulgação coordenada vivo o suficiente para ter rascunhos retidos para coordenação com fornecedores agora mesmo. O que *não* está provado é o enxame. Cada operador a jusante — Exploiter, Infiltrator, Exfiltrator, Ghost — roda o **mesmo loop ReAct real, apoiado em ferramentas, do recon** (ferramentas de exploração reais, não stubs), mas os números de manchete vieram de um único agente, não da célula coordenada de 8 operadores, e a exploração ponta a ponta pelo enxame não tem benchmark e ainda é instável. O motor é real; o enxame é a parte que ainda está conquistando as suas divisas. Barulhento onde merecemos, direto sobre o resto.

| Componente | Status | Notas |
|---|---|---|
| Medição re-derivável (`verify-claims`) | ✅ Estável | toda manchete se recalcula a partir de artefatos versionados |
| Motor de recon | ✅ Estável | conduz nmap / DNS / HTTP / fingerprinting; todo achado remonta a saída real de ferramenta |
| Motor de missão + War Room + Op Admiral | ✅ Estável | sem chaves, através de um agente local conectado |
| Arsenal, servidor MCP, API HTTP | ✅ Estável | 36 ferramentas embutidas por padrão; 109 com o opt-in `T3MP3ST_FULL_ARSENAL` (+73 adaptadores, com drivers perigosos/apenas-catálogo — metasploit, hydra, pacu, frida — atrás de caminhos aprovados estreitos em vez de execução genérica) — ambas as contagens se re-derivam via `verify-claims`. `security_recon` sobre MCP |
| Contenção de escopo de egresso | ✅ Estável (ligado por padrão) | uma vez definido o alvo da missão, as ferramentas de rede embutidas recusam hosts públicos fora de escopo — não o alvo/subdomínios, não loopback/privado (`SCOPE DENIED`) — um padrão apertado, não um executor cru de ferramentas |
| Pipeline de divulgação coordenada | ✅ Estável | novidade via OSV + PoC ao vivo + painel refutador + CVSS; apenas rascunhos, quem envia é um humano |
| Análise white-box de código-fonte | ⚠️ Experimental | Ingestão multilíngue via web-tree-sitter (Python/JS/TS/Go/Java/C/C++); Python mantém seu parser regex, enquanto outras linguagens falham em aberto para nenhum bloco extraído; a decomposição multi-modelo custa mais tokens, não menos |
| DeFi (Damn Vulnerable DeFi) | ⚠️ Experimental | reproduz classes de exploit conhecidas; não é descoberta inédita |
| Exploiter / Infiltrator / Exfiltrator / Ghost | ⚠️ Experimental | rodam o loop ReAct real apoiado em ferramentas (mesmo motor do recon); não provados como enxame coordenado — o agente único é o caminho com benchmark, a exploração por enxame ao vivo ainda é instável |
| Módulos avançados (cloud, persistência, enxame, cognição) | 🚧 Planejado | apenas interface em `src/stubs/` |
| Loop de auto-aperfeiçoamento | 🧪 Pesquisa | registra lições + propostas hoje; realimentá-las no planejamento é roadmap |

Detalhamento completo, recurso por recurso: [FEATURES.md](FEATURES.md).

## Cobertura por domínio

Onde a tempestade alcança hoje — e para onde ela vai. Mesma disciplina de tudo o mais: um domínio só é ✅ quando há um recibo por trás dele.

| Domínio | O que cobre | Status |
|---|---|---|
| 🕸️ **Web** | apps, APIs, fluxos de auth, OWASP Top 10 | ✅ **Núcleo** — XBEN 90,1% pass@1 |
| 📂 **Código** | auditorias white-box de código-fonte, caça de vulns estilo SAST | ✅ **Comprovado (resultado de caça)** — CVE-Zero retido: agente único 8/10 arquivo/linha/CWE exatos, 10/10 encontrados (7 linguagens); o *motor* de ingestão de repo em si ainda é ⚠️ experimental |
| 🚩 **CTF** | wargames, ranges de prática, desafios | ✅ **Comprovado** — Cybench 23/40 sem dicas |
| 🔌 **Rede / Infra** | recon, fingerprinting de serviço/stack; movimento lateral + escalada de privilégio | ✅ recon (motor nmap/DNS/HTTP ao vivo) · ⚠️ lateral/privesc experimental |
| 🤖 **Embarcados / IoT / OT** | firmware, robótica, OSS de ICS/SCADA | ✅ **Pipeline de CVE ao vivo** — rascunhos de divulgação coordenada retidos para fornecedores |
| 📦 **Cadeia de suprimentos** | auditorias de dependências, instalação-sem-confirmação | ⚠️ **Real** — classe dedicada; acertou um CWE-829 no conjunto retido |
| 💰 **Blockchain** | smart contracts, DeFi, Solidity | ⚠️ **Somente reprodução** — Damn Vulnerable DeFi, não descoberta inédita |
| ☁️ **Cloud** | misconfig de AWS/GCP/Azure, IAM, serverless | 🚧 **Em desenvolvimento** |
| 📱 **Mobile** | segurança de apps Android/iOS | 🚧 **Em desenvolvimento** |
| 🏢 **Identidade / AD** | Kerberos, pass-the-hash, ataques a AD | 🚧 **Em desenvolvimento** |
| 🔐 **Binário / RE** | overflows, ROP, desenvolvimento de exploits | 🚧 **Em desenvolvimento** — precisa de ferramentas especializadas |

A arquitetura de classes/esquadrões faz com que novos domínios *componham* em vez de bifurcar — cada um é um loadout (classes especialistas + arsenal + adaptador de alvo + um benchmark). Domínios 🚧 são lançados no escuro até terem um número.

## Benchmarks

Resultados de manchete. Cada um se recalcula a partir do JSON versionado com `npm run verify-claims`; metodologia completa e ressalvas estão nos docs linkados.

| Suíte | Resultado | Contexto |
|---|---|---|
| **XBEN** — suíte de 104 desafios da XBOW, black-box | **média pass@1 de 90,1%** (Wilson-95 86,2–92,9), piso 91/104 · gpt-5.5 | a XBOW auto-reporta 85% na mesma suíte; a nossa re-deriva o veredito avaliado a partir de artefatos versionados (transcrições cruas removidas por privacidade) |
| **XBEN** — white-box (reportado à parte) | pass@1 98,7%, best-ball 104/104 · gpt-5.5 | nunca misturado com o número black-box |
| **Cybench** — bench acadêmico de 40 tarefas, Opus 4.8, sem dicas | **23/40 (58%) sem dicas, pass@1 de execução única** (imposto por `verify-claims`) | não é o recorde de score cru (Anthropic: 76,5% pass@10); toda flag avaliada contra o oráculo versionado |
| **Matriz de modelos Cybench** — subconjunto idêntico e versionado de 15 tarefas, pass@1 | **Opus 4.7 vs 4.8**, com recibos de fonte por tarefa e desfechos separados de falha/abstenção/infraestrutura | [reconstrua e inspecione a matriz de modelo/harness](docs/MODEL_MATRIX.md); comparação histórica de sistema, não um ranking isolado de modelo |
| **CVE-Zero** — 10 CVEs reais pós-cutoff (2026), **retidos**, 7 linguagens | **agente único 8/10 arquivo/linha/CWE exatos** (verificado todos-exatos, estável) · **10/10 encontrados** (pack completo) | **à prova de memorização e de ajuste**: pós-cutoff, e os prompts endurecidos nunca foram tunados nestes; `verify-claims` recalcula. n=10, direcional; a vantagem do enxame aqui é o recall, não uma prova de que coordenação-vence-solo |

**Como ler isto:**

- Toda flag resolvida é avaliada contra um oráculo de verdade-fundamental versionado — não um auto-report — e o `verify-claims` recalcula o passa/falha. As transcrições cruas por passo são removidas pela privacidade do operador, então você re-checa o **veredito avaliado**, não a saída crua da ferramenta. Zero fabricado, imposto por uma guarda anti-ajuste que roda em todo push.
- Black-box (fonte retida) e white-box (fonte preparada) são reportados à parte e nunca misturados.
- Estes rodaram um **loop ReAct de agente único, não o enxame de 8 operadores.** O enxame é arquitetura do framework; não é o que marcou estes números.
- Os resultados são sistema-contra-sistema: este harness conduzindo um modelo atual forte, não uma afirmação de harness isolado.

O número não é o flex — o **recibo** é. Um harness sem chaves, open-source, que te entrega a re-execução em vez de pedir que você confie: clone-o, rode `npm run verify-claims`, e todo veredito acima se recalcula a partir do seu oráculo versionado na sua frente.

Leitura mais profunda: [WALL_FORENSICS](docs/WALL_FORENSICS.md) (falhas por desafio), [CYBENCH](docs/CYBENCH.md), [INTEGRITY_LEDGER](docs/INTEGRITY_LEDGER.md) (auditoria de contaminação e toda retratação), [OBSIDIVM](docs/OBSIDIVM.md) (o nosso próprio range web ao vivo).

## Documentação

| Doc | Conteúdo |
|---|---|
| [Índice de docs](docs/README.md) | mapa da documentação de operador, desenvolvedor, benchmark e release |
| [Getting Started](docs/GETTING_STARTED.md) | instalação, primeiro launch, primeira missão segura, básico da CLI, atualizações e troubleshooting |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | mapa do código, scripts, uso do SDK, pontos de extensão e checagens de release |
| [API Reference](docs/API_REFERENCE.md) | grupos de rotas da API HTTP local e notas de integração |
| [MCP Guide](docs/MCP_GUIDE.md) | configuração do servidor MCP e uso de `security_recon` |
| [FEATURES.md](FEATURES.md) | status recurso por recurso (`[x]` entregue / `[~]` parcial / `[ ]` planejado) |
| [SCOPE_AND_AUTHORIZATION](docs/SCOPE_AND_AUTHORIZATION.md) | modelo de autoridade, recibos de escopo, regras de evidência e reteste |
| [VERIFIED_PROVENANCE](docs/VERIFIED_PROVENANCE.md) | como os achados se tornam provados-por-ferramenta em vez de afirmados-pelo-modelo |
| [CONTRIBUTION_RECEIPTS](docs/CONTRIBUTION_RECEIPTS.md) | template de recibo de PR para escopo, modo de execução, rótulos de modelo/harness, redação e verificação |
| [MODEL_MATRIX](docs/MODEL_MATRIX.md) | matriz reproduzível de benchmark entre modelos e seleção arbitrária de modelo para teste de variante |
| [TEAM_PREVIEW](docs/TEAM_PREVIEW.md) | caminho de primeira execução e roteiro de revisão |
| [INSTALL_MATRIX](docs/INSTALL_MATRIX.md) | tabela de prontidão macOS / Linux |
| [ARSENAL_ACTIVATION_PLAN](docs/ARSENAL_ACTIVATION_PLAN.md) | configuração opcional de ferramentas externas |
| [PULL_REQUEST_DELIVERY](docs/PULL_REQUEST_DELIVERY.md) | checklist de contribuidor e mantenedor para PRs escopados e revisáveis |
| [CYBENCH](docs/CYBENCH.md) · [WALL_FORENSICS](docs/WALL_FORENSICS.md) · [INTEGRITY_LEDGER](docs/INTEGRITY_LEDGER.md) · [COGNITIVE_ARCHITECTURE](docs/COGNITIVE_ARCHITECTURE.md) | metodologia de benchmark |
| [RELEASE_CHECKLIST](docs/RELEASE_CHECKLIST.md) | os portões que uma release precisa passar |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        T3MP3ST COMMAND                          │
├─────────────────────────────────────────────────────────────────┤
│   MISSION CONTROL  ◄──  TARGET MODEL  ──►  ARSENAL (TOOLS)       │
│                          ▲                                       │
│   AGENT CELL:  RECON · SCANNER · EXPLOITER · INFILTRATOR ·       │
│                EXFILTRATOR · GHOST · COORDINATOR · ANALYST       │
│                          ▲                                       │
│   EVIDENCE VAULT  ·  CREDENTIAL STORE  ·  FINDINGS LEDGER        │
│                          ▲                                       │
│   OPSEC LAYER  ·  COMMS CHANNEL  ·  LLM BACKBONE                 │
└─────────────────────────────────────────────────────────────────┘
```

Os operadores mapeiam para as fases do MITRE ATT&CK e da Cyber Kill Chain (o recon está vivo; as fases posteriores são andaimes):

| Operador | Fase | MITRE | Função |
|---|---|---|---|
| **Recon** | Reconhecimento | TA0043 | OSINT, descoberta de rede, enumeração de ativos |
| **Scanner** | Descoberta | TA0007 | varredura de vulnerabilidades, fingerprinting de serviço |
| **Exploiter** | Acesso Inicial | TA0001 | exploração, entrega de payload |
| **Infiltrator** | Movimento Lateral | TA0008 | pós-exploração, escalada de privilégio |
| **Exfiltrator** | Coleta / Exfil | TA0009/10 | extração de dados, coleta de credenciais |
| **Ghost** | Persistência | TA0003 | persistência, furtividade, limpeza |
| **Coordinator** | Comando & Controle | TA0011 | controle de missão, orquestração |
| **Analyst** | Análise | — | análise de padrões, relatórios |

**Provedores:** OpenRouter, Venice, Anthropic, OpenAI, ou um agente local sem chaves (Claude Code / Codex / Hermes / OpenCode / Oh My Pi). Configure `OPENROUTER_API_KEY` / `VENICE_API_KEY` / `ANTHROPIC_API_KEY`, ou conecte um agente em Settings.

**Integrações:** `node dist/mcp-server.js` expõe `security_recon` para agentes cientes de MCP. `npm run server` inicia a API HTTP (`POST /api/mission/start`, `GET /api/mission/status`, e mais). Referência completa em [docs/](docs/).

## Contribuindo — junte-se ao enxame

Red-teaming não deveria ser um sacerdócio. Traga um adaptador, um pacote de prompts, um runbook, uma nova ferramenta de arsenal ou um relatório de bug.

**Uma regra, inegociável:** tudo aqui é para **testes autorizados apenas**. Alvos próprios, escopados ou consentidos. Construa para os defensores, ou não construa aqui.

1. Faça o fork, crie a branch.
2. Abra um PR com testes. Se você mexer num número de manchete, o `npm run verify-claims` tem que continuar verde.

Processo de release e portões: [RELEASE_CHECKLIST](docs/RELEASE_CHECKLIST.md).

## Licença

AGPL-3.0. Veja [LICENSE](LICENSE).

---

<div align="center">

*Fortes fortuna iuvat* — a sorte favorece os audazes.

⊰•-•✧ LOVE PLINY ✧•-•⊱ 🌩️

</div>
