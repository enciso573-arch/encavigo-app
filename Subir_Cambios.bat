@echo off
echo ===================================================
echo     SUBIENDO NUEVAS IMAGENES AL SERVIDOR DE ENCAVIGO
echo ===================================================
echo.
echo Detectando cambios en la carpeta...
git add .
git commit -m "Subida automatica de imagenes o cambios"
echo.
echo Subiendo a internet, por favor espera...
git push
echo.
echo ===================================================
echo   ¡LISTO! TUS IMAGENES ESTAN EN LINEA.
echo ===================================================
echo.
echo Recuerda que la URL de tu imagen sera:
echo https://encavigo.com/assets/NOMBREDETUIMAGEN.jpg
echo.
pause
