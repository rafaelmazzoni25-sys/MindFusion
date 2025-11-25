# 🖥️ Setup Local para Testes - Windows com XAMPP/MySQL

## Objetivo
Configurar ambiente local para testar o backend PHP antes de fazer deploy na Hostinger.

---

## 📋 Pré-requisitos

Você já tem:
- ✅ MySQL instalado e rodando
- ✅ Windows

Vai precisar:
- [ ] PHP 7.4+ instalado
- [ ] Servidor web (Apache ou PHP built-in)

---

## Opção 1: PHP Built-in Server (Mais Simples) ⭐

### Passo 1: Verificar/Instalar PHP

```powershell
# Verificar se PHP está instalado
php -v
```

Se não estiver instalado:
1. Baixe PHP para Windows: https://windows.php.net/download/
2. Extraia para `C:\php`
3. Adicione `C:\php` ao PATH do Windows
4. Reinicie o terminal

### Passo 2: Criar Banco de Dados Local

```sql
-- Conecte ao MySQL via linha de comando ou phpMyAdmin
mysql -u root -p

-- Criar banco de dados
CREATE DATABASE mind_task_fusion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário (opcional, pode usar root)
CREATE USER 'mindtask'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON mind_task_fusion.* TO 'mindtask'@'localhost';
FLUSH PRIVILEGES;

-- Usar o banco
USE mind_task_fusion;

-- Importar schema
SOURCE C:/Users/rafae/Downloads/ProjetosWeb/backend/database/schema.sql;

-- Verificar tabelas
SHOW TABLES;
```

### Passo 3: Configurar Credenciais do Backend

Edite `backend/api/config/database.php`:

```php
private $host = "localhost";
private $db_name = "mind_task_fusion";
private $username = "root"; // ou "mindtask"
private $password = "SUA_SENHA_MYSQL"; // sua senha do MySQL
```

### Passo 4: Iniciar Servidor PHP

```powershell
cd C:\Users\rafae\Downloads\ProjetosWeb\backend\api

# Iniciar servidor PHP na porta 8000
php -S localhost:8000
```

**Servidor rodando em**: `http://localhost:8000`

### Passo 5: Testar Endpoints

Abra novo terminal (deixe o servidor rodando):

```powershell
# Testar registro
curl -X POST http://localhost:8000/auth/register.php `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"teste@local.com\",\"password\":\"senha123\",\"name\":\"Usuario Teste\"}'
```

**Resposta esperada**:
```json
{
  "success": true,
  "token": "eyJ...",
  "user": {...}
}
```

---

## Opção 2: XAMPP (Se preferir)

### Instalação

1. Baixe XAMPP: https://www.apachefriends.org/
2. Instale em `C:\xampp`
3. Inicie MySQL e Apache no XAMPP Control Panel

### Configuração

1. Copie pasta `backend/api` para `C:\xampp\htdocs\api`
2. Acesse: http://localhost/phpmyadmin
3. Crie banco `mind_task_fusion`
4. Importe `schema.sql`
5. Configure `database.php` como acima

**URL da API**: `http://localhost/api/auth/register.php`

---

## 🧪 Script de Testes Completo

Salve como `test-api.ps1`:

```powershell
# Configuração
$API_URL = "http://localhost:8000"
$EMAIL = "teste$(Get-Random)@local.com"
$PASSWORD = "senha123"
$NAME = "Usuario Teste"

Write-Host "=== Testando Backend Local ===" -ForegroundColor Green

# 1. Registro
Write-Host "`n1. Registrando usuário..." -ForegroundColor Yellow
$registerResponse = Invoke-RestMethod -Uri "$API_URL/auth/register.php" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = $EMAIL
        password = $PASSWORD
        name = $NAME
    } | ConvertTo-Json)

Write-Host "✅ Registrado com sucesso!" -ForegroundColor Green
$TOKEN = $registerResponse.token
Write-Host "Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Cyan

# 2. Login
Write-Host "`n2. Testando login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login.php" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        email = $EMAIL
        password = $PASSWORD
    } | ConvertTo-Json)

Write-Host "✅ Login bem-sucedido!" -ForegroundColor Green

# 3. Listar Nodes (protegido)
Write-Host "`n3. Testando endpoint protegido (nodes)..." -ForegroundColor Yellow
$nodesResponse = Invoke-RestMethod -Uri "$API_URL/nodes/index.php" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $TOKEN"
    }

Write-Host "✅ Nodes: $($nodesResponse.nodes.Count) encontrados" -ForegroundColor Green

# 4. Criar Node
Write-Host "`n4. Criando node..." -ForegroundColor Yellow
$createNodeResponse = Invoke-RestMethod -Uri "$API_URL/nodes/index.php" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{
        "Authorization" = "Bearer $TOKEN"
    } `
    -Body (@{
        id = "node-test-1"
        text = "Meu Primeiro Node"
        position = @{ x = 100; y = 100 }
        width = 180
        height = 50
    } | ConvertTo-Json)

Write-Host "✅ Node criado!" -ForegroundColor Green

# 5. Listar Nodes novamente
Write-Host "`n5. Listando nodes novamente..." -ForegroundColor Yellow
$nodesResponse2 = Invoke-RestMethod -Uri "$API_URL/nodes/index.php" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $TOKEN"
    }

Write-Host "✅ Nodes: $($nodesResponse2.nodes.Count) encontrados" -ForegroundColor Green
$nodesResponse2.nodes | ForEach-Object { Write-Host "  - $($_.text)" -ForegroundColor Cyan }

Write-Host "`n=== Todos os testes passaram! ===" -ForegroundColor Green
```

Execute:
```powershell
.\test-api.ps1
```

---

## 🔧 Configurar Frontend para Usar API Local

Crie/edite `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

No código React, usar:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

---

## ✅ Checklist de Verificação

- [ ] MySQL rodando (`services.msc` → MySQL)
- [ ] Banco `mind_task_fusion` criado
- [ ] Schema importado (17 tabelas)
- [ ] `database.php` configurado com credenciais corretas
- [ ] Servidor PHP iniciado (`php -S localhost:8000`)
- [ ] Endpoint de registro funciona (200 OK)
- [ ] Endpoint de login funciona (200 OK)
- [ ] Endpoint protegido funciona com token
- [ ] Node criado com sucesso

---

## 🐛 Troubleshooting Local

### "Connection refused"
**Causa**: Servidor PHP não está rodando
**Solução**: Execute `php -S localhost:8000` na pasta `backend/api`

### "Database connection failed"
**Causa**: MySQL não está rodando ou credenciais erradas
**Solução**:
```powershell
# Verificar se MySQL está rodando
Get-Service MySQL*

# Se não estiver, iniciar
Start-Service MySQL80  # ou outro nome do serviço
```

### "Access denied for user"
**Causa**: Senha incorreta em `database.php`
**Solução**: Confirme senha do MySQL

### CORS Error
**Causa**: Frontend e backend em portas diferentes
**Solução**: Já configurado em `cors.php`, mas se precisar:
```php
header("Access-Control-Allow-Origin: http://localhost:5173"); // Vite port
```

---

## 🚀 Próximos Passos

Após ambiente local funcionando:
1. ✅ Testar todos os endpoints
2. ✅ Integrar frontend React
3. ✅ Testar fluxo completo
4. 🚀 Deploy na Hostinger

**Ambiente local pronto para desenvolvimento!** 🎉
