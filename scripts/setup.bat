@echo off
echo ====================================
echo Configurando Expensify Integration
echo ====================================

echo.
echo [1/4] Configurando ambiente Python...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo [2/4] Instalando dependencias Node.js...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Configurando Tailwind CSS...
cd frontend
call npx tailwindcss init -p
cd ..

echo.
echo [4/4] Setup concluido!
echo.
echo Para iniciar:
echo - Backend: cd backend ^&^& venv\Scripts\activate ^&^& python app.py
echo - Frontend: cd frontend ^&^& npm start
echo - Desktop: cd frontend ^&^& npm run electron-dev
echo.
pause
