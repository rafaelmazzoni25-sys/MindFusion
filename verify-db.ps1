# ========================================
# Verificar Setup do Banco de Dados
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificando Banco de Dados MySQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar credenciais do MySQL
$mysqlUser = Read-Host "Usuario MySQL (geralmente 'root')"
if ([string]::IsNullOrEmpty($mysqlUser)) {
    $mysqlUser = "root"
}

Write-Host ""
Write-Host "Digite a senha do MySQL (deixe vazio se nao tiver senha):" -ForegroundColor Yellow
$mysqlPass = Read-Host -AsSecureString
$mysqlPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPass))

# Testar conexão e verificar banco
Write-Host ""
Write-Host "Testando conexão com MySQL..." -ForegroundColor Yellow

$testQuery = @"
USE mind_task_fusion;
SHOW TABLES;
"@

if ([string]::IsNullOrEmpty($mysqlPassPlain)) {
    $result = $testQuery | mysql -u $mysqlUser 2>&1
}
else {
    $result = $testQuery | mysql -u $mysqlUser -p$mysqlPassPlain 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conectado ao MySQL com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tabelas encontradas:" -ForegroundColor Cyan
    $result | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
    $tableCount = ($result | Measure-Object).Count - 1 # Remove header
    Write-Host ""
    if ($tableCount -eq 17) {
        Write-Host "✅ Todas as 17 tabelas estao presentes!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Banco de dados pronto para uso!" -ForegroundColor Green
        
        # Perguntar se quer atualizar database.php
        Write-Host ""
        Write-Host "Deseja atualizar backend/api/config/database.php com essas credenciais?" -ForegroundColor Yellow
        $update = Read-Host "(S/N)"
        
        if ($update -eq "S" -or $update -eq "s") {
            $dbConfigPath = "backend\api\config\database.php"
            $content = Get-Content $dbConfigPath -Raw
            
            # Atualizar credenciais
            $content = $content -replace 'private \$username = ".*";', "private `$username = `"$mysqlUser`";"
            $content = $content -replace 'private \$password = ".*";', "private `$password = `"$mysqlPassPlain`";"
            
            Set-Content -Path $dbConfigPath -Value $content
            Write-Host "✅ Arquivo database.php atualizado!" -ForegroundColor Green
        }
    }
    else {
        Write-Host "⚠️  Esperado 17 tabelas, encontrado $tableCount" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Voce precisa importar o schema:" -ForegroundColor Yellow
        Write-Host "mysql -u $mysqlUser -p mind_task_fusion < backend\database\schema.sql" -ForegroundColor Cyan
    }
}
else {
    Write-Host "❌ Erro ao conectar ao MySQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "1. MySQL esta rodando? (Verifique no Gerenciador de Servicos)" -ForegroundColor White
    Write-Host "2. Usuario e senha estao corretos?" -ForegroundColor White
    Write-Host "3. Banco 'mind_task_fusion' foi criado?" -ForegroundColor White
    Write-Host ""
    Write-Host "Para criar o banco:" -ForegroundColor Yellow
    Write-Host "mysql -u root -p" -ForegroundColor Cyan
    Write-Host "CREATE DATABASE mind_task_fusion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
