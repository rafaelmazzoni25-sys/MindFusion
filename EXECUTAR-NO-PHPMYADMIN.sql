-- Execute este SQL no phpMyAdmin
-- Selecione o banco "mind_task_fusion" (ou nome do seu banco)
-- Vá na aba SQL e cole este código

ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verificar se funcionou
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users';
