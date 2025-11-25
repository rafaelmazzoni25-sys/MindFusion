@echo off
echo ================================================
echo Creating Workspace Events Table for Real-time Sync
echo ================================================
echo.

echo Applying migration...
mysql -u root -p -e "USE u376912305_mindtask; source c:\Users\rafae\Downloads\ProjetosWeb\backend\database\migrations\create_workspace_events.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create table!
    pause
    exit /b 1
)

echo.
echo ================================================
echo workspace_events table created successfully!
echo ================================================
echo.
echo Real-time sync is now ready!
echo Events will be streamed to connected clients.
echo.
pause
