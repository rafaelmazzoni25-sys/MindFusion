@echo off
REM Database Migration Script - Add User Profile Columns
REM Run this to add avatar and bio columns to users table

echo ========================================
echo Adding user profile columns to database
echo ========================================
echo.

REM Update these values with your database credentials
set DB_HOST=localhost
set DB_NAME=mind_task_fusion
set DB_USER=root
set DB_PASS=

echo Executing migration...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < "backend\database\migrations\add_user_profile_columns.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Avatar and bio columns have been added to the users table.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check your database credentials and try again.
)

pause
