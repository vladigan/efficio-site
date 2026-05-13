@echo off
REM ===================================================================
REM   DEPLOY_V5_FIX.bat   (2026-05-13)
REM   Deploys three new customer-facing pages + index.html nav update:
REM     - onboarding-start.html   (Stripe success → 72-hour journey)
REM     - kickoff-form.html       (10-question intake form)
REM     - demo.html               (5-chapter v3-brand walkthrough)
REM     - index.html              ("Watch the demo" nav link added)
REM
REM   Pattern mirrors DEPLOY_3D_HOMEPAGE.bat.  Clears stale .git locks,
REM   stages only the intentional files, commits with a structured
REM   message, pushes to vladigan/efficio-site main.  GitHub Pages /
REM   Netlify auto-rebuilds.
REM ===================================================================

cd /d "%~dp0"
echo.
echo [efficio v5-fix] Working in: %CD%
echo.

REM 1. Clear stale git locks
if exist ".git\index.lock"  del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"   del /f /q ".git\HEAD.lock"
if exist ".git\index.lock.bak"  del /f /q ".git\index.lock.bak"
if exist ".git\index.lock.del"  del /f /q ".git\index.lock.del"
if exist ".git\index.lock.old"  del /f /q ".git\index.lock.old"
if exist ".git\index.lock.probe" del /f /q ".git\index.lock.probe"

REM 2. Reset index (preserves working tree)
git reset HEAD >NUL 2>&1

REM 3. Stage intentional files only
git add onboarding-start.html
git add kickoff-form.html
git add demo.html
git add index.html

REM 4. Commit
git commit -m "onboarding + demo: v3-brand customer surfaces" -m "Job B (post-payment onboarding): onboarding-start.html lands on Stripe success with animated constellation + 72-hour timeline + 3 action cards (Loom / Calendly / kickoff form). kickoff-form.html is the premium 10-question intake (business name, vertical x16, years, tools multi-select, pain points, team size, revenue band, 90-day goals, schedule pref, notes). Both pieces use v3 tokens (warm navy #0B1736, cream #F7F2EA, gold #D4A574, Newsreader display, Inter body)." -m "Job D (live demo): demo.html is a 5-chapter snap-scroll walkthrough Brady can drive on discovery calls. Chapters: inbound → 4.7-sec draft → Calendly + prep brief → Local SEO audit PDF flip → Command Center dashboard. Final magnetic gold CTA links /audit-quiz via page-transition veil. Mobile-responsive at 375px, ~80KB inline, CDN-only fonts." -m "index.html: added 'Watch the demo' link to the .ef-nav-links list. No changes to the Three.js hero scene, pricing copy, or brand tokens."

REM 5. Push to vladigan/efficio-site main
git push origin main

echo.
echo [efficio v5-fix] Done. Live deploy auto-rebuilds in 30-90s.
echo.
echo Verify in browser:
echo   https://efficio.tech/onboarding-start.html
echo   https://efficio.tech/kickoff-form.html
echo   https://efficio.tech/demo.html
echo.
pause
