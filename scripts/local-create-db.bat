@echo off
REM Bases locales Laragon : lms_app (monorepo gsms-school) + gsms_deploy (cockpit deploy)
set PGPASSWORD=postgres
set PSQL=C:\laragon\bin\postgresql\postgresql\bin\psql.exe

if not exist "%PSQL%" (
  echo ERREUR: psql introuvable. Verifiez Laragon ^> PostgreSQL.
  exit /b 1
)

echo --- lms_app (monorepo gsms-school : CRM + landing + workers) ---
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE lms_app;"

echo --- gsms_deploy (cockpit deploy gsms-deploy) ---
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE gsms_deploy;"

echo.
echo Bases presentes:
"%PSQL%" -U postgres -h localhost -p 5432 -tAc "SELECT datname FROM pg_database WHERE datname IN ('lms_app','gsms_deploy') ORDER BY 1;"
echo.
echo Si "already exists", c'est normal. Ensuite:
echo   cd C:\laragon\www\gsms-school  ^&^& pnpm db:push ^&^& pnpm db:seed
echo   cd C:\laragon\www\gsms-deploy  ^&^& pnpm db:setup
pause
