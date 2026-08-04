#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# T3MP3ST — Killall (Linux / macOS)
#
# Mata todos os processos relacionados ao T3MP3ST:
#   1. Servidor Node ligado à porta 3333 (T3MP3ST server)
#   2. Processos Node rodando 'dist/server.js' (double-check via pgrep -f)
#   3. Daemon Ollama (:11434) — desligável com --keep-ollama
#   4. Limpa logs temporários em /tmp
#
# IMPORTANTE: NÃO mata todos os processos node genericamente — só os
# que estão ligados ao :3333 OU que têm 'dist/server.js' na linha de
# comando. Isso protege outros apps Node que você tenha rodando.
#
# Uso:
#   chmod +x 00_killall.sh
#   ./00_killall.sh                 # mata tudo (T3MP3ST + Ollama)
#   ./00_killall.sh --keep-ollama   # preserva Ollama
# ═══════════════════════════════════════════════════════════════════════════

set -u

# ─── Parse flags ──────────────────────────────────────────────────────────
KEEP_OLLAMA=0
for arg in "$@"; do
  case $arg in
    --keep-ollama) KEEP_OLLAMA=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

# ─── Cores + helpers ──────────────────────────────────────────────────────
if [ -t 1 ]; then
  C_CYAN=$'\033[36m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'; C_MAGENTA=$'\033[35m'; C_DIM=$'\033[2m'; C_RESET=$'\033[0m'
else
  C_CYAN=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_MAGENTA=''; C_DIM=''; C_RESET=''
fi

info() { echo "  ${C_CYAN}ℹ️  $*${C_RESET}"; }
ok()   { echo "  ${C_GREEN}✅ $*${C_RESET}"; }
warn() { echo "  ${C_YELLOW}⚠️  $*${C_RESET}"; }
err()  { echo "  ${C_RED}❌ $*${C_RESET}" >&2; }
kill_msg() { echo "  ${C_RED}🔪 $*${C_RESET}"; }
step() { echo ""; echo "${C_MAGENTA}━━ $* $(printf '━%.0s' $(seq 1 $((76 - ${#1} - 3))))${C_RESET}"; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

echo ""
echo "  ${C_RED}🔪 T3MP3ST — Killall${C_RESET}"
extra=""
if [ $KEEP_OLLAMA -eq 0 ]; then extra=" + daemon Ollama"; fi
echo "  ${C_DIM}Vai matar: servidor :3333 + processos node do server$extra${C_RESET}"
echo ""

KILLED=0

# ───────────────────────────────────────────────────────────────────────────
# Helper universal: mata processos por PID(s)
# ───────────────────────────────────────────────────────────────────────────
kill_pids() {
  local pids="$1"
  local reason="$2"
  for pid in $pids; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      # Tenta SIGTERM primeiro, SIGKILL depois de 2s
      kill_msg "Matando PID $pid ($reason)"
      kill -TERM "$pid" 2>/dev/null
      # Espera até 2s para o processo sair
      local waited=0
      while [ $waited -lt 2 ] && kill -0 "$pid" 2>/dev/null; do
        sleep 1
        waited=$((waited + 1))
      done
      # Se ainda vivo, força
      if kill -0 "$pid" 2>/dev/null; then
        kill -KILL "$pid" 2>/dev/null
      fi
      KILLED=$((KILLED + 1))
    fi
  done
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 1: T3MP3ST server (porta 3333)
# ───────────────────────────────────────────────────────────────────────────
step "1/4 — Servidor T3MP3ST (porta 3333)"

PIDS_3333=""
if has_cmd lsof; then
  PIDS_3333=$(lsof -ti :3333 2>/dev/null)
elif has_cmd fuser; then
  PIDS_3333=$(fuser 3333/tcp 2>/dev/null | tr -d ':/tcp' | xargs)
elif has_cmd ss; then
  PIDS_3333=$(ss -tlnpH "( sport = :3333 )" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)
fi

if [ -n "$PIDS_3333" ]; then
  kill_pids "$PIDS_3333" "porta 3333"
else
  info "Nada escutando na porta 3333."
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 2: Processos node rodando 'dist/server.js'
# ───────────────────────────────────────────────────────────────────────────
step "2/4 — Processos node com 'dist/server.js' (double-check)"

PIDS_NODE=""
if has_cmd pgrep; then
  # -f: match contra full command line
  PIDS_NODE=$(pgrep -f "node.*dist/server\.js" 2>/dev/null | sort -u)
else
  # Fallback: ps + grep
  PIDS_NODE=$(ps -eo pid,args 2>/dev/null | grep -E 'node.*dist/server\.js' | grep -v grep | awk '{print $1}')
fi

if [ -n "$PIDS_NODE" ]; then
  kill_pids "$PIDS_NODE" "node dist/server.js"
else
  info "Nenhum node rodando dist/server.js encontrado."
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 3: Daemon Ollama (opt-out com --keep-ollama)
# ───────────────────────────────────────────────────────────────────────────
step "3/4 — Daemon Ollama (porta 11434)"

if [ $KEEP_OLLAMA -eq 1 ]; then
  info "--keep-ollama recebido — deixando Ollama rodando."
else
  # macOS: se rodando via brew services, para o service
  if has_cmd brew && brew services list 2>/dev/null | grep -qE '^ollama\s+started'; then
    info "Ollama rodando via brew services — parando…"
    brew services stop ollama >/dev/null 2>&1
    ok "brew services stop ollama executado."
  fi

  # Linux: se via systemctl, para o service
  if has_cmd systemctl && systemctl is-active --quiet ollama 2>/dev/null; then
    info "Ollama rodando via systemctl — parando…"
    sudo systemctl stop ollama 2>/dev/null || systemctl --user stop ollama 2>/dev/null || true
    ok "systemctl stop ollama executado."
  fi

  # Mata processo bound na 11434 (pega processos rebeldes)
  PIDS_11434=""
  if has_cmd lsof; then
    PIDS_11434=$(lsof -ti :11434 2>/dev/null)
  elif has_cmd fuser; then
    PIDS_11434=$(fuser 11434/tcp 2>/dev/null | tr -d ':/tcp' | xargs)
  fi
  if [ -n "$PIDS_11434" ]; then
    kill_pids "$PIDS_11434" "porta 11434"
  fi

  # Extra: pkill 'ollama' (nome do processo)
  if has_cmd pgrep; then
    PIDS_OLLAMA=$(pgrep -x ollama 2>/dev/null | sort -u)
    if [ -n "$PIDS_OLLAMA" ]; then
      kill_pids "$PIDS_OLLAMA" "processo ollama"
    fi
  fi

  # Se após tudo isso :11434 ainda responde, avisa
  sleep 1
  if curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:11434/api/tags 2>/dev/null | grep -q '^200$'; then
    warn "Ollama ainda responde em :11434 — provavelmente é o Ollama app (macOS)."
    warn "  Feche o app manualmente pelo menubar / dock, ou execute:"
    warn "  osascript -e 'quit app \"Ollama\"'   (macOS)"
  else
    ok "Ollama parado."
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# PASSO 4: Limpar logs temporários
# ───────────────────────────────────────────────────────────────────────────
step "4/4 — Limpando logs temporários"

for log in /tmp/t3mp3st-stdout.log /tmp/t3mp3st-stderr.log /tmp/ollama.log; do
  if [ -f "$log" ]; then
    if rm -f "$log" 2>/dev/null; then
      info "Removido: $log"
    else
      warn "Não consegui remover $log"
    fi
  fi
done

# ───────────────────────────────────────────────────────────────────────────
# Sumário
# ───────────────────────────────────────────────────────────────────────────
echo ""
if [ $KILLED -gt 0 ]; then
  echo "  ${C_RED}╔═══════════════════════════════════════════════════════════════════════╗${C_RESET}"
  printf "  ${C_RED}║  🔪 %d processo(s) morto(s). Sistema parado.%*s║${C_RESET}\n" "$KILLED" $((32 - ${#KILLED})) ""
  echo "  ${C_RED}╚═══════════════════════════════════════════════════════════════════════╝${C_RESET}"
else
  echo "  ${C_YELLOW}╔═══════════════════════════════════════════════════════════════════════╗${C_RESET}"
  echo "  ${C_YELLOW}║  ⚠️  Nada estava rodando. Sistema já estava parado.                    ║${C_RESET}"
  echo "  ${C_YELLOW}╚═══════════════════════════════════════════════════════════════════════╝${C_RESET}"
fi
echo ""
echo "  ${C_DIM}Para reiniciar tudo: ./00_iniciar.sh${C_RESET}"
echo ""

exit 0
