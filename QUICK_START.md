# Scripts para Desenvolvimento Local

## 🚀 Iniciar Backend (PHP Server)

```powershell
# Windows PowerShell
cd backend\api
php -S localhost:8000
```

Deixe este terminal aberto. Backend rodando em: `http://localhost:8000`

## 🎨 Iniciar Frontend (React/Vite)

```powershell
# Novo terminal
npm run dev
```

Frontend rodando em: `http://localhost:5173`

## 🗄️ Setup MySQL (Primeira Vez)

```powershell
# Opção 1: Script automático
.\backend\setup-db.ps1

# Opção 2: Manual via MySQL CLI
mysql -u root -p < backend\database\schema.sql
```

## 📦 Instalar Dependências

```powershell
npm install
```

## ✅ Testar API

```powershell
# Testar registro
curl -X POST http://localhost:8000/auth/register.php `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"teste@local.com\",\"password\":\"senha123\",\"name\":\"Teste\"}'
```

## 🔧 Configuração

1. Copie `.env.example` para `.env.local`
2. Ajuste `VITE_API_URL` se necessário
3. Configure `backend/api/config/database.php` com credenciais MySQL
