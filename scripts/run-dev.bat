@echo off
echo Iniciando Expensify Integration...

:: Iniciar backend
start "Backend Flask" cmd /k "cd backend && venv\Scripts\activate && python app.py"

:: Aguardar backend
timeout /t 3 /nobreak > nul

:: Iniciar frontend
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo Aplicacao iniciada!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
