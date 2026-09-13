@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===================================================
echo    PUBLICAR CAMBIOS EN ENCAVIGO.COM
echo ===================================================
echo.

git diff --quiet && git diff --cached --quiet && (
  echo No hay cambios que subir. Todo esta al dia.
  echo.
  pause
  exit /b 0
)

echo Estos son los archivos que cambiaron:
echo ---------------------------------------------------
git status --short
echo ---------------------------------------------------
echo.

set "MSG="
set /p MSG=Descripcion del cambio (o Enter para dejar la de siempre):
if "%MSG%"=="" set "MSG=Actualiza el sitio"

echo.
echo Guardando...
git add -A
git commit -m "%MSG%"

echo.
echo Subiendo a internet, espera...
git push

if errorlevel 1 (
  echo.
  echo ===================================================
  echo   ALGO FALLO AL SUBIR. Revisa el mensaje de arriba.
  echo ===================================================
  echo.
  echo Lo mas comun: alguien cambio algo desde la web de
  echo GitHub. En ese caso escribe:  git pull
  echo y vuelve a correr este archivo.
  echo.
  pause
  exit /b 1
)

echo.
echo ===================================================
echo   LISTO. EN 1 O 2 MINUTOS ESTA EN LINEA.
echo ===================================================
echo.
echo   encavigo.com
echo   encavigo.com/negocios
echo.
pause
