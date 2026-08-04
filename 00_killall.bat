@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM T3MP3ST — Killall (Windows wrapper)
REM Mata todos os processos do T3MP3ST + Ollama e limpa logs temporários.
REM Wrapper simples que chama 00_killall.ps1.
REM ═══════════════════════════════════════════════════════════════════════════

setlocal
cd /d "%~dp0"

REM Prefer PowerShell 7 (pwsh) se instalado; senão cai no Windows PowerShell 5.1
where pwsh >nul 2>&1
if %ERRORLEVEL%==0 (
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp000_killall.ps1" %*
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp000_killall.ps1" %*
)

REM Manter janela aberta para o usuário ver o que foi morto
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

endlocal
