@echo off
echo ========================================
echo Configurando MySQL para Mind-Task Fusion
echo ========================================
echo.

set /p MYSQL_PASS="Digite a senha do MySQL root: "

echo.
echo Criando banco de dados...
mysql -u root -p%MYSQL_PASS% -e "DROP DATABASE IF EXISTS mind_task_fusion; CREATE DATABASE mind_task_fusion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo Importando schema...
mysql -u root -p%MYSQL_PASS% mind_task_fusion < backend\database\schema.sql

echo.
echo Verificando instalacao...
mysql -u root -p%MYSQL_PASS% mind_task_fusion -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'mind_task_fusion';"

echo.
echo ========================================
echo Concluido! Banco configurado.
echo ========================================
pause
