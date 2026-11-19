/* Efficio booking box. Replaced the GoHighLevel calendar on 2026-11-19.
   THE ONE SETTING: paste Brady's Google Calendar booking-page link between the quotes.
   While it is empty, every booking box and "book" button falls back to email-to-book.
   - A calendar.google.com/calendar/appointments/schedules/... link shows the calendar inline.
   - Any other https link (for example calendar.app.google/...) opens in a new tab. */
var EFFICIO_BOOKING_URL = "";

(function () {
  "use strict";
  var EMAIL = "brady@efficio.tech";
  var MAILTO = "mailto:" + EMAIL +
    "?subject=" + encodeURIComponent("Book a call with Efficio") +
    "&body=" + encodeURIComponent("Hi Brady,\n\nWhat my business does:\nWhat I'd like automated:\nTwo or three times that work for me (with time zone):\n\nThanks!");

  function clean(u) {
    try { var x = new URL(String(u || "").trim()); return x.protocol === "https:" ? x.href : ""; }
    catch (e) { return ""; }
  }
  var url = clean(window.EFFICIO_BOOKING_URL);
  var inline = /^https:\/\/calendar\.google\.com\/calendar\/(u\/\d+\/)?appointments\/schedules\//.test(url);
  var frameSrc = inline ? url + (url.indexOf("?") < 0 ? "?" : "&") + "gv=true" : "";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function track(where) { try { gtag("event", "booking_click", { event_category: "funnel", event_label: where }); } catch (e) {} }

  function style() {
    if (document.getElementById("efb-css")) return;
    var s = document.createElement("style");
    s.id = "efb-css";
    s.textContent =
      ".efb-card{max-width:560px;margin:24px auto;padding:28px 24px;border-radius:14px;background:#fff;color:#1b1b29;text-align:center;font-size:15px;line-height:1.55}" +
      ".efb-card b{display:block;font-size:20px;font-weight:800;letter-spacing:-.01em;margin-bottom:8px;color:#1b1b29}" +
      ".efb-card p{margin:0 0 18px;color:#3a3a4d}" +
      ".efb-card p a,.efb-or a,.efb-alt a{color:#4a22c4;font-weight:600}" +
      ".efb-btn{display:inline-block;padding:13px 22px;border-radius:10px;background:#5e2ee0;color:#fff!important;font-weight:700;text-decoration:none}" +
      ".efb-btn:hover{background:#4a22c4}.efb-btn:focus-visible{outline:2px solid #5e2ee0;outline-offset:3px}" +
      ".efb-or{display:block;margin-top:12px;font-size:13px;color:#5b5b70}" +
      ".efb-frame{display:block;width:100%;min-width:300px;height:720px;border:0;border-radius:12px;background:#fff}" +
      ".efb-alt{text-align:center;font-size:13px;margin:10px 0 0}" +
      "@media (max-width:560px){.efb-frame{height:960px}}";
    document.head.appendChild(s);
  }

  function renderBox(host) {
    var where = host.getAttribute("data-efficio-booking") || location.pathname;
    if (frameSrc) {
      host.innerHTML =
        '<iframe class="efb-frame" src="' + esc(frameSrc) + '" title="Book a call with Efficio" loading="lazy"></iframe>' +
        '<p class="efb-alt">Calendar not loading? <a href="' + esc(url) + '" target="_blank" rel="noopener">Open it in a new tab</a> or email <a href="' + esc(MAILTO) + '">' + EMAIL + '</a>.</p>';
      return;
    }
    var card = url
      ? '<b>Pick a time that works for you.</b>' +
        '<p>A 30-minute Google Meet with Brady. We look at the tools your business runs on and tell you what we would automate first.</p>' +
        '<a class="efb-btn" href="' + esc(url) + '" target="_blank" rel="noopener">See open times &rarr;</a>' +
        '<span class="efb-or">or email <a href="' + esc(MAILTO) + '">' + EMAIL + '</a></span>'
      : '<b>Book a 30-minute call.</b>' +
        '<p>Email <a href="' + esc(MAILTO) + '">' + EMAIL + '</a> with what your business does and two or three times that suit you. Brady replies within one business day with a Google Meet invite.</p>' +
        '<a class="efb-btn" href="' + esc(MAILTO) + '">Email to book &rarr;</a>';
    host.innerHTML = '<div class="efb-card">' + card + '</div>';
    var a = host.querySelector(".efb-btn");
    if (a) a.addEventListener("click", function () { track(where); });
  }

  function wireLink(a) {
    a.setAttribute("href", url || MAILTO);
    if (url) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    a.innerHTML = (url ? "See open times" : "Email to book") + ' <span class="arr">&rarr;</span>';
    a.addEventListener("click", function () { track(a.id || "link"); });
  }

  function run() {
    var boxes = document.querySelectorAll("[data-efficio-booking]");
    if (boxes.length) style();
    for (var i = 0; i < boxes.length; i++) renderBox(boxes[i]);
    var links = document.querySelectorAll("a[data-efficio-book-link]");
    for (var j = 0; j < links.length; j++) wireLink(links[j]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
