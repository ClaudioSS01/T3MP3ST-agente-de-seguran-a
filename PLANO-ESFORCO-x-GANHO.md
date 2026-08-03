# T3MP3ST — Plano: Esforço × Ganho (o que fica, o que sai)

Triagem honesta de cada peça "não-real" do projeto: **vale a pena tornar real? qual o ganho? qual o esforço?** — para decidir o que construir, o que deixar como andaime honesto, e o que cortar.

Escalas: Esforço = Baixo / Médio / Alto / Altíssimo · Ganho real = Baixo / Médio / Alto.
Veredito = 🟢 CONSTRUIR · 🟡 TALVEZ (condicional) · 🔴 CORTAR/deixar como está.

> Princípio: só conta como "ganho real" o que **executa ferramenta de verdade e traz resultado verificável** em alvo autorizado, com humano no loop. Exploração/persistência/C2 autônomos NÃO entram (fronteira de pesquisa + linha ética).

---

## 🟢 CONSTRUIR — alto ganho, esforço razoável, legítimo

| Item | Ganho se for real | O que é preciso | Esforço |
|---|---|---|---|
| **Chat → Recon executor** | O agente-chefe EXECUTA (curl+DNS hoje, nmap depois) e traz resultado real, não só conselho | Ligar o Chat ao `/api/tools/recon` + tratar aprovação (403) | **Baixo** |
| **Pipeline de scan real (ex-ScannerOrchestrator)** | Achados de vuln DE VERDADE: nuclei (CVEs/misconfig), httpx (fingerprint), sqlmap (SQLi) — human-gated | Instalar os CLIs (admin) + ligar `T3MP3ST_FULL_ARSENAL` + orquestrar as chamadas | **Médio** |
| **ReportingEngine (relatório PDF/HTML)** | Entregável profissional dos achados reais (pra cliente/registro/LGPD) | Gerar PDF/HTML a partir do `missionFindings` (já temos os dados) | **Baixo** |
| **Import de scanner (Nmap XML / Nuclei JSON)** | Trazer resultados de scans que você já roda por fora pra dentro do Cofre | Parser do XML/JSON → `addFinding` | **Baixo-Médio** |

## 🟡 TALVEZ — depende dos seus ativos ou do modelo

| Item | Ganho se for real | O que é preciso | Esforço | Condição |
|---|---|---|---|---|
| **BrowserAutomation** | Recon de apps JS-pesados, screenshots, testar fluxos de login | Playwright + wiring | **Médio** | Se for testar web apps modernos (React/SPA) |
| **CloudSecurityEngine** | Enum de misconfig AWS/GCP/Azure (IAM, S3) — alto valor | Wiring de prowler/scoutsuite/steampipe | **Médio-Alto** | Só se você tiver ativos em cloud |
| **BenchmarkRunner** | Medir se a config/modelo está rendendo antes de gastar numa missão | Rodar o harness de bench local | **Baixo-Médio** | Útil pra afinar o modelo local |
| **ReasoningEngine / Cognition (CoT/ToT)** | Agente raciocina melhor no recon | Prompt-engineering do loop | **Médio** | Limitado pelo modelo 7B — ganho incerto sem modelo forte |
| **LearningEngine** | Sistema lembra o que funcionou entre missões | Persistir + reusar padrões | **Médio** | Ganho só aparece com muitas missões |
| **WorkflowOrchestrator** | Playbooks multi-passo repetíveis (ex: "recon web padrão") | Encadear tools em receita | **Médio** | Bom quando o scan real já existir |

## 🔴 CORTAR / deixar como andaime honesto — esforço alto, ganho baixo/incerto, ou linha ética

| Item | Por que não vale | Veredito |
|---|---|---|
| **ExploitEngine (exploit autônomo real)** | Fronteira de pesquisa (0 exploits mesmo no upstream) + linha ética. Altíssimo esforço, ganho não comprovado | 🔴 Não construir |
| **SwarmController (exploração coordenada do enxame)** | É exatamente a parte que ninguém provou funcionar. Altíssimo esforço | 🔴 Deixar como está |
| **PersistenceController (implante / C2 / beacon)** | Automação de intrusão real — não entrego, mesmo em ativo autorizado | 🔴 Cortar |
| **Fases da kill chain pós-recon (autônomas)** | Mesmo problema do ExploitEngine. Manter como rótulo/checklist manual honesto | 🔴 Manter como andaime |
| **Pliny Specials (LEVIATHAN, GORGON, etc.)** | Já removidos pelo upstream; eram catálogo de payload sem uplift medido | 🔴 Manter removido |
| **ProtocolHandler** | Plumbing abstrato, sem ganho direto pro usuário | 🔴 Ignorar |

---

## Recomendação de ordem (se topar seguir)

1. **Chat → Recon** (baixo esforço, valor imediato, funciona hoje com curl+DNS).
2. **Instalar nmap** (você) → recon completo.
3. **Pipeline de scan real** com nuclei/httpx (o maior salto de "achado real").
4. **ReportingEngine** (transformar achados em relatório entregável).
5. Import Nmap/Nuclei se você já roda scans por fora.

O resto (exploit/persistência/C2/swarm autônomo) **fica como andaime honesto** — a UI já rotula isso corretamente (nota na Sala de Guerra + "model-asserted" no modal), então ninguém é enganado.

---

## Resumo em uma linha

**Fica:** recon + scan real human-gated + relatório. **Sai (ou vira andaime honesto):** exploração/persistência/C2/swarm autônomos — não porque preguiça, mas porque não é real em lugar nenhum e/ou é linha que não cruzamos.
