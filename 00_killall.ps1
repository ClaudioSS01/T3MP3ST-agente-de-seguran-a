# ═══════════════════════════════════════════════════════════════════════════
# T3MP3ST — Killall (Windows)
#
# Mata todos os processos relacionados ao T3MP3ST:
#   1. Servidor Node ligado à porta 3333 (T3MP3ST server)
#   2. Processos Node rodando 'dist/server.js' (double-check por CommandLine)
#   3. Daemon Ollama (:11434) — desligável com -KeepOllama
#   4. Limpa logs temporários em %TEMP%
#
# IMPORTANTE: NÃO mata node.exe genericamente — só os que estão ligados
# ao :3333 OU que têm 'dist/server.js' na linha de comando. Isso protege
# outros apps Node que você tenha rodando (VSCode, dev servers, etc).
#
# Uso:
#   Duplo-clique em 00_killall.bat
#   OU: pwsh -File 00_killall.ps1
#   OU: pwsh -File 00_killall.ps1 -KeepOllama  (preserva Ollama rodando)
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$KeepOllama
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'

function Write-Info    ($msg) { Write-Host "  ℹ️  $msg" -ForegroundColor Cyan }
function Write-Ok      ($msg) { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn    ($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Err     ($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Kill    ($msg) { Write-Host "  🔪 $msg" -ForegroundColor Red }
function Write-Step    ($msg) { Write-Host ""; Write-Host "━━ $msg " -ForegroundColor Magenta -NoNewline; Write-Host ("━" * ([Math]::Max(2, 76 - $msg.Length))) -ForegroundColor Magenta }

Write-Host ""
Write-Host "  🔪 T3MP3ST — Killall" -ForegroundColor Red
Write-Host "  Vai matar: servidor :3333 + processos node do server$(if (-not $KeepOllama) { ' + daemon Ollama' })" -ForegroundColor DarkGray
Write-Host ""

$killed = 0

# ───────────────────────────────────────────────────────────────────────────
# PASSO 1: T3MP3ST server (porta 3333)
# ───────────────────────────────────────────────────────────────────────────
Write-Step "1/4 — Servidor T3MP3ST (porta 3333)"

try {
    $conns = Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            $procId = $conn.OwningProcess
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Kill "Matando PID $procId ($($proc.ProcessName)) na porta 3333"
                    Stop-Process -Id $procId -Force -ErrorAction Stop
                    $killed++
                }
            } catch {
                Write-Warn "Falha ao matar PID $procId : $_"
            }
        }
    } else {
        Write-Info "Nada escutando na porta 3333."
    }
} catch {
    Write-Warn "Get-NetTCPConnection falhou: $_"
    # Fallback: netstat
    $netstatOut = & netstat -ano | Select-String ':3333\s+.*LISTENING'
    foreach ($line in $netstatOut) {
        if ($line -match '\s+(\d+)\s*$') {
            $procId = $Matches[1]
            try {
                Write-Kill "Matando PID $procId (via netstat) na porta 3333"
                Stop-Process -Id $procId -Force -ErrorAction Stop
                $killed++
            } catch { Write-Warn "Falha PID $procId : $_" }
        }
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 2: Processos Node rodando 'dist/server.js' (por CommandLine)
# ───────────────────────────────────────────────────────────────────────────
Write-Step "2/4 — Processos node.exe com 'dist/server.js' (double-check)"

try {
    $nodeProcs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop
    $matched = $nodeProcs | Where-Object {
        $_.CommandLine -and ($_.CommandLine -match 'dist[\\/]server\.js' -or $_.CommandLine -match 'T3MP3ST')
    }
    if ($matched) {
        foreach ($p in $matched) {
            try {
                Write-Kill "Matando PID $($p.ProcessId): $($p.CommandLine -replace '^.{0,80}', '' | Out-String -Stream | Select-Object -First 1)"
                Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
                $killed++
            } catch { Write-Warn "Falha PID $($p.ProcessId): $_" }
        }
    } else {
        Write-Info "Nenhum node.exe rodando dist/server.js encontrado."
    }
} catch {
    Write-Warn "CIM query falhou: $_"
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 3: Daemon Ollama (opt-out com -KeepOllama)
# ───────────────────────────────────────────────────────────────────────────
Write-Step "3/4 — Daemon Ollama (porta 11434)"

if ($KeepOllama) {
    Write-Info "-KeepOllama recebido — deixando Ollama rodando."
} else {
    # Mata processo bound na 11434
    try {
        $conns = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $procId = $conn.OwningProcess
                try {
                    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                    if ($proc) {
                        Write-Kill "Matando PID $procId ($($proc.ProcessName)) na porta 11434"
                        Stop-Process -Id $procId -Force -ErrorAction Stop
                        $killed++
                    }
                } catch { Write-Warn "Falha PID $procId : $_" }
            }
        } else {
            Write-Info "Nada escutando em :11434."
        }
    } catch {}

    # Extra: taskkill em todos ollama.exe (o daemon pode ter subprocessos filhos)
    $ollamaProcs = Get-Process -Name 'ollama' -ErrorAction SilentlyContinue
    if ($ollamaProcs) {
        foreach ($p in $ollamaProcs) {
            try {
                Write-Kill "Matando ollama.exe PID $($p.Id)"
                Stop-Process -Id $p.Id -Force -ErrorAction Stop
                $killed++
            } catch { Write-Warn "Falha PID $($p.Id): $_" }
        }
    } else {
        Write-Info "Nenhum processo 'ollama' rodando."
    }

    # Também 'ollama app.exe' e 'ollama runner' (subprocessos do Ollama app)
    $ollamaApp = Get-Process -Name 'ollama app' -ErrorAction SilentlyContinue
    if ($ollamaApp) {
        foreach ($p in $ollamaApp) {
            try {
                Write-Kill "Matando 'ollama app' PID $($p.Id)"
                Stop-Process -Id $p.Id -Force -ErrorAction Stop
                $killed++
            } catch {}
        }
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 4: Limpar logs temporários
# ───────────────────────────────────────────────────────────────────────────
Write-Step "4/4 — Limpando logs temporários"

$logs = @(
    (Join-Path $env:TEMP 't3mp3st-stdout.log'),
    (Join-Path $env:TEMP 't3mp3st-stderr.log')
)
foreach ($log in $logs) {
    if (Test-Path $log) {
        try {
            Remove-Item $log -Force -ErrorAction Stop
            Write-Info "Removido: $log"
        } catch {
            Write-Warn "Não consegui remover $log (pode estar em uso)."
        }
    }
}

# ───────────────────────────────────────────────────────────────────────────
# Sumário
# ───────────────────────────────────────────────────────────────────────────
Write-Host ""
if ($killed -gt 0) {
    $msg = "🔪 $killed processo(s) morto(s). Sistema parado."
    $pad = 68 - $msg.Length
    if ($pad -lt 0) { $pad = 0 }
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  $msg$(' ' * $pad)║" -ForegroundColor Red
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
} else {
    Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "  ║  ⚠️  Nada estava rodando. Sistema já estava parado.                    ║" -ForegroundColor Yellow
    Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Para reiniciar tudo: duplo-clique em 00_Iniciar.bat" -ForegroundColor DarkGray
Write-Host ""

exit 0
