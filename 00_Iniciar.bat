@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM T3MP3ST — Iniciador com auto-check de dependências
REM Este .bat é apenas um wrapper: chama o 00_iniciar.ps1 com política Bypass
REM para que o usuário só precise dar duplo-clique.
REM ═══════════════════════════════════════════════════════════════════════════

setlocal
cd /d "%~dp0"

REM Prefer PowerShell 7 (pwsh) se instalado; senão cai no Windows PowerShell 5.1
where pwsh >nul 2>&1
if %ERRORLEVEL%==0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp000_iniciar.ps1" %*
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp000_iniciar.ps1" %*
)

REM Manter janela aberta ao final para o usuário ver a URL
if errorlevel 1 (
    echo.
    echo [ERRO] O iniciador terminou com erro. Veja as mensagens acima.
    pause
) else (
    echo.
    echo Pressione qualquer tecla para fechar esta janela...
    pause >nul
)

endlocal
