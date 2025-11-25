@echo off
REM ========================================
REM Importar Schema do MySQL
REM ========================================

echo ========================================
echo Importando Schema para MySQL
echo ========================================
echo.
echo Este script vai importar o schema.sql para o banco mind_task_fusion
echo.

set /p mysql_user="Usuario MySQL (geralmente 'root'): "
if "%mysql_user%"=="" set mysql_user=root

echo.
echo Importando schema...
echo.

mysql -u %mysql_user% -p mind_task_fusion < backend\database\schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Schema importado com sucesso!
    echo ========================================
    echo.
    echo Verificando tabelas...
    echo USE mind_task_fusion; SHOW TABLES; | mysql -u %mysql_user% -p
) else (
    echo.
    echo ========================================
    echo ❌ Erro ao importar schema
    echo ========================================
    echo.
    echo Verifique se:
    echo 1. O MySQL esta rodando
    echo 2. O banco mind_task_fusion existe
    echo 3. As credenciais estao corretas
)

echo.
pause
