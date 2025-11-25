@echo off
echo ========================================
echo Mind-Task Fusion - Backend Server
echo ========================================
echo.
echo Iniciando servidor PHP na porta 8000...
echo Backend URL: http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

cd backend\api
php -S localhost:8000
