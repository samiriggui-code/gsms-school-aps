@echo off
cd /d "c:\laragon\www\lms"
mkdir "apps\lms-crm\app\(protected)\gestion-academique\vie-scolaire\certifications"
xcopy /E /I /Y "apps\lms-crm\app\(protected)\evaluations-certification\certifications" "apps\lms-crm\app\(protected)\gestion-academique\vie-scolaire\certifications"
rmdir /S /Q "apps\lms-crm\app\(protected)\evaluations-certification"
rmdir /S /Q "apps\lms-crm\app\(protected)\gestion-academique\inscriptions"
del "restructure_academic.bat"
