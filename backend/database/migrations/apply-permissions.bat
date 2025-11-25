@echo off
echo ================================================
echo Applying Permission System Migration
echo ================================================
echo.

echo Step 1: Updating database schema...
mysql -u root -p -e "USE u376912305_mindtask; UPDATE workspace_users SET role = 'Editor' WHERE role IS NULL; ALTER TABLE workspace_users MODIFY COLUMN role ENUM('Owner', 'Admin', 'Editor', 'Viewer') DEFAULT 'Editor' NOT NULL;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to apply migration!
    echo Make sure MySQL is running and credentials are correct.
    pause
    exit /b 1
)

echo.
echo ================================================
echo Migration applied successfully!
echo ================================================
echo.
echo Role types now available:
echo   - Owner: Full control including delete workspace
echo   - Admin: Manage members + all Editor permissions  
echo   - Editor: Create/edit/delete content
echo   - Viewer: Read-only access
echo.
pause
