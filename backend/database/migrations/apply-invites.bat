@echo off
echo ================================================
echo Creating Workspace Invites Table
echo ================================================
echo.

echo Applying migration...
mysql -u root -p -e "USE u376912305_mindtask; source c:\Users\rafae\Downloads\ProjetosWeb\backend\database\migrations\create_workspace_invites.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create table!
    pause
    exit /b 1
)

echo.
echo ================================================
echo workspace_invites table created successfully!
echo ================================================
echo.
echo You can now:
echo   - Send workspace invites via email
echo   - Track pending/accepted/rejected invitations
echo   - Set roles for new members (Admin/Editor/Viewer)
echo.
pause
