@echo off
setlocal

echo ==========================================
echo   Thesis Survey App - Dev Environment
echo ==========================================

:: Get script directory
set "ROOT_DIR=%~dp0"

:: ------------------------------------------
echo.
echo [1/4] Checking environment...

where python >nul 2>nul || (
    echo ERROR: Python not found.
    pause
    exit /b 1
)

where npm >nul 2>nul || (
    echo ERROR: npm not found.
    pause
    exit /b 1
)

:: ------------------------------------------
echo.
echo [2/4] Setup backend venv...

if not exist "%ROOT_DIR%backend\venv\" (
    echo Creating virtual environment...
    python -m venv "%ROOT_DIR%backend\venv"
)

:: ------------------------------------------
echo.
echo [3/4] Install dependencies...

call "%ROOT_DIR%backend\venv\Scripts\pip.exe" install -r "%ROOT_DIR%backend\requirements.txt"

:: ------------------------------------------
echo.
echo [4/4] Starting services...

:: ✅ Backend (runs INSIDE backend + venv)
start "Flask Backend" cmd /k ^
cd /d "%ROOT_DIR%backend" ^&^& venv\Scripts\python main.py

:: ✅ Frontend (runs OUTSIDE venv, project root)
start "Vite Frontend" cmd /k ^
cd /d "%ROOT_DIR%" ^&^& npm run dev

echo.
echo ==========================================
echo Servers started successfully.
echo ==========================================

pause
endlocal