# 🚀 Início Rápido - Testes Local

Você já criou o banco de dados! Agora vamos iniciar o ambiente de desenvolvimento.

## ✅ Pré-requisitos

- [x] MySQL rodando
- [x] Banco de dados `mind_task_fusion` criado
- [ ] PHP instalado
- [ ] Node.js instalado

---

## 📝 Passos para Iniciar

### 1️⃣ Verificar PHP

```powershell
php -v
```

**Se não tiver PHP instalado:**
- Baixe em: https://windows.php.net/download/
- Ou use XAMPP: https://www.apachefriends.org/

### 2️⃣ Verificar se o Schema foi Importado

```powershell
# Conectar ao MySQL
mysql -u root -p

# Verificar tabelas (deve mostrar 17 tabelas)
USE mind_task_fusion;
SHOW TABLES;
```

**Se não mostrar as tabelas, importe o schema:**
```powershell
mysql -u root -p mind_task_fusion < backend\database\schema.sql
```

### 3️⃣ Iniciar o Backend (Terminal 1)

```powershell
# Use o arquivo .bat já pronto
.\start-backend.bat
```

**OU manualmente:**
```powershell
cd backend\api
php -S localhost:8000
```

✅ **Backend rodando em:** `http://localhost:8000`

### 4️⃣ Iniciar o Frontend (Terminal 2 - NOVO TERMINAL)

```powershell
# Instalar dependências (primeira vez)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

✅ **Frontend rodando em:** `http://localhost:5173`

---

## 🧪 Testar a Aplicação

1. Abra o navegador em: **http://localhost:5173**
2. Tente fazer login ou criar uma conta
3. A aplicação deve se conectar ao backend local automaticamente

---

## 🔍 Verificar Conexão com o Banco

O arquivo `backend/api/config/database.php` já está configurado para:
- **Host:** localhost
- **Database:** mind_task_fusion
- **Username:** root
- **Password:** (vazio)

**Se sua senha do MySQL for diferente**, edite a linha 14 do arquivo:
```php
private $password = "SUA_SENHA_AQUI";
```

---

## 🐛 Problemas Comuns

### Backend não inicia
**Erro:** `php: command not found`
**Solução:** Instale PHP ou use XAMPP

### Frontend não encontra backend
**Erro:** `Failed to fetch` ou `Network Error`
**Solução:** Verifique se o backend está rodando em `http://localhost:8000`

### Erro de conexão com banco
**Erro:** `Database connection failed`
**Soluções:**
1. Verifique se MySQL está rodando:
   ```powershell
   Get-Service MySQL*
   ```
2. Confirme que o banco `mind_task_fusion` existe
3. Verifique a senha no arquivo `database.php`

---

## 📊 Endpoints para Testar

Com o backend rodando, você pode testar:

- **Registro:** `POST http://localhost:8000/auth/register.php`
- **Login:** `POST http://localhost:8000/auth/login.php`
- **Nodes:** `GET http://localhost:8000/nodes/index.php`

Ou use a interface do frontend em `http://localhost:5173`

---

## ⏭️ Próximos Passos

Após testar localmente:
1. ✅ Verificar todas as funcionalidades
2. ✅ Corrigir bugs encontrados
3. 🚀 Fazer deploy na Hostinger

**Ambiente pronto para desenvolvimento!** 🎉
