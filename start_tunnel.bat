@echo off
title Nova Loader - Backend & Ngrok Starter
echo ========================================================
echo   Menjalankan Backend FastAPI & Ngrok Tunnel...
echo ========================================================
echo.

:: 1. Jalankan Backend FastAPI di jendela cmd baru
start "Nova Backend (Port 8080)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8080"

:: Tunggu 3 detik agar backend siap
timeout /t 3 /nobreak >nul

:: 2. Jalankan Ngrok Tunnel di jendela cmd baru
start "Ngrok Tunnel" cmd /k "ngrok http 8080"

echo.
echo [OK] Backend dan Ngrok sudah terbuka di jendela terpisah!
echo.
echo Langkah selanjutnya:
echo 1. Lihat jendela "Ngrok Tunnel" yang baru terbuka.
echo 2. Cari baris "Forwarding" dan copy URL https-nya
echo    (contoh: https://xxxx-xx-xx-xx.ngrok-free.app).
echo 3. Masukkan URL tersebut ke Vercel (Environment Variable: VITE_API_URL).
echo.
echo JANGAN tutup jendela Backend maupun Ngrok selama website dipakai.
echo ========================================================
pause
