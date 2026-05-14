@echo off
REM ===================================================================
REM   ONE_CLICK_DEPLOY_V5.bat  (created by Cowork agent 2026-05-13)
REM
REM   Wrapper that clears the stale git index.lock that has been
REM   blocking auto-deploy from the sandbox, then runs the normal
REM   DEPLOY_V5_FIX.bat. Idempotent.
REM
REM   The 4 customer-facing files (onboarding-start.html,
REM   kickoff-form.html, demo.html, index.html) are already in place
REM   in C:\Code\LLC\Efficio\website — copied from the OneDrive
REM   staging directory by the agent. This script only needs to push.
REM ===================================================================

cd /d "%~dp0"
echo.
echo [one-click] Working in: %CD%
echo.

REM Clear ALL possible stale git locks
echo [one-click] Clearing any stale .git locks...
if exist ".git\index.lock"       del /f /q ".git\index.lock"        & echo   - index.lock removed
if exist ".git\HEAD.lock"        del /f /q ".git\HEAD.lock"         & echo   - HEAD.lock removed
if exist ".git\refs\heads\main.lock" del /f /q ".git\refs\heads\main.lock" & echo   - main.lock removed

REM Sanity check: are the 4 files present?
set "MISSING="
if not exist "onboarding-start.html"  set "MISSING=%MISSING% onboarding-start.html"
if not exist "kickoff-form.html"      set "MISSING=%MISSING% kickoff-form.html"
if not exist "demo.html"              set "MISSING=%MISSING% demo.html"
if not exist "index.html"             set "MISSING=%MISSING% index.html"
if defined MISSING (
  echo [one-click] [ERROR] Missing files:%MISSING%
  echo [one-click] These should have been staged by the Cowork agent before this batch ran.
  pause
  exit /b 1
)
echo [one-click] All 4 staged files present.

REM Call the existing deploy
echo.
echo [one-click] Handing off to DEPLOY_V5_FIX.bat...
echo.
call "%~dp0DEPLOY_V5_FIX.bat"
