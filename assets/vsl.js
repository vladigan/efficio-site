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
    l.href = '/assets/vsl.css';
    document.head.appendChild(l);
  }

  var SLIDES = [
    { text: 'If you\'re running a <em>$500K–$5M service business</em> and spending 15 hours a week on admin work you hate, watch this.', cls: 'lead' },
    { text: 'Most agencies sell you software you have to learn. Or AI tools you have to figure out. Or "training" that ends up being <em>your problem</em> to implement.' },
    { text: 'Efficio is different. We\'re your <em>AI team.</em> Not your AI software vendor.', cls: 'lead' },
    { text: 'You give us read-only access to your existing tools — Stripe, QuickBooks, your CRM, your ad accounts. We do the rest.' },
    { text: 'We run an audit, find where you\'re leaking money or time, and build the AI agents that fix it. You watch the work happen in your live dashboard.' },
    { text: 'Front-desk agent answering calls before they hit voicemail. Quote agent turning hours into minutes. Workflow optimizer owning your handoffs. Inbox triage clearing your owner inbox.' },
    { text: 'You don\'t learn AI. You don\'t pick tools. You don\'t manage anything. <em>We do it. You operate.</em>' },
    { text: '<em>First agent live in 7 days.</em> If we miss day 7, the month is on us.', cls: 'close' },
    { text: 'Book your free audit call below. 30 minutes. No pitch — just a real look at what\'s eating your time and how we\'d fix it.', cls: 'close' }
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
