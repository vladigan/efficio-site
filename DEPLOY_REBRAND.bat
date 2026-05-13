@echo off
cd /d "%~dp0"
set LOG=%~dp0DEPLOY_REBRAND.log

(
  echo === DEPLOY START: %DATE% %TIME% ===
  echo --- working dir ---
  cd
  echo.
  echo --- removing stale lock if any ---
  if exist ".git\index.lock" del /f /q ".git\index.lock"
  echo.
  echo --- HEAD before ---
  git log --oneline -1
  echo.
  echo --- staging ---
  git add -A
  echo.
  echo --- commit ---
  git commit -m "v3 rebrand: AI team not AI tool - canonical messaging across site, landings, ads, deck" -m "Aligns website with parent monorepo SHA 0d94bba."
  echo.
  echo --- push ---
  git push origin main
  echo.
  echo --- HEAD after ---
  git log --oneline -1
  echo.
  echo --- remote HEAD ---
  git ls-remote origin HEAD
  echo.
  echo === DEPLOY END: %DATE% %TIME% ===
) > "%LOG%" 2>&1

exit /b %ERRORLEVEL%
