@echo off
REM Bases locales Laragon pour app-prisma (lms_solo) et gsms-deploy / gsms-iade (gsms_deploy)
set PGPASSWORD=postgres
set PSQL=C:\laragon\bin\postgresql\postgresql\bin\psql.exe

if not exist "%PSQL%" (
  echo ERREUR: psql introuvable. Verifiez Laragon ^> PostgreSQL.
  exit /b 1
)

echo --- lms_solo (monorepo LMS app-prisma) ---
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE lms_solo;"

echo --- gsms_deploy (cockpit deploy gsms-iade / gsms-deploy) ---
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE gsms_deploy;"

echo.
echo Bases presentes:
"%PSQL%" -U postgres -h localhost -p 5432 -tAc "SELECT datname FROM pg_database WHERE datname IN ('lms_solo','gsms_deploy') ORDER BY 1;"
echo.
echo Si "already exists", c'est normal. Ensuite:
echo   cd C:\laragon\www\app-prisma  ^&^& pnpm db:push ^&^& pnpm db:seed
echo   cd C:\laragon\www\gsms-iade  ^&^& pnpm db:setup
pause
