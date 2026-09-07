@echo off
echo ===================================================
echo     AUTO-RECORTE Y SUBIDA A ENCAVIGO
echo ===================================================
echo.
echo Procesando imagenes de "nuevas_fotos"...
python optimizar_fotos.py
echo.
echo Detectando cambios...
git add .
git commit -m "Auto-procesamiento y subida de imagenes"
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
