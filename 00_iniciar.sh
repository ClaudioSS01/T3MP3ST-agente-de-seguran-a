#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# T3MP3ST — Iniciador com auto-check de dependências (Linux / macOS)
#
# O que este script faz (em ordem):
#   1. Verifica Node.js >= 20 (instala via nvm/apt/brew se faltar)
#   2. Verifica npm
#   3. Verifica Ollama (instala via install.sh oficial ou brew)
#   4. Garante que o daemon Ollama está no ar (:11434)
#   5. Verifica se há pelo menos um modelo LLM (senão baixa qwen2.5:3b)
#   6. Verifica ~/.t3mp3st/.env (cria com defaults se faltar)
#   7. Executa 'npm ci' se node_modules faltar
#   8. Executa 'npm run build' se dist/server.js faltar
#   9. Sobe o servidor T3MP3ST em :3333 (nohup, background)
#  10. Abre o browser (xdg-open / open / echo URL)
#
# Uso:
#   chmod +x 00_iniciar.sh
#   ./00_iniciar.sh              # instala tudo + sobe
#   ./00_iniciar.sh --no-browser # não abre browser
#   ./00_iniciar.sh --skip-build # pula npm run build
#   MODEL=qwen2.5:3b ./00_iniciar.sh   # muda modelo LLM
# ═══════════════════════════════════════════════════════════════════════════

set -u

# ─── Parse flags ──────────────────────────────────────────────────────────
SKIP_BROWSER=0
SKIP_BUILD=0
MODEL="${MODEL:-qwen2.5:3b}"

for arg in "$@"; do
  case $arg in
    --no-browser) SKIP_BROWSER=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --model=*) MODEL="${arg#--model=}" ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

# ─── Cores + helpers de log ───────────────────────────────────────────────
if [ -t 1 ]; then
  C_CYAN=$'\033[36m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'; C_MAGENTA=$'\033[35m'; C_DIM=$'\033[2m'; C_RESET=$'\033[0m'
else
  C_CYAN=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_MAGENTA=''; C_DIM=''; C_RESET=''
fi

info()   { echo "  ${C_CYAN}ℹ️  $*${C_RESET}"; }
ok()     { echo "  ${C_GREEN}✅ $*${C_RESET}"; }
warn()   { echo "  ${C_YELLOW}⚠️  $*${C_RESET}"; }
err()    { echo "  ${C_RED}❌ $*${C_RESET}" >&2; }
step()   { echo ""; echo "${C_MAGENTA}━━ $* $(printf '━%.0s' $(seq 1 $((76 - ${#1} - 3))))${C_RESET}"; }

banner() {
  echo ""
  echo "  ${C_CYAN}⚡ T3MP3ST — Iniciador automático${C_RESET}"
  echo "  ${C_DIM}Este script instala tudo que falta e sobe o servidor.${C_RESET}"
  echo ""
}

has_cmd() { command -v "$1" >/dev/null 2>&1; }

# ─── Detecta OS + package manager ─────────────────────────────────────────
detect_os() {
  case "$(uname -s)" in
    Linux*)  OS=linux ;;
    Darwin*) OS=macos ;;
    *)       OS=unknown ;;
  esac
}
detect_os

detect_pkg_manager() {
  if has_cmd apt-get; then PKG=apt
  elif has_cmd dnf; then PKG=dnf
  elif has_cmd yum; then PKG=yum
  elif has_cmd pacman; then PKG=pacman
  elif has_cmd zypper; then PKG=zypper
  elif has_cmd brew; then PKG=brew
  else PKG=none
  fi
}
detect_pkg_manager

cd "$(dirname "$0")"
banner
info "OS detectado: $OS · package manager: $PKG"

# ───────────────────────────────────────────────────────────────────────────
# PASSO 1: Node.js
# ───────────────────────────────────────────────────────────────────────────
step "1/9 — Node.js"

install_node() {
  case "$PKG" in
    apt)
      info "Instalando Node 20 LTS via NodeSource…"
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
      ;;
    dnf|yum)
      info "Instalando Node 20 LTS via NodeSource…"
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
      sudo "$PKG" install -y nodejs
      ;;
    pacman)
      info "Instalando Node via pacman…"
      sudo pacman -Sy --noconfirm nodejs npm
      ;;
    brew)
      info "Instalando Node via brew…"
      brew install node@20
      brew link --overwrite node@20
      ;;
    *)
      err "Nenhum package manager conhecido. Instale Node 20 LTS de https://nodejs.org/ manualmente."
      return 1
      ;;
  esac
}

if has_cmd node; then
  NODE_VER=$(node --version)
  NODE_MAJOR="${NODE_VER#v}"
  NODE_MAJOR="${NODE_MAJOR%%.*}"
  if [ "$NODE_MAJOR" -ge 20 ] 2>/dev/null; then
    ok "Node $NODE_VER instalado (>= v20 exigido)."
  else
    warn "Node $NODE_VER é antigo. T3MP3ST exige Node 20+."
    install_node || exit 1
  fi
else
  warn "Node.js não encontrado."
  install_node || exit 1
  if ! has_cmd node; then
    err "Instalação terminou, mas 'node' não está no PATH. Reabra o terminal e tente novamente."
    exit 1
  fi
  ok "Node instalado: $(node --version)"
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 2: npm
# ───────────────────────────────────────────────────────────────────────────
step "2/9 — npm"
if has_cmd npm; then
  ok "npm v$(npm --version) instalado."
else
  err "npm não encontrado (deveria vir com Node)."
  exit 1
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 3: Ollama
# ───────────────────────────────────────────────────────────────────────────
step "3/9 — Ollama"

install_ollama() {
  if [ "$OS" = "macos" ] && has_cmd brew; then
    info "Instalando Ollama via brew…"
    brew install ollama
  else
    info "Instalando Ollama via script oficial…"
    curl -fsSL https://ollama.com/install.sh | sh
  fi
}

if has_cmd ollama; then
  OLLAMA_VER=$(ollama --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  [ -z "$OLLAMA_VER" ] && OLLAMA_VER="desconhecida"
  ok "Ollama v$OLLAMA_VER instalado."
else
  warn "Ollama não encontrado."
  install_ollama
  if has_cmd ollama; then
    ok "Ollama instalado."
  else
    err "Falha ao instalar. Instale manualmente de https://ollama.com/download"
    exit 1
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 4: Daemon Ollama no ar
# ───────────────────────────────────────────────────────────────────────────
step "4/9 — Daemon Ollama"

test_ollama_up() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:11434/api/tags 2>/dev/null | grep -q '^200$'
}

if test_ollama_up; then
  ok "Daemon Ollama já está no ar (:11434)."
else
  info "Iniciando 'ollama serve' em background…"
  # macOS: se está instalado via brew, use brew services; senão nohup
  if [ "$OS" = "macos" ] && has_cmd brew && brew list --formula ollama >/dev/null 2>&1; then
    brew services start ollama >/dev/null 2>&1 || nohup ollama serve >/tmp/ollama.log 2>&1 &
  # Linux: tenta systemctl (se instalado via script oficial) senão nohup
  elif [ "$OS" = "linux" ] && has_cmd systemctl && systemctl list-unit-files | grep -q '^ollama\.service'; then
    sudo systemctl start ollama || nohup ollama serve >/tmp/ollama.log 2>&1 &
  else
    nohup ollama serve >/tmp/ollama.log 2>&1 &
  fi

  # Espera até 15s
  WAITED=0
  while [ $WAITED -lt 15 ] && ! test_ollama_up; do
    sleep 1
    WAITED=$((WAITED + 1))
  done
  if test_ollama_up; then
    ok "Daemon Ollama respondendo em :11434 (após ${WAITED}s)."
  else
    err "Ollama não subiu em 15s. Veja /tmp/ollama.log"
    exit 1
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 5: Modelo LLM
# ───────────────────────────────────────────────────────────────────────────
step "5/9 — Modelo LLM ($MODEL)"

INSTALLED_MODELS=$(curl -s --max-time 5 http://127.0.0.1:11434/api/tags 2>/dev/null | python3 -c 'import sys,json;
try:
  d=json.load(sys.stdin)
  print(" ".join(m["name"] for m in d.get("models",[])))
except: pass' 2>/dev/null)

if [ -n "$INSTALLED_MODELS" ]; then
  info "Modelos já instalados: $INSTALLED_MODELS"
fi

if echo " $INSTALLED_MODELS " | grep -q " $MODEL "; then
  ok "Modelo '$MODEL' já disponível."
else
  warn "Modelo '$MODEL' não instalado. Baixando (pode demorar)…"
  info "Executando: ollama pull $MODEL"
  if ollama pull "$MODEL"; then
    ok "Modelo '$MODEL' baixado."
  else
    warn "Falha ao baixar '$MODEL'. Tentando fallback 'qwen2.5:3b'…"
    if ollama pull qwen2.5:3b; then
      ok "Fallback 'qwen2.5:3b' baixado."
      MODEL="qwen2.5:3b"
    else
      err "Não consegui baixar nenhum modelo. O motor de Recon V2 funciona sem LLM (só a interpretação final falta)."
    fi
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 6: ~/.t3mp3st/.env
# ───────────────────────────────────────────────────────────────────────────
step "6/9 — Configuração (~/.t3mp3st/.env)"

ENV_DIR="$HOME/.t3mp3st"
ENV_FILE="$ENV_DIR/.env"
mkdir -p "$ENV_DIR"

if [ -f "$ENV_FILE" ]; then
  ok ".env existe em $ENV_FILE"
else
  info "Criando .env com defaults locais…"
  cat > "$ENV_FILE" <<EOF
LLM_PROVIDER=local
TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api
TEMPEST_LOCAL_MODEL=$MODEL
T3MP3ST_PORT=3333
T3MP3ST_FULL_ARSENAL=true
EOF
  ok ".env criado (modelo padrão: $MODEL)"
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 7: node_modules
# ───────────────────────────────────────────────────────────────────────────
step "7/9 — Dependências (node_modules)"

NEEDS_INSTALL=0
if [ ! -d node_modules ]; then
  info "node_modules ausente."
  NEEDS_INSTALL=1
elif [ package-lock.json -nt node_modules ]; then
  info "package-lock.json mais novo que node_modules — reinstalando."
  NEEDS_INSTALL=1
else
  ok "node_modules existe e parece atualizado."
fi

if [ $NEEDS_INSTALL -eq 1 ]; then
  if [ -f package-lock.json ]; then
    info "Executando 'npm ci'…"
    npm ci --no-audit --no-fund --loglevel=error || { err "npm ci falhou."; exit 1; }
  else
    info "Executando 'npm install'…"
    npm install --no-audit --no-fund --loglevel=error || { err "npm install falhou."; exit 1; }
  fi
  ok "Dependências instaladas."
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 8: Build TypeScript
# ───────────────────────────────────────────────────────────────────────────
step "8/9 — Build TypeScript (dist/)"

if [ $SKIP_BUILD -eq 1 ]; then
  warn "--skip-build — pulando compilação."
elif [ ! -f dist/server.js ]; then
  info "dist/server.js ausente — rodando 'npm run build'…"
  npm run build || { err "Build falhou."; exit 1; }
  ok "Build concluído."
elif [ src/server.ts -nt dist/server.js ]; then
  info "src/server.ts mais novo que dist/ — recompilando…"
  npm run build || { err "Build falhou."; exit 1; }
  ok "Build refeito."
else
  ok "dist/ existe e parece atualizado."
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 9: Servidor T3MP3ST
# ───────────────────────────────────────────────────────────────────────────
step "9/9 — Servidor T3MP3ST (:3333)"

test_t3mp_up() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:3333/api/health 2>/dev/null | grep -q '^200$'
}

if test_t3mp_up; then
  warn "Servidor já está no ar em :3333 — não vou subir uma segunda instância."
else
  info "Iniciando servidor Node em background…"
  LOG_OUT="/tmp/t3mp3st-stdout.log"
  LOG_ERR="/tmp/t3mp3st-stderr.log"
  nohup node dist/server.js >"$LOG_OUT" 2>"$LOG_ERR" &
  SERVER_PID=$!
  info "PID: $SERVER_PID · logs: $LOG_OUT / $LOG_ERR"
  disown $SERVER_PID 2>/dev/null || true

  WAITED=0
  while [ $WAITED -lt 20 ] && ! test_t3mp_up; do
    sleep 1
    WAITED=$((WAITED + 1))
  done
  if test_t3mp_up; then
    ok "Servidor respondendo em :3333 (após ${WAITED}s)."
  else
    err "Servidor não subiu em 20s. Últimas linhas do stderr:"
    tail -20 "$LOG_ERR" 2>/dev/null | sed 's/^/    /'
    exit 1
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# Sumário final + abre browser
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "  ${C_GREEN}╔═══════════════════════════════════════════════════════════════════════╗${C_RESET}"
echo "  ${C_GREEN}║  🎯 T3MP3ST pronto para uso                                            ║${C_RESET}"
echo "  ${C_GREEN}║                                                                       ║${C_RESET}"
echo "  ${C_GREEN}║  Abra: http://127.0.0.1:3333/ui/                                      ║${C_RESET}"
printf "  ${C_GREEN}║  Modelo LLM: %-56s║${C_RESET}\n" "$MODEL"
echo "  ${C_GREEN}║                                                                       ║${C_RESET}"
echo "  ${C_GREEN}║  Para parar: pkill -f 'node dist/server.js'                          ║${C_RESET}"
echo "  ${C_GREEN}╚═══════════════════════════════════════════════════════════════════════╝${C_RESET}"
echo ""

if [ $SKIP_BROWSER -eq 0 ]; then
  sleep 2
  info "Abrindo browser…"
  if has_cmd xdg-open; then
    xdg-open 'http://127.0.0.1:3333/ui/' >/dev/null 2>&1 &
  elif has_cmd open; then
    open 'http://127.0.0.1:3333/ui/' >/dev/null 2>&1 &
  else
    info "Não achei xdg-open/open — abra manualmente."
  fi
fi

exit 0
