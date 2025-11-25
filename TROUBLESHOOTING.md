# Instruções para Resolver Erro de Execução de Scripts

## ❌ Erro: "Execução de scripts foi desabilitada"

Se você recebeu o erro:
```
npm : O arquivo (...) não pode ser carregado porque a execução de scripts foi desabilitada
```

### Solução Rápida (Recomendada)

**Execute este comando no PowerShell como Administrador**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Confirme com "S" (Sim).

### Alternativa: Use CMD ao invés de PowerShell

Ao invés de usar PowerShell, use o **Prompt de Comando (CMD)**:

1. Abra o CMD (não PowerShell)
2. Navegue até a pasta do projeto:
   ```cmd
   cd C:\Users\rafae\Downloads\ProjetosWeb
   ```
3. Execute os comandos normalmente:
   ```cmd
   npm install
   npm run dev
   ```

---

## 🚀 Instalando Dependências (Após Resolver Erro)

### Passo 1: Instalar Node Modules

```powershell
npm install
```

Isso instalará:
- ✅ React 19
- ✅ React DOM 19
- ✅ TypeScript 5.8
- ✅ Vite 6
- ✅ @types/react
- ✅ @types/react-dom
- ✅ @types/node

### Passo 2: Verificar Instalação

```powershell
npm list --depth=0
```

Deve mostrar todos os pacotes instalados.

---

## ✅ Sequência Completa de Setup

### Usando CMD (Mais Simples)

```cmd
:: 1. Instalar dependências
npm install

:: 2. Configurar MySQL (se ainda não fez)
:: Execute manualmente via MySQL Workbench ou CLI:
:: mysql -u root -p < backend\database\schema.sql

:: 3. Iniciar backend (em um terminal)
start-backend.bat

:: 4. Em OUTRO terminal CMD, iniciar frontend
npm run dev
```

### Usando PowerShell (Após liberar scripts)

```powershell
# 1. Liberar execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Executar setup automático
.\setup.ps1

# 3. Configurar MySQL
.\backend\setup-db.ps1

# 4. Editar credenciais
# backend\api\config\database.php (sua senha MySQL)

# 5. Iniciar backend
.\start-backend.bat

# 6. Em outro terminal, iniciar frontend
npm run dev
```

---

## 🐛 Troubleshooting

### "Cannot find module 'react'"
**Causa**: npm install não rodou
**Solução**: Execute `npm install`

### "MySQL connection failed"
**Causa**: MySQL não está rodando ou senha errada
**Solução**: 
1. Verifique se MySQL está rodando: `services.msc` → procure MySQL
2. Confirme senha em `backend\api\config\database.php`

### CORS Error no navegador
**Causa**: Backend não está rodando ou porta errada
**Solução**: Verifique se `start-backend.bat` está rodando e mostrando "Development Server"

---

## 📞 Atalho Rápido

Se quiser pular todos os scripts PowerShell e fazer manualmente:

```cmd
REM Terminal 1 - Backend
cd C:\Users\rafae\Downloads\ProjetosWeb\backend\api
php -S localhost:8000

REM Terminal 2 - Frontend
cd C:\Users\rafae\Downloads\ProjetosWeb
npm install
npm run dev
```

Pronto!
