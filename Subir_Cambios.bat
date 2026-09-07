@echo off
echo ===================================================
echo     SUBIENDO NUEVAS IMAGENES AL SERVIDOR DE ENCAVIGO
echo ===================================================
echo.
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
echo ESTAS SON TUS URLS DISPONIBLES PARA EL PANEL:
echo ---------------------------------------------------
for %%f in (assets\*.*) do (
    echo https://encavigo.com/assets/%%~nxf
)
echo ---------------------------------------------------
echo.
echo Selecciona con el mouse la que necesites, haz clic derecho para copiar, y pegala en el panel.
echo.
pause
