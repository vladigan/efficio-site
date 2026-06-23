/* ============================================================================
   Efficio — floating AI chat widget loader
   - Injects HTML + chat.css on every page that loads this script
   - POSTs to /.netlify/functions/chat for live AI replies
   - Falls back to email-capture if the function is unreachable
   ============================================================================ */
(function () {
  if (window.__efchatLoaded) return;
  window.__efchatLoaded = true;

  // -----------------------------------------------------------------------
  // BACKEND ENDPOINT — set this after deploying the Cloudflare Worker.
  // Run `wrangler deploy` inside Efficio/cloudflare-chat/ — the CLI prints the URL.
  // Paste it here, then push the change to GitHub.
  // -----------------------------------------------------------------------
  var CHAT_ENDPOINT = window.EFCHAT_ENDPOINT
    || 'https://efficio-chat.bgay3500.workers.dev';

  // --- inject CSS ---------------------------------------------------------
  if (!document.querySelector('link[href="/assets/chat.css"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/chat.css';
    document.head.appendChild(link);
  }

  // --- inject HTML --------------------------------------------------------
  var root = document.createElement('div');
  root.id = 'efchat-root';
  root.innerHTML = ''
    + '<button id="efchat-btn" aria-label="Open chat" title="Chat with the AI team">'
    +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    +   '<span class="efchat-dot"></span>'
    + '</button>'
    + '<div id="efchat-panel" role="dialog" aria-label="Efficio AI chat">'
    +   '<div id="efchat-head">'
    +     '<div class="efchat-avatar">E</div>'
    +     '<div class="efchat-meta">'
    +       '<div class="efchat-name">Efficio AI</div>'
    +       '<div class="efchat-status">Online · usually replies instantly</div>'
    +     '</div>'
    +     '<button id="efchat-close" aria-label="Close">'
    +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
    +     '</button>'
    +   '</div>'
    +   '<div id="efchat-body"></div>'
    +   '<div id="efchat-foot">'
    +     '<textarea id="efchat-input" rows="1" placeholder="Ask anything — pricing, what we build, fit for your business..." aria-label="Type your message"></textarea>'
    +     '<button id="efchat-send" aria-label="Send" disabled>'
    +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
    +     '</button>'
    +   '</div>'
    + '</div>';
  document.body.appendChild(root);

  var btn   = document.getElementById('efchat-btn');
  var panel = document.getElementById('efchat-panel');
  var close = document.getElementById('efchat-close');
  var body  = document.getElementById('efchat-body');
  var input = document.getElementById('efchat-input');
  var send  = document.getElementById('efchat-send');

  var history = [];      // [{role:'user'|'assistant', content:'...'}]
  var sending = false;
  var opened  = false;

  // --- helpers ------------------------------------------------------------
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function linkify(s) {
    return escapeHTML(s)
      .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }
  function appendMsg(role, text) {
    var div = document.createElement('div');
    div.className = 'efchat-msg ' + role;
    div.innerHTML = linkify(text);
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function showTyping() {
    var t = document.createElement('div');
    t.className = 'efchat-typing';
    t.id = 'efchat-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() {
    var t = document.getElementById('efchat-typing');
    if (t) t.remove();
  }
  function appendQuick(options) {
    var wrap = document.createElement('div');
    wrap.className = 'efchat-quick';
    options.forEach(function (opt) {
      var b = document.createElement('button');
      b.textContent = opt;
      b.addEventListener('click', function () {
        wrap.remove();
        input.value = opt;
        sendMessage();
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  // --- greeting on first open --------------------------------------------
  function greet() {
    appendMsg('bot',
      "Hey — I'm Efficio's AI assistant. I can answer anything about how we work, what we build, pricing, or whether we're a fit for your business. What's on your mind?");
    appendQuick([
      "What do you actually do?",
      "How much does it cost?",
      "Is this a fit for my business?",
      "Book a call"
    ]);
  }

  // --- send ---------------------------------------------------------------
  function setSendState() {
    var has = input.value.trim().length > 0 && !sending;
    send.disabled = !has;
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text || sending) return;

    appendMsg('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';
    sending = true;
    setSendState();
    showTyping();

    fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(0, -1),  // prior turns
        page: location.pathname,
        referrer: document.referrer || null
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (data) {
        hideTyping();
        var reply = (data && data.reply) || "Sorry, I had trouble reaching my brain. Can you try again, or just email brady@efficio.tech?";
        appendMsg('bot', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function () {
        hideTyping();
        appendMsg('bot',
          "I can't reach my brain right now. Two ways forward:\n\n" +
          "1. Email brady@efficio.tech with your question — he answers personally.\n" +
          "2. Book a 15-min call: https://api.leadconnectorhq.com/widget/booking/HS90f7YhCSn6J6nB6j9T");
      })
      .finally(function () {
        sending = false;
        setSendState();
      });
  }

  // --- events -------------------------------------------------------------
  btn.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !opened) {
      opened = true;
      setTimeout(greet, 350);
    }
    if (panel.classList.contains('open')) {
      setTimeout(function () { input.focus(); }, 250);
    }
  });
  close.addEventListener('click', function () { panel.classList.remove('open'); });

  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    setSendState();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  send.addEventListener('click', sendMessage);

  // close on Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
    }
  });
})();
