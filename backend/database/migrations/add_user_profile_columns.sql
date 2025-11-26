-- Add missing columns to users table for profile functionality
-- Run this on your MySQL database via phpMyAdmin

-- Add avatar column (safe - ignores if already exists)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE table_schema=DATABASE() AND table_name='users' AND column_name='avatar') = 0,
    'ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add bio column (safe - ignores if already exists)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE table_schema=DATABASE() AND table_name='users' AND column_name='bio') = 0,
    'ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('avatar', 'bio');
