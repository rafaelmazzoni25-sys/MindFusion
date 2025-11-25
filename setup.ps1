# ===============================================
# SETUP COMPLETO - Mind-Task Fusion
# Execute este script para configurar tudo
# ===============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mind-Task Fusion - Setup Completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node/npm
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js não encontrado! Instale em: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 2. Verificar PHP
Write-Host ""
Write-Host "[2/5] Verificando PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php --version | Select-Object -First 1
    Write-Host "✅ PHP instalado: $phpVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  PHP não encontrado! Baixe em: https://windows.php.net/download/" -ForegroundColor Red
    Write-Host "   Ou continue e use XAMPP" -ForegroundColor Yellow
}

# 3. Verificar MySQL
Write-Host ""
Write-Host "[3/5] Verificando MySQL..." -ForegroundColor Yellow
try {
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService) {
        Write-Host "✅ MySQL encontrado: $($mysqlService.Name)" -ForegroundColor Green
        if ($mysqlService.Status -ne "Running") {
            Write-Host "⚠️  MySQL não está rodando. Iniciando..." -ForegroundColor Yellow
            Start-Service $mysqlService.Name
            Write-Host "✅ MySQL iniciado!" -ForegroundColor Green
        }
    }
    else {
        Write-Host "⚠️  MySQL não encontrado como serviço" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  Não foi possível verificar MySQL" -ForegroundColor Yellow
}

# 4. Instalar dependências Node
Write-Host ""
Write-Host "[4/5] Instalando dependências do projeto..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
}
else {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# 5. Configurar arquivo .env
Write-Host ""
Write-Host "[5/5] Configurando arquivo .env..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "✅ Arquivo .env.local criado!" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  .env.local já existe" -ForegroundColor Cyan
}

# Instruções finais
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Completo! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure o MySQL:" -ForegroundColor White
Write-Host "   .\backend\setup-db.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure backend/api/config/database.php com suas credenciais MySQL" -ForegroundColor White
Write-Host ""
Write-Host "3. Inicie o backend:" -ForegroundColor White
Write-Host "   .\start-backend.bat" -ForegroundColor Cyan
Write-Host "   (deixe este terminal aberto)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Em OUTRO terminal, inicie o frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
