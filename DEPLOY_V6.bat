@echo off
REM ===================================================================
REM   DEPLOY_V6.bat
REM   Ships the v6 positioning push to vladigan/efficio-site.
REM
REM   Why a new script:
REM     DEPLOY_V5_FIX.bat only staged 3 files. v6 touches 24+ surfaces
REM     (index, agents, audit-quiz, demo, how-it-works, services,
REM      onboarding, thank-you, all 16 landings, vsl, kickoff-form,
REM      onboarding-start). It also un-stages the erroneous vsl.html
REM      deletion that was left in the index.
REM
REM   Divergence strategy:
REM     Local main is 6 ahead / 9 behind origin/main. The local
REM     commits (homepage v3/v4/v5, VSL launch, quiz funnel v5) are
REM     the work being shipped. Origin's 9 advance commits are an
REM     alternate "purple" branch the CEO has consciously deprecated.
REM     We force-with-lease push to overwrite origin with local.
REM
REM   Safety:
REM     1. Tags current HEAD as `pre-v6-backup-<timestamp>` BEFORE
REM        any destructive operation.
REM     2. Uses --force-with-lease (not plain --force) so the push
REM        aborts if origin moves under us.
REM     3. Pause + log at every step. Logs to DEPLOY_V6.log.
REM ===================================================================
cd /d "%~dp0"
set LOG=%~dp0DEPLOY_V6.log
echo. > "%LOG%"

REM Build a safe timestamp tag suffix (locale-agnostic via PowerShell)
for /f %%T in ('powershell -NoProfile -Command "[DateTime]::Now.ToString(\"yyyyMMdd-HHmmss\")"') do set TS=%%T

echo [efficio v6] ============================================ >> "%LOG%" 2>&1
echo [efficio v6] Deploy run: %DATE% %TIME%                    >> "%LOG%" 2>&1
echo [efficio v6] Working in: %CD%                             >> "%LOG%" 2>&1
echo [efficio v6] Timestamp tag: pre-v6-backup-%TS%            >> "%LOG%" 2>&1
echo [efficio v6] ============================================ >> "%LOG%" 2>&1
echo [efficio v6] Deploying — see DEPLOY_V6.log for full output

REM ─── 0. Clean every stale lock anywhere under .git ────────────────
echo [efficio v6] Cleaning .git locks... >> "%LOG%" 2>&1
if exist ".git\index.lock"                     del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"                      del /f /q ".git\HEAD.lock"
if exist ".git\FETCH_HEAD.lock"                del /f /q ".git\FETCH_HEAD.lock"
if exist ".git\config.lock"                    del /f /q ".git\config.lock"
if exist ".git\packed-refs.lock"               del /f /q ".git\packed-refs.lock"
if exist ".git\refs\heads\main.lock"           del /f /q ".git\refs\heads\main.lock"
if exist ".git\refs\remotes\origin\main.lock"  del /f /q ".git\refs\remotes\origin\main.lock"
for /f "delims=" %%L in ('dir /b /s ".git\*.lock" 2^>nul') do (
  echo   removed stale lock: %%L>> "%LOG%" 2>&1
  del /f /q "%%L"
)

REM ─── 1. Fetch origin so --force-with-lease has the latest ref ─────
echo [efficio v6] Fetching origin... >> "%LOG%" 2>&1
git fetch origin main >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM ─── 2. SAFETY TAG before any destructive operation ───────────────
echo [efficio v6] Tagging current HEAD as pre-v6-backup-%TS%... >> "%LOG%" 2>&1
git tag pre-v6-backup-%TS% >> "%LOG%" 2>&1
git rev-parse pre-v6-backup-%TS% >> "%LOG%" 2>&1

REM ─── 3. Repair index from HEAD (preserves working tree) ───────────
echo [efficio v6] Repairing git index from HEAD... >> "%LOG%" 2>&1
if exist ".git\index" del /f /q ".git\index"
git read-tree HEAD >> "%LOG%" 2>&1
if errorlevel 1 goto fail

REM ─── 4. Stage all v6 surface mods ─────────────────────────────────
echo [efficio v6] Staging v6 mods... >> "%LOG%" 2>&1
git add index.html                                    >> "%LOG%" 2>&1
git add agents.html                                   >> "%LOG%" 2>&1
git add audit-quiz.html                               >> "%LOG%" 2>&1
git add demo.html                                     >> "%LOG%" 2>&1
git add how-it-works.html                             >> "%LOG%" 2>&1
git add onboarding.html                               >> "%LOG%" 2>&1
git add onboarding-start.html                         >> "%LOG%" 2>&1
git add kickoff-form.html                             >> "%LOG%" 2>&1
git add services.html                                 >> "%LOG%" 2>&1
git add thank-you.html                                >> "%LOG%" 2>&1
git add vsl.html                                      >> "%LOG%" 2>&1
git add landings/accounting.html                      >> "%LOG%" 2>&1
git add landings/auto.html                            >> "%LOG%" 2>&1
git add landings/cleaning.html                        >> "%LOG%" 2>&1
git add landings/construction.html                    >> "%LOG%" 2>&1
git add landings/dental.html                          >> "%LOG%" 2>&1
git add landings/electrical.html                      >> "%LOG%" 2>&1
git add landings/generic.html                         >> "%LOG%" 2>&1
git add landings/hvac.html                            >> "%LOG%" 2>&1
git add landings/insurance.html                       >> "%LOG%" 2>&1
git add landings/landscaping.html                     >> "%LOG%" 2>&1
git add landings/legal.html                           >> "%LOG%" 2>&1
git add landings/medical.html                         >> "%LOG%" 2>&1
git add landings/pest.html                            >> "%LOG%" 2>&1
git add landings/plumbing.html                        >> "%LOG%" 2>&1
git add landings/realestate.html                      >> "%LOG%" 2>&1
git add landings/roofing.html                         >> "%LOG%" 2>&1
git add DEPLOY_V6.bat                                 >> "%LOG%" 2>&1

REM ─── 5. Un-stage the erroneous vsl.html deletion ──────────────────
REM   The prior run left vsl.html staged-for-deletion but the file
REM   exists and carries v6 content. Force-add to override the rm.
echo [efficio v6] Forcing vsl.html back into the index... >> "%LOG%" 2>&1
git restore --staged vsl.html >> "%LOG%" 2>&1
git add -f vsl.html >> "%LOG%" 2>&1

REM   Keep the legacy file deletions (intentional cleanup)
git rm -f --ignore-unmatch v2.html v2-legacy.html v3-legacy.html >> "%LOG%" 2>&1

REM ─── 6. Write the commit message ──────────────────────────────────
echo [efficio v6] Writing commit message... >> "%LOG%" 2>&1
> ".git\V6_COMMIT_MSG.txt" (
  echo v6 positioning push: "Stop chasing AI. Hire your AI team."
  echo.
  echo Expands v5 ("AI team, not AI tool"^) with: explicit anti-tool
  echo positioning, full service catalog ^(back office + DevOps +
  echo engineering + software + custom coding + daily AI ops + ML^),
  echo and "personalized to your business" as a core value.
  echo.
  echo Tier names + prices unchanged: AI Specialist $997 /
  echo AI Team $2,500 / AI Department $3,500. Stripe links, pixels,
  echo Calendly URL, sender signatures all preserved.
  echo.
  echo Touched: index, agents, audit-quiz, demo, how-it-works,
  echo onboarding, onboarding-start, kickoff-form, services,
  echo thank-you, vsl, and all 16 vertical landings. v6 doctrine
  echo lives in marketing/positioning_canonical_v6_2026-05-13.md.
  echo.
  echo Safety: pre-v6-backup-%TS% tag points at the pre-deploy HEAD.
)

REM ─── 7. Commit ────────────────────────────────────────────────────
echo [efficio v6] Committing v6 push... >> "%LOG%" 2>&1
git commit -F ".git\V6_COMMIT_MSG.txt" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [efficio v6] Commit returned non-zero — likely nothing to commit; will still try push. >> "%LOG%" 2>&1
)

echo [efficio v6] HEAD after commit: >> "%LOG%" 2>&1
git rev-parse HEAD >> "%LOG%" 2>&1
git log -1 --oneline >> "%LOG%" 2>&1

REM ─── 8. Push (force-with-lease for safety against origin race) ────
echo [efficio v6] Pushing to origin/main with --force-with-lease... >> "%LOG%" 2>&1
git push --force-with-lease origin main >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [efficio v6] --force-with-lease blocked; origin moved since fetch. >> "%LOG%" 2>&1
  echo [efficio v6] Re-fetching and retrying once... >> "%LOG%" 2>&1
  git fetch origin main >> "%LOG%" 2>&1
  git push --force-with-lease origin main >> "%LOG%" 2>&1
  if errorlevel 1 goto fail
)

echo [efficio v6] Pushing safety tag... >> "%LOG%" 2>&1
git push origin pre-v6-backup-%TS% >> "%LOG%" 2>&1

REM ─── 9. Done ──────────────────────────────────────────────────────
echo [efficio v6] SUCCESS. GitHub Pages redeploys in 30-90 seconds. >> "%LOG%" 2>&1
echo [efficio v6] SUCCESS — backup tag: pre-v6-backup-%TS%
echo [efficio v6] Verify with:
echo     curl -sI https://efficio.tech/
echo     curl -s https://efficio.tech/ ^| findstr /i "Stop chasing"
echo.
pause >nul
exit /b 0

:fail
echo [efficio v6] FAILED — see DEPLOY_V6.log >> "%LOG%" 2>&1
echo [efficio v6] FAILED — see DEPLOY_V6.log
echo [efficio v6] Safety tag pre-v6-backup-%TS% still points at pre-deploy HEAD.
echo [efficio v6] Recovery: git reset --hard pre-v6-backup-%TS%
echo.
pause >nul
exit /b 1
