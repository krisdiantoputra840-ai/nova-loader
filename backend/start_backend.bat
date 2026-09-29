@echo off
title Nova Loader - Standalone Backend Server
cd /d "%~dp0"
echo ========================================================
echo   NOVA LOADER - STANDALONE BACKEND API (FastAPI)
echo ========================================================
echo.
echo Memeriksa paket Python...
python -m pip install -r requirements.txt --quiet
echo.
echo Menjalankan Backend Server pada http://127.0.0.1:8080 ...
echo (Tekan Ctrl+C untuk menghentikan server)
echo.
python main.py
pause
