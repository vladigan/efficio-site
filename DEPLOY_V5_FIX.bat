@echo off
REM ===================================================================
REM   DEPLOY_V5_FIX.bat
REM   Retry of DEPLOY_V5.bat — also cleans .git\refs\heads\*.lock
REM   which the original missed and which blocked the commit.
REM   Logs everything to DEPLOY_V5.log and pauses at end.
REM ===================================================================
cd /d "%~dp0"
set LOG=%~dp0DEPLOY_V5.log
echo. > "%LOG%"
echo [efficio v5 fix] Working in: %CD% >> "%LOG%" 2>&1
echo [efficio v5 fix] Working in: %CD%

REM Clean ALL stale locks (including the main.lock that blocked the first run)
if exist ".git\index.lock"            del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"             del /f /q ".git\HEAD.lock"
if exist ".git\FETCH_HEAD.lock"       del /f /q ".git\FETCH_HEAD.lock"
if exist ".git\refs\heads\main.lock"  del /f /q ".git\refs\heads\main.lock"
if exist ".git\refs\remotes\origin\main.lock" del /f /q ".git\refs\remotes\origin\main.lock"
for /f "delims=" %%L in ('dir /b /s ".git\*.lock" 2^>nul') do (
  echo Removing stale lock: %%L>> "%LOG%" 2>&1
  del /f /q "%%L"
)

echo [efficio v5 fix] Fetching latest... >> "%LOG%" 2>&1
git fetch origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM Repair index from HEAD (preserves working tree)
echo [efficio v5 fix] Repairing git index from HEAD... >> "%LOG%" 2>&1
if exist ".git\index" del /f /q ".git\index"
git read-tree HEAD >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM Stage v5 files
git add index.html DEPLOY_V5.bat DEPLOY_V5_FIX.bat >> "%LOG%" 2>&1
REM v5 also removes why-us.html (replaced by inline sections)
git rm -f why-us.html >> "%LOG%" 2>&1

echo [efficio v5 fix] Committing using UTF-8 message file... >> "%LOG%" 2>&1
git commit -F ".git\V5_COMMIT_MSG.txt" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [efficio v5 fix] Commit returned non-zero. Will still attempt push. >> "%LOG%" 2>&1
)

echo [efficio v5 fix] HEAD now: >> "%LOG%" 2>&1
git rev-parse HEAD >> "%LOG%" 2>&1

echo [efficio v5 fix] Pushing origin main... >> "%LOG%" 2>&1
git push origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

echo [efficio v5 fix] SUCCESS. GitHub Pages will redeploy in 30-90s. >> "%LOG%" 2>&1
echo [efficio v5 fix] SUCCESS — see DEPLOY_V5.log
echo.
echo Done. Press any key to close...
pause >nul
exit /b 0

:fail
echo [efficio v5 fix] FAILED — see DEPLOY_V5.log >> "%LOG%" 2>&1
echo [efficio v5 fix] FAILED — see DEPLOY_V5.log
echo.
echo Press any key to close...
pause >nul
exit /b 1
