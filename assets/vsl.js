/* ============================================================================
   Efficio — VSL slide deck loader
   Drop-in: <div class="ef-vsl" id="efVsl"></div> on the page.
   Auto-advances 9 slides at ~10s each (~90s total narration).
   Manual prev/next + pause. Esc-to-pause.
   ============================================================================ */
(function () {
  var host = document.getElementById('efVsl');
  if (!host) return;
  if (window.__efVslLoaded) return;
  window.__efVslLoaded = true;

  if (!document.querySelector('link[href="/assets/vsl.css"]')) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/assets/vsl.css?v=20260927';
    document.head.appendChild(l);
  }

  var SLIDES = [
    { text: 'Your business runs on a dozen apps that don\'t talk to each other. <em>That\'s what we fix.</em>', cls: 'lead' },
    { text: 'Most AI tools hand you software to set up, connect and babysit yourself. Efficio is the done-for-you version.' },
    { text: 'We connect every app you run on to <em>one live CEO dashboard</em>: your CRM, QuickBooks, Stripe, Google or Microsoft 365 and the rest.', cls: 'lead' },
    { text: 'Then we put AI agents to work across them: follow-ups, client intake, invoices, scheduling, the phones and reporting.' },
    { text: 'Whatever the business needs next, a custom agent, a new integration or an automation, we build it.' },
    { text: 'You see all of it live on one dashboard: every app, every agent and your numbers.' },
    { text: 'You don\'t configure anything. <em>Your fractional AI CTO designs it, builds it and runs it.</em>' },
    { text: '<em>Live within 7 business days of kickoff</em>, or your $500 setup fee back.', cls: 'close' },
    { text: 'From $1,500 a month, plus a one-time $500 setup. On the call we look at how your business runs and tell you honestly whether it fits.', cls: 'close' }
  ];
  var DURATION = 10000;

  // Build DOM
  host.classList.add('ef-vsl');
  var frame = document.createElement('div');
  frame.className = 'ef-vsl-frame';
  SLIDES.forEach(function (s, i) {
    var d = document.createElement('div');
    d.className = 'ef-vsl-slide' + (s.cls ? ' ' + s.cls : '');
    d.innerHTML = '<p>' + s.text + '</p>';
    if (i === 0) d.classList.add('active');
    frame.appendChild(d);
  });
  host.appendChild(frame);

  var bar = document.createElement('div');
  bar.className = 'ef-vsl-bar';
  SLIDES.forEach(function (_, i) {
    var c = document.createElement('div');
    c.className = 'ef-vsl-bar-cell';
    if (i === 0) c.classList.add('live');
    c.style.animationDuration = DURATION + 'ms';
    bar.appendChild(c);
  });
  host.appendChild(bar);

  var controls = document.createElement('div');
  controls.className = 'ef-vsl-controls';
  controls.innerHTML =
    '<div class="ef-vsl-meta"><span class="dot"></span><span>90-sec walkthrough</span></div>' +
    '<div class="ef-vsl-buttons">' +
    '<button class="ef-vsl-btn" data-act="prev" aria-label="Previous slide">‹ Prev</button>' +
    '<button class="ef-vsl-btn pause" data-act="pause" aria-label="Pause">Pause</button>' +
    '<button class="ef-vsl-btn" data-act="next" aria-label="Next slide">Next ›</button>' +
    '</div>';
  host.appendChild(controls);

  var slides = host.querySelectorAll('.ef-vsl-slide');
  var cells = host.querySelectorAll('.ef-vsl-bar-cell');
  var idx = 0;
  var paused = false;
  var timer = null;

  function render() {
    slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
    cells.forEach(function (c, i) {
      c.classList.remove('done', 'live');
      if (i < idx) c.classList.add('done');
      else if (i === idx) c.classList.add('live');
    });
    cells[idx].style.animation = 'none';
    cells[idx].offsetWidth;
    cells[idx].style.animation = 'efVslFill ' + DURATION + 'ms linear forwards';
  }

  function advance() {
    if (paused) return;
    idx = (idx + 1) % SLIDES.length;
    render();
    timer = setTimeout(advance, DURATION);
  }

  function reset() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!paused) timer = setTimeout(advance, DURATION);
  }

  controls.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var act = btn.dataset.act;
    if (act === 'prev') { idx = (idx - 1 + SLIDES.length) % SLIDES.length; render(); reset(); }
    if (act === 'next') { idx = (idx + 1) % SLIDES.length; render(); reset(); }
    if (act === 'pause') {
      paused = !paused;
      btn.textContent = paused ? 'Play' : 'Pause';
      if (paused && timer) { clearTimeout(timer); timer = null; }
      else if (!paused) reset();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      paused = true;
      controls.querySelector('[data-act="pause"]').textContent = 'Play';
      if (timer) { clearTimeout(timer); timer = null; }
    }
  });

  // start
  timer = setTimeout(advance, DURATION);
})();
