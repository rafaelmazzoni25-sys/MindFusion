-- Update workspace_users role column to use ENUM
-- This migration adds proper role types for permission system

-- First, update any existing NULL values to 'Editor' (default)
UPDATE workspace_users SET role = 'Editor' WHERE role IS NULL;

-- Modify the column to use ENUM with our 4 role types
ALTER TABLE workspace_users 
MODIFY COLUMN role ENUM('Owner', 'Admin', 'Editor', 'Viewer') DEFAULT 'Editor' NOT NULL;
