@echo off
title Push Nova Loader to GitHub
echo ========================================================
echo   Uploading Nova Loader to GitHub...
echo ========================================================
echo.

cd /d "%~dp0"
git add .
git commit -m "update: Nova Loader" >nul 2>&1
git push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] All files successfully uploaded to GitHub!
    echo Vercel will automatically detect and rebuild.
) else (
    echo [INFO] If the GitHub login window appears, please click 'Sign in with your browser'.
)
echo ========================================================
pause
