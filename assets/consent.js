/**
 * Efficio — cookie consent (shared, self-contained)
 * Drop-in:  <script src="/assets/consent.js" defer></script>
 *
 * One consistent first-visit consent banner on EVERY page. Fully self-styled
 * (injects its own <style>) so it renders identically whether a page loads
 * v6.css or theme.css — neither defined these styles, so the banner used to
 * appear unstyled on v6 pages. Guarded against double-init, so it safely
 * coexists with any legacy injector. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';
  function init() {
    try {
      if (document.getElementById('efficio-cookie')) return;            /* never double-inject */
      if (window.localStorage.getItem('efficio_cookie_ack')) return;    /* already decided      */
    } catch (e) { /* localStorage blocked — show once, don't persist */ }

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    /* self-contained styles (Quiet Authority palette, literal values) */
    if (!document.getElementById('efficio-cookie-css')) {
      var st = document.createElement('style');
      st.id = 'efficio-cookie-css';
      st.textContent =
        '#efficio-cookie{position:fixed;bottom:18px;left:18px;z-index:130;width:min(420px,calc(100vw - 36px));' +
        'display:flex;flex-direction:column;gap:12px;padding:16px 18px;border-radius:16px;' +
        "font-family:'Plus Jakarta Sans',-apple-system,Inter,system-ui,sans-serif;" +
        'background:rgba(13,13,23,.86);-webkit-backdrop-filter:blur(20px) saturate(150%);backdrop-filter:blur(20px) saturate(150%);' +
        'border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 60px -22px rgba(0,0,0,.85),0 0 0 1px rgba(124,77,255,.10);' +
        'opacity:0;transform:translateY(14px);transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}' +
        '#efficio-cookie.in{opacity:1;transform:none}' +
        '#efficio-cookie .ck-msg{font-size:13px;line-height:1.5;color:#c9c7da;font-weight:500}' +
        '#efficio-cookie .ck-msg a{color:#9a7bff;font-weight:600;text-decoration:none}' +
        '#efficio-cookie .ck-msg a:hover{text-decoration:underline}' +
        '#efficio-cookie .ck-row{display:flex;gap:9px;justify-content:flex-end}' +
        '#efficio-cookie button{cursor:pointer;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:-.01em;' +
        'padding:9px 16px;border-radius:999px;min-height:40px;transition:transform .12s ease,filter .2s ease,background .2s ease,border-color .2s ease}' +
        '#efficio-cookie button[data-action="reject"]{background:rgba(255,255,255,.03);color:#c9c7da;border:1px solid rgba(255,255,255,.13)}' +
        '#efficio-cookie button[data-action="reject"]:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.22)}' +
        '#efficio-cookie button.primary{color:#fff;border:1px solid rgba(124,77,255,.6);' +
        'background:linear-gradient(180deg,#9a7bff,#6a36f0);box-shadow:0 8px 20px -10px rgba(124,77,255,.85),inset 0 1px 0 rgba(255,255,255,.22)}' +
        '#efficio-cookie button.primary:hover{filter:brightness(1.07)}' +
        '#efficio-cookie button:active{transform:scale(.97)}' +
        '#efficio-cookie button:focus-visible{outline:2px solid #9a7bff;outline-offset:2px}' +
        '@media(max-width:520px){#efficio-cookie{left:12px;bottom:12px;width:calc(100vw - 24px)}}' +
        (reduce ? '#efficio-cookie{transition:none}' : '');
      document.head.appendChild(st);
    }

    var ck = document.createElement('div');
    ck.id = 'efficio-cookie';
    ck.setAttribute('role', 'region');
    ck.setAttribute('aria-label', 'Cookie notice');
    ck.innerHTML =
      '<div class="ck-msg">We use cookies to measure how the site performs and improve it. See our <a href="/privacy.html">privacy policy</a>.</div>' +
      '<div class="ck-row">' +
        '<button type="button" data-action="reject">Decline</button>' +
        '<button type="button" data-action="accept" class="primary">Got it</button>' +
      '</div>';
    document.body.appendChild(ck);
    window.setTimeout(function () { ck.classList.add('in'); }, reduce ? 0 : 900);

    ck.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      try { window.localStorage.setItem('efficio_cookie_ack', btn.getAttribute('data-action')); } catch (err) {}
      ck.classList.remove('in');
      window.setTimeout(function () { if (ck.parentNode) ck.parentNode.removeChild(ck); }, reduce ? 0 : 400);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
