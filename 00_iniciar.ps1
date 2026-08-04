# ═══════════════════════════════════════════════════════════════════════════
# T3MP3ST — Iniciador com auto-check de dependências (Windows)
#
# O que este script faz (em ordem):
#   1. Verifica Node.js >= 20 (instala via winget se faltar)
#   2. Verifica npm
#   3. Verifica Ollama (instala via winget se faltar)
#   4. Garante que o daemon Ollama está no ar (:11434)
#   5. Verifica se há pelo menos um modelo LLM instalado (senão baixa qwen2.5:3b)
#   6. Verifica ~/.t3mp3st/.env (cria com defaults se faltar)
#   7. Executa 'npm ci' se node_modules faltar/incompleto
#   8. Executa 'npm run build' se dist/server.js faltar
#   9. Sobe o servidor T3MP3ST em :3333
#  10. Abre o browser em http://127.0.0.1:3333/ui/
#
# Uso:
#   Duplo-clique em 00_Iniciar.bat  (recomendado — bypassa política de execução)
#   OU: pwsh -File 00_iniciar.ps1   (Windows PowerShell 5.1 ou pwsh 7)
#
# Parâmetros opcionais:
#   -SkipBrowser   → não abre o Chrome no final
#   -SkipBuild     → não roda `npm run build` (se você já sabe que está buildado)
#   -Model qwen... → nome do modelo Ollama a puxar (padrão: qwen2.5:3b)
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipBrowser,
    [switch]$SkipBuild,
    [string]$Model = 'qwen2.5-coder:7b'
)

# UTF-8 no console (paths têm "Segurança")
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'

# ─── Helpers de log colorido ───────────────────────────────────────────────
function Write-Info    ($msg) { Write-Host "  ℹ️  $msg" -ForegroundColor Cyan }
function Write-Ok      ($msg) { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn    ($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Err     ($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Step    ($msg) { Write-Host ""; Write-Host "━━ $msg " -ForegroundColor Magenta -NoNewline; Write-Host ("━" * ([Math]::Max(2, 76 - $msg.Length))) -ForegroundColor Magenta }
function Write-Banner  {
    Write-Host ""
    Write-Host "  ⚡ T3MP3ST — Iniciador automático" -ForegroundColor Cyan
    Write-Host "  Este script instala tudo que falta e sobe o servidor." -ForegroundColor DarkGray
    Write-Host ""
}

function Test-CommandExists ($name) {
    $null = Get-Command $name -ErrorAction SilentlyContinue
    return $?
}

function Invoke-WithTimeout {
    param([scriptblock]$Script, [int]$TimeoutSec = 30, $Default = $null)
    $job = Start-Job -ScriptBlock $Script
    if (Wait-Job $job -Timeout $TimeoutSec) {
        $result = Receive-Job $job
        Remove-Job $job
        return $result
    }
    Remove-Job $job -Force
    return $Default
}

Set-Location $PSScriptRoot
Write-Banner

# ───────────────────────────────────────────────────────────────────────────
# PASSO 1: Node.js
# ───────────────────────────────────────────────────────────────────────────
Write-Step "1/9 — Node.js"

if (Test-CommandExists 'node') {
    $nodeVer = (node --version) 2>&1
    $nodeMajor = [int]($nodeVer -replace 'v', '' -split '\.' | Select-Object -First 1)
    if ($nodeMajor -ge 20) {
        Write-Ok "Node $nodeVer instalado (>= v20 exigido)."
    } else {
        Write-Warn "Node $nodeVer é antigo. T3MP3ST exige Node 20+."
        if (Test-CommandExists 'winget') {
            Write-Info "Atualizando via winget…"
            winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
            Write-Info "Feche e reabra o terminal se o PATH não atualizar."
        } else {
            Write-Err "Instale Node 20 LTS manualmente: https://nodejs.org/  → e re-execute este script."
            exit 1
        }
    }
} else {
    Write-Warn "Node.js não encontrado."
    if (Test-CommandExists 'winget') {
        Write-Info "Instalando Node.js LTS via winget…"
        winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        # Recarrega PATH da sessão
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
        if (Test-CommandExists 'node') {
            Write-Ok "Node instalado: $(node --version)"
        } else {
            Write-Err "Instalação terminou, mas 'node' ainda não está no PATH desta sessão. Feche este terminal, reabra e re-execute."
            exit 1
        }
    } else {
        Write-Err "winget não disponível. Instale Node 20 LTS de https://nodejs.org/ manualmente."
        exit 1
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 2: npm
# ───────────────────────────────────────────────────────────────────────────
Write-Step "2/9 — npm"

if (Test-CommandExists 'npm') {
    $npmVer = (npm --version) 2>&1
    Write-Ok "npm v$npmVer instalado."
} else {
    Write-Err "npm não encontrado (deveria ter vindo com Node). Reinstale Node.js."
    exit 1
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 3: Ollama (binário)
# ───────────────────────────────────────────────────────────────────────────
Write-Step "3/9 — Ollama"

if (Test-CommandExists 'ollama') {
    $ollamaOut = (& ollama --version 2>&1) -join ' '
    $ollamaVer = 'desconhecida'
    if ($ollamaOut -match '([\d]+\.[\d]+\.[\d]+)') { $ollamaVer = $Matches[1] }
    Write-Ok "Ollama v$ollamaVer instalado."
} else {
    Write-Warn "Ollama não encontrado."
    if (Test-CommandExists 'winget') {
        Write-Info "Instalando Ollama via winget…"
        winget install --id Ollama.Ollama --silent --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        # Recarrega PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
        # Ollama tipicamente vai para %LOCALAPPDATA%\Programs\Ollama
        $ollamaLocal = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
        if (Test-Path (Join-Path $ollamaLocal 'ollama.exe')) {
            $env:Path = "$ollamaLocal;$env:Path"
        }
        if (Test-CommandExists 'ollama') {
            Write-Ok "Ollama instalado."
        } else {
            Write-Err "Ollama instalado, mas não no PATH desta sessão. Feche e reabra o terminal."
            exit 1
        }
    } else {
        Write-Err "Instale Ollama de https://ollama.com/download manualmente e re-execute."
        exit 1
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 4: Daemon Ollama no ar (:11434)
# ───────────────────────────────────────────────────────────────────────────
Write-Step "4/9 — Daemon Ollama"

function Test-OllamaUp {
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

if (Test-OllamaUp) {
    Write-Ok "Daemon Ollama já está no ar (:11434)."
} else {
    Write-Info "Iniciando 'ollama serve' em segundo plano…"
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden
    $waited = 0
    while (-not (Test-OllamaUp) -and $waited -lt 15) {
        Start-Sleep -Seconds 1
        $waited++
    }
    if (Test-OllamaUp) {
        Write-Ok "Daemon Ollama respondendo em :11434 (após ${waited}s)."
    } else {
        Write-Err "Ollama não subiu em 15s. Rode 'ollama serve' manualmente e re-execute."
        exit 1
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 5: Modelo LLM disponível
# ───────────────────────────────────────────────────────────────────────────
Write-Step "5/9 — Modelo LLM ($Model)"

$tagsResp = try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5 } catch { $null }
$installedModels = @()
if ($tagsResp -and $tagsResp.models) {
    $installedModels = @($tagsResp.models | ForEach-Object { $_.name })
    Write-Info "Modelos já instalados: $($installedModels -join ', ')"
} else {
    Write-Info "Nenhum modelo instalado ainda."
}

$modelExists = $installedModels -contains $Model
if ($modelExists) {
    Write-Ok "Modelo '$Model' já disponível."
} else {
    Write-Warn "Modelo '$Model' não instalado. Baixando (pode demorar 2-10 min dependendo da rede)…"
    Write-Info "Executando: ollama pull $Model"
    & ollama pull $Model
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Modelo '$Model' baixado."
    } else {
        Write-Warn "Falha ao baixar '$Model'. Tentando modelo genérico 'qwen2.5:3b' como fallback…"
        & ollama pull 'qwen2.5:3b'
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Fallback 'qwen2.5:3b' baixado."
            $Model = 'qwen2.5:3b'
        } else {
            Write-Err "Não consegui baixar nenhum modelo. Sem LLM local, o Chat responderá 'LLM indisponível'."
            Write-Warn "Você pode seguir mesmo assim — o motor de Recon V2 funciona sem LLM (só a interpretação final falta)."
        }
    }
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 6: ~/.t3mp3st/.env
# ───────────────────────────────────────────────────────────────────────────
Write-Step "6/9 — Configuração (~/.t3mp3st/.env)"

$envDir = Join-Path $HOME '.t3mp3st'
$envFile = Join-Path $envDir '.env'
if (-not (Test-Path $envDir)) { New-Item -ItemType Directory -Path $envDir | Out-Null }

if (Test-Path $envFile) {
    Write-Ok ".env existe em $envFile"
} else {
    Write-Info "Criando .env com defaults locais…"
    @"
LLM_PROVIDER=local
TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api
TEMPEST_LOCAL_MODEL=$Model
T3MP3ST_PORT=3333
T3MP3ST_FULL_ARSENAL=true
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Ok ".env criado em $envFile (modelo padrão: $Model)"
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 7: node_modules
# ───────────────────────────────────────────────────────────────────────────
Write-Step "7/9 — Dependências do projeto (node_modules)"

$nodeModules = Join-Path $PSScriptRoot 'node_modules'
$packageJson = Join-Path $PSScriptRoot 'package.json'
$packageLock = Join-Path $PSScriptRoot 'package-lock.json'
$needsInstall = $false

if (-not (Test-Path $nodeModules)) {
    Write-Info "node_modules ausente."
    $needsInstall = $true
} elseif ((Test-Path $packageLock) -and ((Get-Item $packageLock).LastWriteTime -gt (Get-Item $nodeModules).LastWriteTime)) {
    Write-Info "package-lock.json mais novo que node_modules — reinstalando."
    $needsInstall = $true
} else {
    Write-Ok "node_modules existe e parece atualizado."
}

if ($needsInstall) {
    if (Test-Path $packageLock) {
        Write-Info "Executando 'npm ci' (usa package-lock.json)…"
        & npm ci --no-audit --no-fund --loglevel=error
    } else {
        Write-Info "Executando 'npm install'…"
        & npm install --no-audit --no-fund --loglevel=error
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm ci/install falhou. Veja os erros acima."
        exit 1
    }
    Write-Ok "Dependências instaladas."
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 8: Build TypeScript
# ───────────────────────────────────────────────────────────────────────────
Write-Step "8/9 — Build TypeScript (dist/)"

$distServer = Join-Path $PSScriptRoot 'dist\server.js'
$srcServer = Join-Path $PSScriptRoot 'src\server.ts'

if ($SkipBuild) {
    Write-Warn "-SkipBuild — pulando compilação."
} elseif (-not (Test-Path $distServer)) {
    Write-Info "dist/server.js ausente — rodando 'npm run build'…"
    & npm run build
    if ($LASTEXITCODE -ne 0) { Write-Err "Build falhou."; exit 1 }
    Write-Ok "Build concluído."
} elseif ((Test-Path $srcServer) -and ((Get-Item $srcServer).LastWriteTime -gt (Get-Item $distServer).LastWriteTime)) {
    Write-Info "src/server.ts mais novo que dist/ — recompilando…"
    & npm run build
    if ($LASTEXITCODE -ne 0) { Write-Err "Build falhou."; exit 1 }
    Write-Ok "Build refeito."
} else {
    Write-Ok "dist/ existe e parece atualizado."
}

# ───────────────────────────────────────────────────────────────────────────
# PASSO 9: Servidor T3MP3ST
# ───────────────────────────────────────────────────────────────────────────
Write-Step "9/9 — Servidor T3MP3ST (:3333)"

function Test-T3mpUp {
    try {
        $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3333/api/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

if (Test-T3mpUp) {
    Write-Warn "Servidor já está no ar em :3333 — não vou subir uma segunda instância."
    Write-Info "Se quiser reiniciar, feche o processo Node.js primeiro."
} else {
    Write-Info "Iniciando servidor Node em segundo plano…"
    $stdout = Join-Path $env:TEMP 't3mp3st-stdout.log'
    $stderr = Join-Path $env:TEMP 't3mp3st-stderr.log'
    # Path relativo (dist/server.js) evita problema com espaços em $PSScriptRoot.
    # Start-Process com -WorkingDirectory garante que o cwd seja a raiz do repo.
    $proc = Start-Process -FilePath 'node' -ArgumentList @('dist/server.js') `
        -WorkingDirectory $PSScriptRoot `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr `
        -WindowStyle Hidden -PassThru
    Write-Info "PID: $($proc.Id) · logs: $stdout"

    $waited = 0
    while (-not (Test-T3mpUp) -and $waited -lt 20) {
        Start-Sleep -Seconds 1
        $waited++
    }
    if (Test-T3mpUp) {
        Write-Ok "Servidor respondendo em :3333 (após ${waited}s)."
    } else {
        Write-Err "Servidor não subiu em 20s. Veja logs em $stderr"
        Get-Content $stderr -Tail 20 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        exit 1
    }
}

# ───────────────────────────────────────────────────────────────────────────
# Sumário final + abre browser
# ───────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  🎯 T3MP3ST pronto para uso                                            ║" -ForegroundColor Green
Write-Host "  ║                                                                       ║" -ForegroundColor Green
Write-Host "  ║  Abra: http://127.0.0.1:3333/ui/                                      ║" -ForegroundColor Green
Write-Host "  ║  Modelo LLM: $($Model.PadRight(52))║" -ForegroundColor Green
Write-Host "  ║                                                                       ║" -ForegroundColor Green
Write-Host "  ║  Para parar o servidor: feche o processo node.exe no Gerenciador     ║" -ForegroundColor Green
Write-Host "  ║  de Tarefas ou execute: taskkill /F /IM node.exe                     ║" -ForegroundColor Green
Write-Host "  ╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if (-not $SkipBrowser) {
    Start-Sleep -Seconds 2
    Write-Info "Abrindo browser…"
    Start-Process 'http://127.0.0.1:3333/ui/'
}

exit 0
