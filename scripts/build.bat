@echo off
echo ====================================
echo Build para Producao
echo ====================================

echo.
echo [1/3] Build do React...
cd frontend
call npm run build
cd ..

echo.
echo [2/3] Build do Electron...
cd frontend
call npm run dist
cd ..

echo.
echo [3/3] Build concluido!
echo Executavel em: frontend\dist\
echo.
pause
