@echo off
echo ================================================
echo Creating Activity Logs Table
echo ================================================
echo.

echo Applying migration...
mysql -u root -p -e "USE u376912305_mindtask; source c:\Users\rafae\Downloads\ProjetosWeb\backend\database\migrations\create_activity_logs.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create table!
    pause
    exit /b 1
)

echo.
echo ================================================
echo activity_logs table created successfully!
echo ================================================
echo.
echo Activity tracking is now ready!
echo.
pause
