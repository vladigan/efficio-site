@echo off
REM ===================================================================
REM   DEPLOY_3D_HOMEPAGE.bat
REM   One-click deploy of the 3D-rebuild homepage to GitHub Pages.
REM
REM   What it does:
REM     1. Removes the stale .git/index.lock left from a crashed git
REM     2. Resets the index (preserving working tree)
REM     3. Stages ONLY the two changed files (index.html + v2-legacy.html)
REM     4. Commits with the rebuild message
REM     5. Pushes to origin/main (GitHub Pages auto-redeploys)
REM ===================================================================

cd /d "%~dp0"
echo.
echo [efficio] Working in: %CD%
echo.

REM 1. Clear any stale locks
if exist ".git\index.lock"  del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"   del /f /q ".git\HEAD.lock"

REM 2. Reset index but keep working tree (preserves other uncommitted edits)
git reset HEAD >NUL 2>&1

REM 3. Stage only the two intentional changes
git add index.html v2-legacy.html

REM 4. Commit
git commit -m "homepage: rebuild as 3D dynamic experience" -m "Single-file rebuild with custom WebGL constellation, scroll-driven 5-stage scene transitions, kinetic typography, SVG-stroked loading wordmark, custom mix-blend cursor, magnetic-tilt cards, bento grid + live typing demo, conic gradient pricing border, CTA finale canvas, Lenis smooth scroll, 2D canvas mobile fallback. All canonical AI Team copy + tracking pixels preserved. Inspired by igloo.inc / lusion.co / arc.net / linear.app."

REM 5. Push
git push origin main

echo.
echo [efficio] Done. GitHub Pages will redeploy in 30-90s.
echo.
pause
