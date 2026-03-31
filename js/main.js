/* ═══════════════════════════════════════════════════════════
   Efficio.tech — Main JS
   Scroll animations, FAQ, mobile menu, stat counters
   ═══════════════════════════════════════════════════════════ */

// ─── Scroll progress bar ─────────────────────────────────────
const scrollBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollBar) scrollBar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
}, { passive: true });

// ─── Scroll-based nav shadow ─────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ─── Mobile menu ─────────────────────────────────────────────
const toggle   = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

toggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = toggle.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    toggle.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  });
});

// ─── Fade-up animations ──────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings in same parent
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.fade-up'));
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, Math.min(idx * 80, 400));
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach(el => observer.observe(el));

// ─── Stat counters ───────────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  const start    = performance.now();
  const isLarge  = target > 999;

  const update = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease     = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(ease * target);
    el.textContent = isLarge ? current.toLocaleString() : current;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.getAttribute('data-target'), 10);
      animateCounter(el, target);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  statObserver.observe(el);
});

// ─── FAQ accordion ───────────────────────────────────────────
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item    = btn.closest('.faq-item');
    const isOpen  = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

    // Open clicked (unless it was already open)
    if (!isOpen) item.classList.add('open');
  });
});

// ─── Smooth scroll with nav offset ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 72;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ─── Form submission feedback ─────────────────────────────────
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled    = true;
    // Netlify handles the actual POST — this just improves UX
    // If not using Netlify, swap this out for your own backend
    setTimeout(() => {
      btn.textContent = '✓ Request Received — We\'ll reach out within a few hours';
      btn.style.background = '#10b981';
    }, 1200);
  });
}
