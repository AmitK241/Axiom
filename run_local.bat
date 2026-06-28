@echo off
setlocal EnableDelayedExpansion
title AXIOM - Local Dev Launcher

:: ============================================================
::  AXIOM - Cognitive Blind Spot Mapper
::  One-Click Local Dev Launcher (Windows)
::  Usage: Double-click run_local.bat OR run from project root
:: ============================================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV=%BACKEND%\venv"
set "PYTHON=%VENV%\Scripts\python.exe"
set "PIP=%VENV%\Scripts\python.exe -m pip"
set "UVICORN=%VENV%\Scripts\uvicorn.exe"

echo.
echo  ================================================
echo   AXIOM ^| Cognitive Blind Spot Mapper
echo   Starting Local Development Environment...
echo  ================================================
echo.

:: ── STEP 1: Validate backend directory ──────────────────────
if not exist "%BACKEND%\main.py" (
    echo [ERROR] Cannot find backend\main.py
    echo         Make sure you are running this from the AXIOM root folder.
    pause & exit /b 1
)

:: ── STEP 2: Create venv if it doesn't exist ─────────────────
if not exist "%VENV%\Scripts\activate.bat" (
    echo [1/4] Creating Python virtual environment...
    python -m venv "%VENV%"
    if errorlevel 1 (
        echo [ERROR] Failed to create venv. Is Python 3.13 installed and on PATH?
        pause & exit /b 1
    )
    echo       [OK] venv created.
) else (
    echo [1/4] venv already exists. Skipping creation.
)

:: ── STEP 3: Fix click / uvicorn + reinstall all deps ────────
echo [2/4] Installing / upgrading backend dependencies...
echo       (This fixes the click / uvicorn mismatch for Python 3.13)
echo.

"%PYTHON%" -m pip install --upgrade pip --quiet
"%PYTHON%" -m pip install --upgrade click "uvicorn[standard]" --quiet
"%PYTHON%" -m pip install -r "%BACKEND%\requirements.txt" --quiet

if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection or requirements.txt.
    pause & exit /b 1
)
echo       [OK] Backend dependencies installed.

:: ── STEP 4: Install frontend npm packages ───────────────────
echo [3/4] Installing frontend npm packages...
if not exist "%FRONTEND%\node_modules" (
    pushd "%FRONTEND%"
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        popd & pause & exit /b 1
    )
    popd
    echo       [OK] node_modules installed.
) else (
    echo       [OK] node_modules already present. Skipping npm install.
)

:: ── STEP 5: Launch Backend in a new terminal ────────────────
echo [4/4] Launching services...
echo.
echo  [BACKEND]  http://localhost:8000
echo  [FRONTEND] http://localhost:5173
echo  [API DOCS] http://localhost:8000/docs
echo.

start "AXIOM Backend (port 8000)" cmd /k "title AXIOM Backend ^| Port 8000 && cd /d "%BACKEND%" && "%UVICORN%" main:app --reload --host 127.0.0.1 --port 8000"

:: Small delay so backend gets a head-start
timeout /t 2 /nobreak >nul

:: ── STEP 6: Launch Frontend in a new terminal ────────────────
start "AXIOM Frontend (port 5173)" cmd /k "title AXIOM Frontend ^| Port 5173 && cd /d "%FRONTEND%" && npm run dev"

echo  ================================================
echo   Both services are launching in new windows.
echo.
echo   Backend  ^> http://localhost:8000
echo   API Docs ^> http://localhost:8000/docs
echo   Frontend ^> http://localhost:5173
echo  ================================================
echo.
echo  Close the two terminal windows to stop the servers.
echo  Press any key to close this launcher window...
pause >nul
