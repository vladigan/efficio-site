@echo off
REM ===================================================================
REM   SHIP_STRIPE_LINKS.bat  (2026-05-13)
REM
REM   Ships the live Stripe Payment Link URLs to audit-quiz.html and
REM   thank-you.html. Preserves your WIP on those files via git stash.
REM
REM   Workflow:
REM     1. Stash any uncommitted edits to audit-quiz.html / thank-you.html
REM        so we don't bundle WIP into the Stripe-links commit.
REM     2. Apply stripe_links_2026-05-13.patch (clean 6-line diff against
REM        origin/main 27f447e).
REM     3. Commit + push origin/main.
REM     4. Pop the stash so your WIP returns to the working tree on top
REM        of the new commit.
REM     5. curl-verify that the live site is serving the new URLs.
REM
REM   This is idempotent: if the patch is already applied, step 2 will
REM   fail with "already applied" and the bat exits without committing.
REM ===================================================================

cd /d "%~dp0"
echo.
echo [ship-stripe] Working in: %CD%
echo.

REM 1. Clear stale git locks (OneDrive sync sometimes leaves these)
if exist ".git\index.lock"   del /f /q ".git\index.lock"
if exist ".git\HEAD.lock"    del /f /q ".git\HEAD.lock"
if exist ".git\config.lock"  del /f /q ".git\config.lock"

REM 2. Make sure local main is up to date with origin
git fetch origin main
REM Don't merge - apply patch on top of working tree

REM 3. Stash WIP on the two files (preserves your in-progress edits)
echo.
echo [ship-stripe] Stashing WIP on audit-quiz.html and thank-you.html...
git stash push -m "pre-stripe-links-ship-2026-05-13" -- audit-quiz.html thank-you.html

REM 4. Apply the Stripe-links patch
echo.
echo [ship-stripe] Applying stripe_links_2026-05-13.patch...
git apply --check stripe_links_2026-05-13.patch
if errorlevel 1 (
  echo [ship-stripe] Patch fails --check. Possibly already applied. Aborting.
  echo [ship-stripe] Restoring WIP from stash...
  git stash pop
  exit /b 1
)
git apply stripe_links_2026-05-13.patch

REM 5. Stage + commit
git add audit-quiz.html thank-you.html
git commit -m "stripe: wire live Payment Link URLs into audit-quiz + thank-you" -m "Replaces buy.stripe.com/placeholder-ai-{specialist,team,department} with the real Payment Links generated 2026-05-13 by scripts/stripe_setup_v2_paymentlinks.py. Quiz tier mapping and post-booking continue-now CTAs now route to live Stripe checkout. Webhook endpoint we_1TWcy9 -> https://webhook.efficio.tech/stripe/webhook registered with the 5 onboarding events; signing secret written to .env."

REM 6. Push
echo.
echo [ship-stripe] Pushing to origin/main...
git push origin main
if errorlevel 1 (
  echo [ship-stripe] Push failed. WIP still stashed - run 'git stash pop' when ready.
  exit /b 1
)

REM 7. Pop the WIP stash back onto the new HEAD
echo.
echo [ship-stripe] Restoring your WIP on top of the new commit...
git stash pop

REM 8. Verify via curl (give Netlify 30 seconds to rebuild)
echo.
echo [ship-stripe] Waiting 45s for Netlify to rebuild...
timeout /t 45 /nobreak
echo.
echo [ship-stripe] Verifying live site:
echo --- audit-quiz.html ---
curl -s https://efficio.tech/audit-quiz | findstr "28E14p3xb5TG 28E28taZD1Dq aFaeVf9Vzdm8"
echo --- thank-you.html ---
curl -s https://efficio.tech/thank-you | findstr "28E14p3xb5TG 28E28taZD1Dq aFaeVf9Vzdm8"
echo.
echo [ship-stripe] Done. If you see three URLs on each page, the deploy is live.
echo.
pause
