@echo off
REM ===================================================================
REM   DEPLOY_VSL.bat
REM   Ships the new /vsl page + thank-you embed + index hero CTA.
REM   Modeled on DEPLOY_V5_FIX.bat — same lock-cleanup + push pattern.
REM   Logs everything to DEPLOY_VSL.log and pauses at end.
REM ===================================================================
cd /d "%~dp0"
set LOG=%~dp0DEPLOY_VSL.log
echo. > "%LOG%"
echo [efficio vsl] Working in: %CD% >> "%LOG%" 2>&1
echo [efficio vsl] Working in: %CD%

REM Clean ALL stale locks
if exist ".git\index.lock"            del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"             del /f /q ".git\HEAD.lock"
if exist ".git\FETCH_HEAD.lock"       del /f /q ".git\FETCH_HEAD.lock"
if exist ".git\refs\heads\main.lock"  del /f /q ".git\refs\heads\main.lock"
if exist ".git\refs\remotes\origin\main.lock" del /f /q ".git\refs\remotes\origin\main.lock"
for /f "delims=" %%L in ('dir /b /s ".git\*.lock" 2^>nul') do (
  echo Removing stale lock: %%L>> "%LOG%" 2>&1
  del /f /q "%%L"
)

echo [efficio vsl] Fetching latest... >> "%LOG%" 2>&1
git fetch origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM Stage only the VSL-related changes
echo [efficio vsl] Staging vsl.html / thank-you.html / index.html ... >> "%LOG%" 2>&1
git add vsl.html thank-you.html index.html DEPLOY_VSL.bat >> "%LOG%" 2>&1

echo [efficio vsl] Committing... >> "%LOG%" 2>&1
git commit -m "feat(vsl): 90-sec animated VSL at /vsl + thank-you embed + homepage hero CTA" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [efficio vsl] Commit returned non-zero. Will still attempt push. >> "%LOG%" 2>&1
)

echo [efficio vsl] HEAD now: >> "%LOG%" 2>&1
git rev-parse HEAD >> "%LOG%" 2>&1

echo [efficio vsl] Pushing origin main... >> "%LOG%" 2>&1
git push origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

echo [efficio vsl] SUCCESS. GitHub Pages will redeploy in 30-90s. >> "%LOG%" 2>&1
echo [efficio vsl] SUCCESS — see DEPLOY_VSL.log
echo.
echo Done. Press any key to close...
pause >nul
exit /b 0

:fail
echo [efficio vsl] FAILED — see DEPLOY_VSL.log >> "%LOG%" 2>&1
echo [efficio vsl] FAILED — see DEPLOY_VSL.log
echo.
echo Press any key to close...
pause >nul
exit /b 1
