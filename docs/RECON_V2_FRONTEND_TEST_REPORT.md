# T3MP3ST — Relatório de Teste Frontend (Recon V2)

Data: 2026-08-03
Ambiente: Windows 11, Node 24.14, Ollama 0.31.1 com qwen2.5:3b, Chrome (Claude in Chrome extension) contra `http://127.0.0.1:3333`.

## Metodologia

Testado no browser real via extensão Chrome, disparando o botão "🎯 Recon V2" contra `example.com` e observando comportamento em cada fase. Comparação entre **o que executa de verdade** e **o que finge funcionar** (fallback/stub/mensagem enganosa).

---

## O QUE FUNCIONA DE VERDADE ✅

### 1. Chat com LLM local (Ollama)
- Modelo `qwen2.5:3b` responde em ~5s a prompts curtos.
- Streaming (NDJSON) funcional pelo próprio Ollama (`/api/chat`).
- Prova: "diga oi em uma palavra" → `Olá`

### 2. Botão Recon V2 injetado na barra do Chat
- Meu overlay `chat-recon-v2.js` injeta o botão automaticamente após o chat-pt.js montar.
- Clique dispara `fullReconV2()` com o texto atual do input como alvo.

### 3. Fase 1 — HTTP + Security Headers
- **REAL:** curl -sI executado no server, headers literais renderizados.
- Detecta ausência de HSTS, CSP, X-Frame, X-Content-Type, CORS wildcard, Permissions-Policy permissiva, cookies sem HttpOnly/Secure/SameSite.
- example.com: encontrou 3 MÉDIO (HSTS, CSP, X-Frame ausentes) + 2 BAIXO (Server exposto: cloudflare, X-Content-Type-Options ausente).

### 4. Fase 2 — DNS + DMARC/SPF
- **REAL:** curl via `-G --data-urlencode` para `dns.google/resolve`, retorna A/MX/TXT/NS/_dmarc.
- Prova example.com: `A: 172.66.147.243, 104.20.23.154`, `TXT: v=spf1 -all | _k2n1y4vw3qtb4skdx9e7dxt97qrmmq9`, `DMARC: v=DMARC1;p=reject;sp=reject;adkim=s;aspf=s`.
- Corretamente identificou example.com como bem-configurado (SPF `-all` + DMARC `p=reject`).

### 5. Fase 3 — Shodan InternetDB
- **REAL:** curl direto para `internetdb.shodan.io/<IP>`, sem API key.
- Prova example.com IP 172.66.147.243: `Portas: 80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2096, 8080, 8443, 8880`, `CPEs: cpe:/a:cloudflare:cloudflare`, `Vulns CVE: (nenhuma)`, `Tags: cdn`. Detectou corretamente que example.com está atrás de Cloudflare.

### 6. Fase 4 — Certificate Transparency (crt.sh)
- **REAL:** curl com `--data-urlencode "q=<dom>"` via `-G` para `crt.sh/`.
- Prova example.com: **"Encontrados 10 subdomínios"** com lista renderizada.
- Nota: usa busca literal (`q=<dom>`) em vez de wildcard (`q=%.<dom>`) porque o wildcard causa **502 Bad Gateway** intermitente no próprio crt.sh (bug do serviço deles, não do T3MP3ST).

### 7. Fase 7 — HTML markers (Replit/bolt.new/TODO/sourcemaps)
- **REAL:** curl -s do HTML, regex client-side.
- example.com: "✓ Nenhum marker suspeito" (esperado).

### 8. Fase 8 — TLS check
- **REAL:** openssl s_client -tls1/-tls1_1/-tls1_2 executado no server.
- example.com: `TLS 1.0: ✓ rejeitado`, `TLS 1.1: ✓ rejeitado`, `TLS 1.2: ?` (o parser precisa refinar detecção do 1.2 quando openssl não emite "Protocol" line, mas o rejeição do TLS 1.0/1.1 é o achado real).

### 9. Persistência no Cofre
- **REAL:** cada achado passa por `window.addFinding()` → `t3ux_findings_v1` localStorage.
- Etapa 4 (Resultados) da Sala de Guerra mostra achados agregados por severidade.
- Sobrevive a reload (12 achados acumulados de 3 execuções).

---

## O QUE FINGE FUNCIONAR ❌ (corrigido nesta sessão)

### Bug 1 — Comandos com `%` rejeitados (400 shell control chars)
- **Sintoma:** primeira versão do motor v2 usava `curl -w "%{http_code}"` e `q=%25.dominio`. O server rejeita `%` no comando com erro "Shell control characters are not allowed".
- **Impacto:** Fase 4 (crt.sh) sempre falhava com "crt.sh parse falhou"; Fase 5 (paths) mostrava status codes vazios.
- **Fix aplicado:** substituído por `curl -sI` (sem `-w`) e `--data-urlencode` (o curl encoda o `%` internamente).

### Bug 2 — Comandos com `&` rejeitados
- **Sintoma:** query strings tipo `?q=X&output=json` são rejeitadas (`&` = shell control).
- **Fix aplicado:** usar `-G --data-urlencode` para cada parâmetro separadamente.

### Bug 3 — Server parseia o ÚLTIMO arg do comando como target
- **Sintoma:** `curl -G https://api.com --data-urlencode "type=A"` → server infere target = `type=A` → "Command target mismatch".
- **Fix aplicado:** reordenar para URL ficar POR ÚLTIMO: `curl --data-urlencode "type=A" -G https://api.com`.

### Bug 4 — crt.sh wildcard causa 502 Bad Gateway
- **Sintoma:** `q=%.example.com` (busca por subdomínios via LIKE) faz o crt.sh retornar HTML 502.
- **Origem:** bug do próprio crt.sh (comprovado via bash direto — não é do T3MP3ST).
- **Fix aplicado:** usar `q=<dom>` (busca literal). O crt.sh retorna todos os certs contendo essa string no `name_value`, e extraímos os subdomínios do lado cliente parseando `name_value` de cada cert.

### Bug 5 — Mensagem "sem interpretação — LLM indisponível"
- **Sintoma:** ao pedir "recon em X", o chat-pt.js original chama LLM para interpretar a saída literal. Se o Ollama não está rodando OU o modelo default `qwen2.5-coder:7b` não está instalado, retornava "LLM indisponível".
- **Root cause:** ambiente do usuário tinha Ollama parado + modelo default não instalado (só qwen3:4b-instruct e qwen2.5:3b).
- **Fix aplicado:** trocar `TEMPEST_LOCAL_MODEL` no `~/.t3mp3st/.env` para `qwen2.5:3b` (instalado). Alternativamente, o usuário pode: `ollama pull qwen2.5-coder:7b`.

---

## LIMITAÇÕES QUE NÃO SÃO BUGS ⚠️

### 1. "Claude in Chrome" (extensão do agente de teste) redacta certas respostas
- Ao testar via minha ferramenta de browser, respostas do server contendo cookies/query strings foram substituídas por `[BLOCKED: Cookie/query string data]`.
- **NÃO afeta o usuário real** no Chrome normal. É proteção da minha extensão de teste (Anthropic Chrome policy).

### 2. Fase 5 — Common paths: 51 checks × 1 curl cada = ~5-15s
- Muitos requests sequenciais. O motor faz em paralelo com `Promise.all`, mas cada request passa pelo escopo de aprovação (agora cached por target — 1x approval por host).
- Aceitável para recon passivo; poderia ser paralelizado ainda mais com concorrência bounded.

### 3. Fase 6 — Bundle JS secrets: só escaneia bundles do MESMO HOST
- Sites que carregam JS de CDN externa (unpkg, jsdelivr, cdn.<empresa>) não têm bundles próprios examinados.
- Correto pelo escopo — não vamos escanear CDN de terceiros sem autorização.

### 4. nmap continua exigindo admin (Windows + Npcap)
- Fase original de portas era `nmap -F`. Substituímos por Shodan InternetDB (passivo, sem admin), mas Shodan só tem dados de IPs previamente scaneados por eles. Para scan ativo real, precisa instalar nmap.

---

## Como o usuário pode reproduzir o teste

```powershell
# 1. Subir Ollama
ollama serve
ollama pull qwen2.5:3b  # ou qwen2.5-coder:7b se preferir e tiver 5GB+ RAM sobrando

# 2. Subir T3MP3ST (script de instância única)
~/T3MP3ST.cmd

# 3. Abrir http://127.0.0.1:3333/ui no Chrome
# 4. Ir em Chat → dropdown Modelo → escolher qwen2.5:3b
# 5. Digitar "example.com" no campo de texto
# 6. Clicar botão "🎯 Recon V2" na barra
```

Espera ~30-60s. O chat mostra as 8 fases com output real e um sumário no final.
Vá em Cofre de Evidências ou Sala de Guerra → Etapa 4 para ver achados persistidos.

## Próximos passos sugeridos

1. **Melhorar detecção TLS 1.2** — refinar parser openssl para reconhecer sucesso mesmo sem linha "Protocol".
2. **Adicionar retry no crt.sh** — se 502 na 1ª tentativa, esperar 3s e tentar de novo.
3. **Fase 9 — Wayback Machine** — snapshots históricos podem revelar paths removidos.
4. **Dossiê PDF profissional** — botão "Exportar PDF" no Cofre gerando relatório estilo MedSimples.
