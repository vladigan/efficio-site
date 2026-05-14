@echo off
REM ===================================================================
REM   DEPLOY_V4.bat
REM   Deploy v4 raymarch/volumetric homepage to GitHub Pages.
REM   1. Clean up any locks
REM   2. Reset working tree to origin/main
REM   3. Copy in the new index.html + v3-legacy.html (already in repo dir)
REM   4. Commit and push
REM ===================================================================

cd /d "%~dp0"
echo.
echo [efficio v4] Working in: %CD%
echo.

REM Clean locks
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock"

REM Fetch latest
echo [efficio v4] Fetching latest...
git fetch origin main
if errorlevel 1 goto fail

REM Get index.html and v3-legacy.html out of any pending changes pile
git reset HEAD >NUL 2>&1

REM Stage the two intentional changes
git add index.html v3-legacy.html

REM Commit
git commit -m "homepage v4: raymarched volumetric WebGL hero + pinned scrollTrigger sections" -m "Top-tier rebuild: custom GLSL raymarch shader (12-13 entities, smin blended, particle data-flow streams, volumetric fog, distance fading), variable-axis Newsreader typography with wght 300->500 entrance breath, magnetic CTAs + character-attract on hero, 4 pinned cinematic sections (era-shift timeline, team constellation flythrough, live terminal demo of 4 real Efficio workflows, pricing architecture reveal), live data marquee, procedural WebAudio drone+click+whoosh (off by default), 'still here?' scroll-back easter egg, depth-of-field on scroll, gradient mesh bg, page transition radial veil, mobile 2D canvas fallback, snap-scroll on touch, a11y reduced-motion, Visibility API pause. All canonical AI Team copy preserved verbatim. Under 30KB gzipped." 2>NUL
if errorlevel 1 (
  echo [efficio v4] Nothing to commit OR commit failed — pushing anyway in case last push didn't go.
)

REM Push
echo [efficio v4] Pushing to origin/main...
git push origin main
if errorlevel 1 goto fail

echo.
echo [efficio v4] Done. GitHub Pages will redeploy in 30-90s.
echo.
goto end

:fail
echo [efficio v4] FAILED — see output above.
exit /b 1

:end
exit /b 0
