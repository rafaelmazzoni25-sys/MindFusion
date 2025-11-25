# Script para importar schema no MySQL local
# Execute com: .\setup-db.ps1

$MYSQL_USER = "root"
$MYSQL_PASS = Read-Host "Digite a senha do MySQL root" -AsSecureString
$MYSQL_PASS_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_PASS))

Write-Host "Importando schema para MySQL..." -ForegroundColor Yellow

# Importar schema
$env:MYSQL_PWD = $MYSQL_PASS_TEXT
mysql -u $MYSQL_USER -e "DROP DATABASE IF EXISTS mind_task_fusion; CREATE DATABASE mind_task_fusion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u $MYSQL_USER mind_task_fusion < "$PSScriptRoot\database\schema.sql"

# Verificar
$tableCount = mysql -u $MYSQL_USER mind_task_fusion -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'mind_task_fusion';"

if ($tableCount -eq 17) {
    Write-Host "✅ Banco criado com sucesso! $tableCount tabelas importadas." -ForegroundColor Green
} else {
    Write-Host "⚠️ Algo deu errado. Esperado 17 tabelas, encontrado: $tableCount" -ForegroundColor Red
}

Remove-Item Env:\MYSQL_PWD
