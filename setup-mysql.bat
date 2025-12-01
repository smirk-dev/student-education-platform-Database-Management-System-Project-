@echo off
echo Setting up MySQL...
cd /d "%ProgramFiles%\MySQL\MySQL Server 8.4\bin"

echo Initializing MySQL data directory...
mysqld --initialize-insecure --console

echo Installing MySQL service...
mysqld --install MySQL

echo Starting MySQL service...
net start MySQL

echo Setting root password to 1234...
mysql -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '1234'; FLUSH PRIVILEGES;"

echo Creating student_portal database...
mysql -u root -p1234 < "%~dp0database\mysql\schema.sql"

echo MySQL setup complete!
pause
