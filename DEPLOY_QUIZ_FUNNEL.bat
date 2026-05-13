@echo off
REM ===================================================================
REM   DEPLOY_QUIZ_FUNNEL.bat  (2026-05-13)
REM   Ships the quiz-funnel v5 redesign (audit-quiz + thank-you) only.
REM   Modeled on DEPLOY_V5_FIX.bat — same lock-clean approach.
REM   Logs to DEPLOY_QUIZ_FUNNEL.log.
REM ===================================================================
cd /d "%~dp0"
set LOG=%~dp0DEPLOY_QUIZ_FUNNEL.log
echo. > "%LOG%"
echo [quiz funnel] Working in: %CD% >> "%LOG%" 2>&1
echo [quiz funnel] Working in: %CD%

REM Clean ALL stale locks
if exist ".git\index.lock"                       del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"                        del /f /q ".git\HEAD.lock"
if exist ".git\FETCH_HEAD.lock"                  del /f /q ".git\FETCH_HEAD.lock"
if exist ".git\refs\heads\main.lock"             del /f /q ".git\refs\heads\main.lock"
if exist ".git\refs\remotes\origin\main.lock"    del /f /q ".git\refs\remotes\origin\main.lock"
for /f "delims=" %%L in ('dir /b /s ".git\*.lock" 2^>nul') do (
  echo Removing stale lock: %%L>> "%LOG%" 2>&1
  del /f /q "%%L"
)

echo [quiz funnel] Fetching latest... >> "%LOG%" 2>&1
git fetch origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM Stage ONLY the two redesigned files + this deploy script
git add audit-quiz.html thank-you.html DEPLOY_QUIZ_FUNNEL.bat >> "%LOG%" 2>&1

echo [quiz funnel] About to commit: >> "%LOG%" 2>&1
git diff --cached --name-only >> "%LOG%" 2>&1

echo [quiz funnel] Committing... >> "%LOG%" 2>&1
git -c user.email="bgay3500@gmail.com" -c user.name="Brady Gay" commit -m "quiz funnel v5 redesign - 8Q audit + dual-mode thank-you (quiz-redesigned-2026-05-13)" >> "%LOG%" 2>&1

echo [quiz funnel] HEAD now: >> "%LOG%" 2>&1
git rev-parse HEAD >> "%LOG%" 2>&1
git rev-parse --short HEAD >> "%LOG%" 2>&1

echo [quiz funnel] Pushing origin main... >> "%LOG%" 2>&1
git push origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

echo [quiz funnel] SUCCESS. GitHub Pages will redeploy in 30-90s. >> "%LOG%" 2>&1
echo [quiz funnel] SUCCESS - see DEPLOY_QUIZ_FUNNEL.log
echo.
echo Done. Press any key to close...
pause >nul
exit /b 0

:fail
echo [quiz funnel] FAILED - see DEPLOY_QUIZ_FUNNEL.log >> "%LOG%" 2>&1
echo [quiz funnel] FAILED - see DEPLOY_QUIZ_FUNNEL.log
echo.
echo Press any key to close...
pause >nul
exit /b 1
