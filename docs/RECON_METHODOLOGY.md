# T3MP3ST — Metodologia de Recon Black-Box (60 pontos)

Este documento é o **cérebro do Comandante** para auditorias passivas/semi-ativas. Cada ponto tem: (a) o que checar, (b) o comando executável, (c) como interpretar o resultado, (d) status no motor v2 (`chat-recon-v2.js`).

Convenções:
- ✅ **Automatizado no motor v2** — o Chat executa e adiciona ao Cofre
- 🟡 **Semi-automatizado** — parte roda; parte precisa análise manual
- 🔒 **Bloqueado pelo escopo passivo** — precisa autorização escrita + credenciais válidas para teste ativo
- ⚠️ **Manual** — não vale a pena automatizar (ex: SSL Labs pública)

Regra geral: **NUNCA execute payloads/exploit sem autorização escrita explícita**. O escopo padrão do T3MP3ST é passivo até o operador aprovar o alvo (portão em `/api/approvals/authorize-target`).

---

## BLOCO 1 — Reconhecimento Inicial (Footprinting)

### 1. Stack tecnológica ✅
Identificar CMS, framework, servidor pelos headers e HTML.
```
curl -sSI https://alvo.com | grep -iE "^(server|x-powered-by|x-aspnet)"
```
**Interpreta:** `nginx/1.25.2` → CVE lookup. `X-Powered-By: Express` → Node.js. Ausência de headers = tech disclosure OK.

### 2. Versões expostas em headers ✅
Idem #1 — o motor v2 sinaliza como "Server exposto: X" (BAIXO).

### 3. Subdomínios esquecidos ✅ Certificate Transparency
```
curl -s "https://crt.sh/?q=%25.dominio.com&output=json"
```
**Interpreta:** procure subs `dev.`, `staging.`, `old.`, `backup.`, `qa.`, `test.`, `demo.`, `impersonate.`. O v2 lista todos os subs únicos que respondem.

### 4. DNS mal configurado 🟡
```
curl -s "https://dns.google/resolve?name=dominio.com&type=NS"
# AXFR (zone transfer) exige `dig` local (não disponível via curl):
dig @ns1.dominio.com dominio.com AXFR
```
**Interpreta:** se AXFR retorna registros = **CATÁSTROFE** (raro hoje). CNAME órfão apontando para bucket S3/Heroku/Vercel deletado = **subdomain takeover**.

### 5. SSL/TLS fraco ✅ via openssl
```
openssl s_client -servername alvo.com -connect alvo.com:443 -tls1
# Se retornar "no protocols available" = bom (rejeita TLS 1.0)
openssl s_client -servername alvo.com -connect alvo.com:443 -tls1_2 -brief
```
Manual complementar (⚠️): `https://www.ssllabs.com/ssltest/analyze.html?d=alvo.com` — nota A+/F.

---

## BLOCO 2 — Arquivos e Diretórios Expostos

### 6-12. Common paths ✅ com SPA-aware
O motor v2 já testa **~40 paths** e detecta SPA catch-all (comparando content-length com um path aleatório inexistente).

Lista atual: `/.env`, `/.env.production`, `/.env.local`, `/.env.bak`, `/.git/HEAD`, `/.git/config`, `/.DS_Store`, `/.well-known/security.txt`, `/robots.txt`, `/sitemap.xml`, `/swagger`, `/swagger/v1/swagger.json`, `/api-docs`, `/openapi.json`, `/api/swagger`, `/graphql`, `/admin`, `/wp-admin`, `/wp-login.php`, `/phpmyadmin`, `/adminer.php`, `/cpanel`, `/manager/html`, `/api/health`, `/api/debug`, `/actuator`, `/actuator/env`, `/server-status`, `/server-info`, `/phpinfo.php`, `/web.config`, `/package.json`, `/composer.json`, `/requirements.txt`, `/asset-manifest.json`, `/manifest.json`, `/backup.zip`, `/database.sql`, `/dump.sql`.

**Interpreta:** SPA fallback (content-length igual ao probe aleatório) = ignorar. Content-length diferente e 200 = achado real.

### 8. Listagem de diretórios ⚠️
Se `/uploads/` ou `/backup/` retorna HTML com "Index of /" = falha. Manual (o motor v2 não parseia HTML de dir listing ainda).

---

## BLOCO 3 — Autenticação e Controle de Acesso 🔒

Todos os itens (#13-17) exigem interação ativa com formulários de login. **Fora do escopo passivo.**

- **#13 Brute force** — proibido sem autorização escrita. Use Burp Intruder / Hydra apenas em labs próprios.
- **#14 Enum de usuários** — comparar respostas "usuário existe" vs "senha errada" no login e reset password.
- **#15 Reset password previsível** — gerar 3+ tokens e ver se têm padrão temporal.
- **#16 IDOR** — trocar `?user_id=123` por `124`. **Só com auth válida.**
- **#17 Admin URL sem auth** — `GET /admin/dashboard` direto. O motor v2 testa `/admin` e sinaliza se 200 real.

---

## BLOCO 4 — Injeção e Manipulação 🔒

**Fora do escopo passivo.** Itens #18-23 (SQLi, XSS refletido/persistente, CSRF, Open Redirect, SSRF) exigem envio de payloads. Autorize o escopo, então use:
- SQLi: `sqlmap -u "URL" --batch --level=1 --risk=1`
- XSS: `dalfox url URL` ou XSStrike
- Open Redirect: manual (`?redirect=https://evil.com` — ver se ecoa)
- SSRF: em uploads por URL — tentar `http://169.254.169.254/` (AWS metadata) apenas em ambiente autorizado.

O T3MP3ST expõe adapters para esses (`T3MP3ST_FULL_ARSENAL=true`), mas cada chamada exige aprovação humana explícita.

---

## BLOCO 5 — Headers de Segurança ✅ (motor v2)

### 24. Headers ausentes
O motor extrai e sinaliza:
- HSTS ausente → **MÉDIO**
- CSP ausente ou com `unsafe-inline` / `unsafe-eval` → **MÉDIO**
- X-Frame-Options + `frame-ancestors` ausentes → **MÉDIO** (clickjacking)
- X-Content-Type-Options ausente → **BAIXO**

Complementar manual (⚠️): `https://securityheaders.com` para uma nota A-F.

### 25. CORS wildcard
Motor sinaliza `Access-Control-Allow-Origin: *` como MÉDIO.
```
curl -sI -H "Origin: https://evil.example.com" https://alvo.com/api/x
# Se ACAO ecoa evil.example.com + ACAC: true → crítico
```

### 26. Clickjacking
Motor checa header. PoC manual:
```html
<iframe src="https://alvo.com/perfil" style="opacity:0.001;position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
```

### 27. Cookies inseguros ✅
Motor extrai `Set-Cookie` e sinaliza cada cookie sem HttpOnly / Secure / SameSite (MÉDIO).

---

## BLOCO 6 — APIs e Endpoints

### 28. APIs sem autenticação ✅
Motor tenta `/swagger/v1/swagger.json`, `/api-docs`, `/openapi.json`. Se retornar 200 com JSON = Swagger público (ALTO).

Manual: baixar swagger.json e listar rotas de `/external/*`, `/admin/*`, `/internal/*`. Testar cada uma sem token — se retornar dados = ALTO. Se 401 = OK.

### 29. GraphQL introspection ✅ (parcial)
Motor testa `/graphql`, `/api/graphql`, `/v1/graphql`. Se responder algo diferente de 404/403, tentar manual:
```
curl -X POST https://alvo.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__schema{types{name}}}"}'
```

### 30. Upload sem validação 🔒
Precisa auth. Manual apenas em escopo autorizado.

---

## BLOCO 7 — Vazamentos no Build ✅ (motor v2)

O motor v2 baixa até 3 bundles JS locais e roda 19 regex TruffleHog-style:

| Padrão | Regex | Severidade |
|---|---|---|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | ALTO |
| Google API Key | `AIza[0-9A-Za-z_-]{35}` | ALTO |
| Stripe Live | `sk_live_[0-9a-zA-Z]{24,}` | ALTO |
| GitHub PAT | `ghp_[0-9a-zA-Z]{36}` | ALTO |
| Slack Bot | `xoxb-[0-9a-zA-Z-]{20,}` | ALTO |
| JWT | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | MÉDIO |
| Supabase URL | `[a-z0-9]{20}\.supabase\.co` | MÉDIO |
| S3 Bucket | `\.s3[.-][a-z0-9.-]*amazonaws\.com` | MÉDIO |
| VITE_* / NEXT_PUBLIC_* / REACT_APP_* | env prefix | BAIXO |
| Discord/Slack webhook | full URL | ALTO |
| `service_role` | literal | ALTO |

### 34. `.env` no servidor ✅
Motor testa `/.env`, `/.env.production`, `/.env.local`, `/.env.bak` na fase 5.

### 35. Sourcemaps `.map` 🟡
Manual: se ver `//# sourceMappingURL=...` no HTML, tentar baixar `<bundle>.js.map`. O motor v2 detecta a referência via HTML markers (fase 7).

Comando de exploração:
```
npx unwebpack-sourcemap https://alvo.com/assets/index.js.map ./out/
```

### 36-40. Firebase, cloud tokens, webhooks, JWT, base64
Cobertos pelo regex acima. Adicional manual:
- Base64 escondendo: `grep -oE 'atob\("[A-Za-z0-9+/=]{20,}"\)' bundle.js` → decodar cada match.

---

## BLOCO 8 — Análise de Network 🟡

### 41. Endpoints internos ✅ (via Swagger)
Se Swagger for público, o motor lista rotas. Se não, precisa de sessão autenticada + Chrome DevTools → Network → filtrar XHR/Fetch.

### 42. Bearer reaproveitável 🔒
Precisa sessão autenticada. Manual: copiar `Authorization: Bearer ...` de uma request e testar em curl externo.

### 43. Over-fetching 🔒
Sessão autenticada. Ver se API retorna `password_hash`, `email_interno`, `is_admin`, `2fa_secret` quando UI só usa nome.

### 44. Endpoints de debug ✅
Motor testa `/api/debug`, `/api/_health`, `/actuator`, `/actuator/env`, `/actuator/mappings`. Se `/actuator/env` retorna 200 sem auth = **ALTO** (vaza env vars).

### 45. GraphQL via Network 🔒
Autenticado — ver se cliente dispara `__schema` no runtime.

---

## BLOCO 9 — Build Artifacts, Storage e Lógica Cliente

### 46. Comentários HTML ✅
Motor busca `<!-- TODO`, `<!-- FIXME`, `<!-- senha`, `<!-- password`, `<!-- backup`, `<!-- debug`.

### 47. asset-manifest.json / manifest.json ✅
Testado nos common paths. Se 200 real (não SPA fallback) = útil para listar chunks ocultos.

### 48. Lazy-loaded chunks 🟡
Manual: DevTools → Sources → listar `_next/static/chunks/*.chunk.js`. Baixar `admin.chunk.js`, `internal-tools.js`. O motor v2 escaneia os 3 primeiros bundles referenciados no HTML — chunks lazy exigem parse do webpack manifest.

### 49-50. package.json / composer.json / requirements.txt / Gemfile / pom.xml ✅
Motor testa todos e filtra SPA fallback. Se real = expor versões → cruzar com Snyk/OSV.

### 51-53. LocalStorage / SessionStorage / IndexedDB 🔒
Precisam de sessão autenticada. Manual: DevTools → Application → Storage.

### 54. Cookies sem flags ✅
Coberto na fase 1 (headers).

### 55. Redux/NgRx state 🔒 (mas detectável passivamente)
Manual: abrir DevTools → Console → digitar `window.__REDUX_DEVTOOLS_EXTENSION__` ou verificar se aparecem grupos de action no console (`[Auth] Renew Access Token`, etc.).

Se sim = NgRx StoreDevtools está ativo em produção = **ALTO** (vaza estado da sessão).

### 56. Feature flags client-side 🔒
Autenticado. Manual: `window.featureFlags.adminMode = true` no console e ver se libera.

### 57-58. Validação só no frontend + Roteamento fraco 🔒
Autenticado. Submeter form via curl pulando JS; acessar `fetch('/api/admin/users')` como user comum.

### 59. CSP ausente ✅
Coberto na fase 1.

### 60. Buckets S3/GCS/Azure ✅
Motor busca URLs no bundle JS. Manual complementar:
```
curl "https://<bucket>.s3.amazonaws.com/?list-type=2"
# Se lista arquivos = bucket público
```

---

## Fluxo recomendado do Comandante

Quando o operador diz **"faz um recon em X"**:

1. **Autoriza o alvo** (aprovação de escopo — 30 min).
2. **Executa `fullReconV2(target)`** — todas as 8 fases automáticas.
3. **LLM interpreta** os achados em PT, agrupados por severidade.
4. **Registra no Cofre** cada finding com `addFinding()` para o Cofre + Etapa 4.
5. **Sugere próximos passos ativos** APENAS se o operador aprovar:
   - Encontrou Swagger público → propor scan de cada rota com token vazio para IDOR discovery.
   - Encontrou secrets no bundle → validar se a key está viva (ex: Google API key com curl + referer).
   - Encontrou host fora do CF → propor stress test de resiliência (com autorização).

## Regras invioláveis

1. **Escopo primeiro.** Nada roda contra um host sem `/api/approvals/authorize-target` OK.
2. **Passivo por default.** Nunca inicia payload ativo sem operador aprovar.
3. **Sem alucinação.** Se uma ferramenta não rodou (ENOENT), reporte "não instalado", não invente resultado.
4. **Toda evidência é literal.** No dossiê, incluir o comando exato + saída exata (redacted apenas em PII).
5. **PII stop.** Se encontrar dados pessoais reais (CPF/e-mail), pare e reporte ao operador — não vaze no chat.

## Próximas evoluções (backlog)

- **Fase 9 — Wayback Machine** (`web.archive.org/cdx`) — snapshots históricos revelam paths removidos.
- **Fase 10 — HaveIBeenPwned domain check** (precisa API key, opt-in).
- **Fase 11 — GitHub code search dork** — repos externos vazando código do alvo.
- **Import de scanner externo** — parser Nmap XML / Nuclei JSON → Cofre.
- **Report PDF profissional** — gerar dossiê estilo MedSimples direto do Cofre.

Cada evolução deve **atender à mesma regra**: passiva, autorizada, evidência literal, sem invenção.
