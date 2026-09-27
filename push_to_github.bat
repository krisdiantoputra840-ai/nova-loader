@echo off
title Push Nova Loader ke GitHub
echo ========================================================
echo       Mengunggah Perubahan Nova Loader ke GitHub
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Menyiapkan perubahan file (git add)...
git add .

echo.
echo [2/3] Menyimpan commit...
set "commit_msg="
set /p commit_msg="Masukkan pesan commit (atau tekan ENTER untuk default): "
if "%commit_msg%"=="" set commit_msg=feat: re-download from recent, search bar, and video/audio category filters

git commit -m "%commit_msg%"

echo.
echo [3/3] Mengunggah (push) ke GitHub (origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [SUKSES] Semua perubahan berhasil diunggah ke GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo  [INFO] Jika diminta login, silakan klik
    echo  'Sign in with your browser' di jendela yang muncul.
    echo ========================================================
)
echo.
pause
