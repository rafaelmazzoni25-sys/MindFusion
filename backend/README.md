# Mind-Task Fusion Backend

Backend API REST em PHP para o sistema Mind-Task Fusion.

## 📁 Estrutura

```
backend/
├── api/
│   ├── config/
│   │   ├── database.php    # Configuração do banco
│   │   ├── cors.php         # Configuração CORS
│   │   └── jwt.php          # Helper JWT
│   ├── auth/
│   │   ├── register.php     # Cadastro de usuários
│   │   └── login.php        # Login de usuários
│   ├── middleware/
│   │   └── auth.php         # Middleware de autenticação
│   ├── nodes/
│   │   ├── index.php        # CRUD de nós do Mind Map
│   │   └── connections.php  # CRUD de conexões
│   ├── tasks/
│   │   ├── index.php        # CRUD de tarefas
│   │   └── columns.php      # CRUD de colunas
│   ├── bugs/
│   │   └── index.php        # CRUD de bugs
│   └── .htaccess            # Configuração Apache
├── database/
│   └── schema.sql           # Schema do banco MySQL
└── .env.example             # Template de variáveis de ambiente
```

## 🚀 Configuração na Hostinger

### 1. Criar Banco de Dados

1. Acesse o cPanel da Hostinger
2. Vá em **MySQL Databases**
3. Crie um novo banco: `mind_task_fusion`
4. Crie um usuário e anote as credenciais
5. Associe o usuário ao banco com todas as permissões

### 2. Importar Schema

1. Acesse **phpMyAdmin** no cPanel
2. Selecione o banco `mind_task_fusion`
3. Vá na aba **Import**
4. Faça upload do arquivo `backend/database/schema.sql`
5. Clique em **Go**

### 3. Configurar Credenciais

Edite o arquivo `backend/api/config/database.php`:

```php
private $host = "localhost";
private $db_name = "mind_task_fusion"; // Seu banco
private $username = "seu_usuario";      // Seu usuário MySQL
private $password = "sua_senha";        // Sua senha MySQL
```

Edite também `backend/api/config/jwt.php`:

```php
private static $secret_key = "SUA-CHAVE-SECRETA-AQUI-MIN-32-CARACTERES";
```

### 4. Upload via FTP

1. Conecte via FTP (FileZilla ou File Manager do cPanel)
2. Navegue até `public_html/`
3. Crie uma pasta `api/`
4. Faça upload de toda a pasta `backend/api/` para `public_html/api/`

### 5. Testar API

Acesse: `https://seudominio.com/api/auth/register.php`

Se retornar erro 405 "Method not allowed", está funcionando!

## 📡 Endpoints Disponíveis

### Autenticação

- `POST /api/auth/register.php` - Cadastrar novo usuário
- `POST /api/auth/login.php` - Login

### Mind Map

- `GET /api/nodes/index.php` - Listar nós
- `POST /api/nodes/index.php` - Criar nó
- `PUT /api/nodes/index.php` - Atualizar nó
- `DELETE /api/nodes/index.php?id={nodeId}` - Deletar nó
- `GET /api/nodes/connections.php` - Listar conexões
- `POST /api/nodes/connections.php` - Criar conexão
- `DELETE /api/nodes/connections.php?id={connId}` - Deletar conexão

### Tasks

- `GET /api/tasks/index.php` - Listar colunas e tarefas
- `POST /api/tasks/index.php` - Criar tarefa
- `PUT /api/tasks/index.php` - Atualizar tarefa
- `DELETE /api/tasks/index.php?id={taskId}` - Deletar tarefa
- `POST /api/tasks/columns.php` - Criar coluna
- `PUT /api/tasks/columns.php` - Atualizar coluna
- `DELETE /api/tasks/columns.php?id={colId}` - Deletar coluna

### Bugs

- `GET /api/bugs/index.php` - Listar bugs
- `POST /api/bugs/index.php` - Criar bug
- `PUT /api/bugs/index.php` - Atualizar bug
- `DELETE /api/bugs/index.php?id={bugId}` - Deletar bug

## 🔒 Autenticação

Todas as rotas (exceto login/register) requerem token JWT.

Enviar no header:
```
Authorization: Bearer {seu_token_jwt}
```

## 🧪 Testar com cURL

### Registrar usuário:
```bash
curl -X POST https://seudominio.com/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123","name":"Nome Teste"}'
```

### Login:
```bash
curl -X POST https://seudominio.com/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123"}'
```

### Listar nós (autenticado):
```bash
curl https://seudominio.com/api/nodes/index.php \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🛠️ Troubleshooting

**Erro 500**: Verifique logs em `cPanel > Errors`

**CORS Error**: Verifique se `.htaccess` foi copiado corretamente

**Database Connection Failed**: Confirme credenciais no `config/database.php`

**Token Inválido**: Verifique se o header `Authorization` está correto

## 📝 Próximos Passos

Após configurar o backend, você precisa:

1. Atualizar o frontend React para usar esta API
2. Fazer build do React: `npm run build`
3. Fazer upload da pasta `dist/` para `public_html/`
4. Configurar domínio/SSL no cPanel

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ JWT para autenticação
- ✅ Prepared statements (SQL injection protection)
- ✅ CORS configurado
- ⚠️ Mude a `JWT_SECRET` em produção!
- ⚠️ Use HTTPS (SSL)
