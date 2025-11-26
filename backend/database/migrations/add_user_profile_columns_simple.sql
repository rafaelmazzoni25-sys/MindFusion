-- Simpler version: Just try to add the columns
-- If they already exist, you'll get an error but it's safe

-- Add avatar column
ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL;

-- Add bio column  
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;

-- Verify changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('avatar', 'bio');
