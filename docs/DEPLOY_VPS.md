# T3MP3ST — Deploy no VPS (DigitalOcean/Linux)

Guia para colocar o T3MP3ST rodando **fora da sua máquina** — acessível de qualquer lugar (celular, notebook do trabalho, etc.) sem depender de você deixar o PC ligado.

O usuário tem um **VPS DigitalOcean em `164.92.90.27`** (com Ollama já rodando em `:8000` para outros projetos). Este guia coloca o T3MP3ST em `:3333` atrás de Nginx + auth básica + HTTPS Let's Encrypt.

> ⚠️ **Antes de subir:** T3MP3ST expõe endpoints de execução de ferramentas. Público na internet SEM auth é catastrófico. Este guia usa Cloudflare Access OU auth básica Nginx — nunca deixe aberto.

---

## Arquitetura

```
Internet
   ↓
[Cloudflare Access ou Nginx basic-auth]
   ↓ HTTPS (Let's Encrypt)
[nginx :443]  →  proxy_pass  →  [t3mp3st docker :3333]
                                        ↓
                                [ollama :11434]   ← LLM local no próprio VPS
```

## Pré-requisitos no VPS

- Ubuntu 22.04+ (ou similar)
- Docker + Docker Compose plugin instalados
- Portas 80/443 liberadas no firewall (`ufw allow 80,443/tcp`)
- Domínio apontando para o IP (ex: `t3mp3st.seudominio.com` → `164.92.90.27`) — se não tiver domínio, use um subdomínio grátis do sslip.io: `164-92-90-27.sslip.io`

## Passo 1 — Clonar o repo no VPS

```bash
ssh root@164.92.90.27
mkdir -p /opt && cd /opt
git clone https://github.com/ClaudioSS01/T3MP3ST-agente-de-seguran-a.git t3mp3st
cd t3mp3st
```

## Passo 2 — Configurar `.env`

```bash
cp .env.example .env
nano .env
```

Ajuste para provider local (Ollama) rodando no próprio VPS:

```bash
LLM_PROVIDER=local
TEMPEST_LOCAL_BASE_URL=http://host.docker.internal:11434/api
TEMPEST_LOCAL_MODEL=qwen2.5-coder:7b

# Arsenal completo (ferramentas opt-in ainda exigem CLI + aprovação por chamada)
T3MP3ST_FULL_ARSENAL=true

# Bind interno (nginx faz proxy)
T3MP3ST_PORT=3333

# Escopo: adicione domínios autorizados (comma-separated) — SÓ os seus alvos
T3MP3ST_AUTHORIZED_TARGETS=medsimples.com.br,humanitar.com.br,antecipa.me
```

## Passo 3 — Instalar Ollama no VPS + puxar o modelo

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable --now ollama

# Puxa o modelo (o mesmo que roda local)
ollama pull qwen2.5-coder:7b
```

Se o Ollama do usuário já está em `:8000` para outros projetos, o T3MP3ST usa a instância padrão `:11434` (isolado) — não conflita.

## Passo 4 — Ajustar `docker-compose.yml` para expor via nginx

Trocar o `ports` de `"127.0.0.1:3333:3333"` para expor apenas para o host (nginx roda no host):

```yaml
# docker-compose.override.yml (NÃO commitar)
services:
  app:
    ports:
      - "127.0.0.1:3333:3333"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## Passo 5 — Subir o container

```bash
docker compose build
docker compose up -d
docker compose logs -f app  # confirma que subiu
```

Teste local: `curl http://127.0.0.1:3333/api/health` — deve retornar 200.

## Passo 6 — Nginx + Let's Encrypt

```bash
apt-get update && apt-get install -y nginx certbot python3-certbot-nginx

# Criar htpasswd para auth básica (fallback caso não use Cloudflare Access)
apt-get install -y apache2-utils
htpasswd -c /etc/nginx/.t3mp3st.htpasswd claudio  # digite senha forte

# Configurar site
cat > /etc/nginx/sites-available/t3mp3st <<'EOF'
server {
    listen 80;
    server_name t3mp3st.seudominio.com;

    # Bloqueia crawlers
    add_header X-Robots-Tag "noindex, nofollow" always;

    # Auth básica (comentar se usar Cloudflare Access)
    auth_basic "T3MP3ST — Restricted";
    auth_basic_user_file /etc/nginx/.t3mp3st.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    # Bloqueia .env, .git etc
    location ~ /\. { deny all; return 404; }
}
EOF

ln -sf /etc/nginx/sites-available/t3mp3st /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Certificado
certbot --nginx -d t3mp3st.seudominio.com --agree-tos --email seu@email.com --redirect
```

Agora acesse `https://t3mp3st.seudominio.com` — vai pedir usuário/senha, e depois cai na UI.

## Passo 7 (RECOMENDADO) — Substituir auth básica por Cloudflare Access

Auth básica funciona, mas Cloudflare Access (Zero Trust) é MUITO melhor: SSO com Google/GitHub, MFA, políticas por país/IP, logs de acesso.

1. Adicione o domínio ao Cloudflare (nameservers).
2. Zero Trust → Applications → **Add Application** → Self-hosted:
   - Domain: `t3mp3st.seudominio.com`
   - Session: 24h
3. Policy:
   - Name: "T3MP3ST Admins"
   - Include: `emails: claudio@seudominio.com`
   - Require: MFA
4. Comente o `auth_basic` no nginx (o Cloudflare Access agora faz o gate).

## Passo 8 — Firewall final

```bash
# Fecha 3333 externo (só nginx acessa)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3333/tcp   # container só ouve em 127.0.0.1 mas paranoia
ufw --force enable
```

## Passo 9 — Auto-restart e updates

```bash
# Systemd unit p/ garantir que sobe no boot
cat > /etc/systemd/system/t3mp3st.service <<'EOF'
[Unit]
Description=T3MP3ST
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/t3mp3st
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOF

systemctl enable --now t3mp3st
```

Update workflow:

```bash
cd /opt/t3mp3st
git pull
docker compose build && docker compose up -d
docker compose logs -f app
```

## Passo 10 — Acesso do celular / notebook

Depois do deploy:
- **Do celular:** abra `https://t3mp3st.seudominio.com` → login CF Access → UI completa.
- **Do notebook do trabalho:** idem.
- **CLI:** `curl -u claudio:senha https://t3mp3st.seudominio.com/api/tools` (só se manteve basic-auth).

---

## Custos e limites

| Item | Custo |
|---|---|
| VPS Basic DigitalOcean (1 GB RAM) | ~$6/mês (já tem) |
| VPS Regular (2 GB RAM, recomendado para Ollama qwen2.5-coder:7b) | ~$12/mês |
| Domínio | $10-15/ano (opcional se usar sslip.io) |
| Let's Encrypt | grátis |
| Cloudflare Access | grátis (até 50 usuários) |

**Nota RAM:** qwen2.5-coder:7b ocupa ~5 GB de RAM quando carregado. Se o VPS tem só 1 GB, o Ollama vai swap muito → lento. Recomendação: usar Droplet 2-4 GB RAM, ou apontar `TEMPEST_LOCAL_BASE_URL` para o Ollama do usuário em `164.92.90.27:8000` (se aceita cross-project) em vez de rodar dois Ollamas.

## Rollback rápido

```bash
# Parar tudo
cd /opt/t3mp3st && docker compose down
systemctl stop nginx

# Remover completamente
docker compose down -v
rm -rf /opt/t3mp3st /etc/nginx/sites-enabled/t3mp3st /etc/nginx/sites-available/t3mp3st
```

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| 502 Bad Gateway | container caiu | `docker compose logs app --tail 100` |
| Chat responde "LLM offline" | Ollama não roda no VPS | `systemctl status ollama` |
| curl retorna 403 no /api/tools/execute | escopo não autorizado | POST `/api/approvals/authorize-target` com `{target: "seualvo.com"}` primeiro |
| Modelo lento | RAM insuficiente pro qwen 7b | reduzir para `qwen2.5-coder:1.5b` ou aumentar VPS |
| 404 na UI | docs/ não copiado no build | `docker compose build --no-cache app` |

## Segurança adicional

- **Rate limiting no nginx** (evita abuse):
  ```nginx
  limit_req_zone $binary_remote_addr zone=t3api:10m rate=30r/m;
  location /api/tools/execute { limit_req zone=t3api burst=5 nodelay; ... }
  ```
- **Fail2ban** para bloquear IPs que erram a senha 3x.
- **Backup diário do `evidence/` e `reports/`** para storage separado.
- **Rotação de logs** do container (`docker-compose.override.yml`):
  ```yaml
  services:
    app:
      logging:
        driver: json-file
        options:
          max-size: "10m"
          max-file: "3"
  ```
