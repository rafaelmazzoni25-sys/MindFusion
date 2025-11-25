-- Script de Setup Rápido para Testes Locais
-- Execute este script no seu MySQL local

-- Criar banco de dados
DROP DATABASE IF EXISTS mind_task_fusion;
CREATE DATABASE mind_task_fusion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco
USE mind_task_fusion;

-- Importar todas as tabelas do schema
SOURCE C:/Users/rafae/Downloads/ProjetosWeb/backend/database/schema.sql;

-- Verificar criação
SHOW TABLES;

-- Criar usuário de teste (opcional - pode usar root)
-- DROP USER IF EXISTS 'mindtask'@'localhost';
-- CREATE USER 'mindtask'@'localhost' IDENTIFIED BY 'senha123';
-- GRANT ALL PRIVILEGES ON mind_task_fusion.* TO 'mindtask'@'localhost';
-- FLUSH PRIVILEGES;

SELECT 'Database mind_task_fusion criado com sucesso!' AS status;
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'mind_task_fusion';
