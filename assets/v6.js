/* Efficio v6 interactions — shared. scroll-progress, nav state, reveals, spotlight, live agents. All element lookups guarded. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* scroll progress + nav state */
  var bar=document.getElementById('scrollbar'), nav=document.getElementById('nav'), ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      var h=document.documentElement, max=(h.scrollHeight-h.clientHeight)||1;
      bar.style.width=(h.scrollTop/max*100)+'%';
      nav.classList.toggle('scrolled', h.scrollTop>20);
      ticking=false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* scroll reveal */
  var io = new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});

  /* spotlight cursor tracking on cards + price tiles */
  if(!reduce && window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.card,.price').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r=el.getBoundingClientRect();
        el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
        el.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
      });
    });
  }

  /* terminal engine (supports raw-HTML highlighted lines) */
  function Terminal(el, frames, opt){
    opt = opt || {};
    var loop = opt.loop !== false, pauseEnd = opt.pauseEnd || 2800, speed = opt.speed || 22;
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    function addLine(cls, html){var d=document.createElement('div');d.className='ln'+(cls?(' '+cls):'');d.innerHTML=html;el.appendChild(d);el.scrollTop=el.scrollHeight;return d;}
    function cursor(node){var c=document.createElement('span');c.className='cur';node.appendChild(c);return c;}
    function run(){
      el.innerHTML=''; var i=0;
      function next(){
        if(i>=frames.length){ if(loop){ setTimeout(run, pauseEnd); } return; }
        var f=frames[i++];
        if(f.do){ f.do(); }
        if(f.t==='sp'){ addLine('','&nbsp;'); setTimeout(next, 110); return; }
        if(f.t==='p'){
          var line=addLine('pr',''); var cur=cursor(line); var txt=f.s, k=0;
          (function tick(){
            if(k<=txt.length){ line.textContent=txt.slice(0,k); line.appendChild(cur); k++; setTimeout(tick, speed); }
            else { line.appendChild(cur); setTimeout(function(){ if(cur.parentNode)cur.parentNode.removeChild(cur); next(); }, f.after||320); }
          })();
          return;
        }
        addLine(f.c||'', f.html ? f.s : esc(f.s));
        setTimeout(next, f.after||(reduce?50:200));
      }
      next();
    }
    return {run:run};
  }

  /* hero session: provision -> connect -> operate, with status + progress */
  var heroStat=document.getElementById('heroStat'), heroProg=document.getElementById('heroProg');
  function setStat(el,txt,color){ if(!el) return;
    var lbl=el.querySelector('.lbl');
    if(!lbl){ el.innerHTML='<span class="pulse"></span><span class="lbl">'+txt+'</span>'; if(color) el.style.color=color; return; }
    if(reduce){ lbl.textContent=txt; if(color) el.style.color=color; return; }
    lbl.style.opacity='0';
    setTimeout(function(){ lbl.textContent=txt; if(color) el.style.color=color; lbl.style.opacity='1'; }, 190);
  }
  function prog(p){ if(heroProg) heroProg.style.width=p+'%'; }

  var heroFrames=[
    {t:'p', s:'efficio build --agent receptionist', do:function(){setStat(heroStat,'building','var(--violet-l)');prog(8);}},
    {t:'o', c:'cm',  s:'# provisioning Claude agent...', after:260},
    {t:'o', c:'ok',  s:'✓ workspace authenticated', do:function(){prog(22);}},
    {t:'o', c:'dim', s:'connecting servers...', do:function(){setStat(heroStat,'deploying','var(--cyan)');}},
    {t:'o', c:'ar',  s:'→ gmail        connected', do:function(){prog(38);}},
    {t:'o', c:'ar',  s:'→ calendar     connected', do:function(){prog(52);}},
    {t:'o', c:'ar',  s:'→ crm          connected', do:function(){prog(66);}},
    {t:'o', c:'ar',  s:'→ stripe       connected', do:function(){prog(80);}},
    {t:'o', c:'ok',  s:'✓ Claude agents online · 6', after:480, do:function(){prog(100);setStat(heroStat,'live','var(--green)');}},
    {t:'sp'},
    {t:'p', s:'# after-hours call · (305) 555-0148'},
    {t:'o', c:'ar',  s:'→ booking job · Thu 10:00 AM'},
    {t:'o', c:'ok',  s:'✓ confirmation texted · logged to CRM'},
    {t:'o', c:'ar',  s:'→ quote · Johnson · $3,180 sent'},
    {t:'o', c:'ok',  s:'✓ follow-up scheduled +2d', after:480},
    {t:'sp'},
    {t:'o', c:'lv',  s:'● all systems operational'}
  ];

  /* build section: watch a handler being written line-by-line, then deployed */
  var callStat=document.getElementById('callStat');
  var codeLines=[
    '<span class="kw">export</span> <span class="kw">async</span> <span class="kw">function</span> <span class="fn">onCall</span>(c) {',
    '  <span class="kw">const</span> slot = <span class="kw">await</span> <span class="fn">calendar.book</span>(c)',
    '  <span class="kw">await</span> <span class="fn">sms.send</span>(c.from, slot.<span class="fn">confirm</span>)',
    '  <span class="kw">await</span> <span class="fn">crm.log</span>({ lead: c, slot, src: <span class="st">&quot;after-hours&quot;</span> })',
    '  <span class="kw">return</span> { booked: <span class="nu">true</span>, at: slot.time }',
    '}'
  ];
  function buildCodegen(el){
    return { run:function run(){
      el.innerHTML=''; setStat(callStat,'writing','var(--violet-l)');
      var i=0;
      (function step(){
        if(i>=codeLines.length){
          var d=document.createElement('div'); d.className='ln ok'; d.style.marginTop='8px';
          d.innerHTML='✓ deployed to your stack · 1.2s';
          el.appendChild(d); setStat(callStat,'deployed','var(--green)');
          if(!reduce) setTimeout(run, 3400);
          return;
        }
        var row=document.createElement('div'); row.className='cgline';
        row.innerHTML='<span class="gut">'+(i+1)+'</span><span class="code">'+codeLines[i]+'</span>';
        el.appendChild(row); el.scrollTop=el.scrollHeight; i++;
        setTimeout(step, reduce?40:260);
      })();
    }};
  }

  /* Reveal a panel's scroll-reveal (.rv) ancestor so the container is never left invisible. */
  function revealPanel(el){ var r=el.closest('.rv'); if(r) r.classList.add('vis'); }
  /* Seed the hero terminal with visible lines immediately, so it is NEVER blank
     (even before the animation starts or if IntersectionObserver never fires). */
  function seedTerm(el){
    el.innerHTML='<div class="ln pr">efficio build --agent receptionist</div>'+
      '<div class="ln cm"># provisioning Claude agent...</div>'+
      '<div class="ln ok">\u2713 workspace authenticated</div>'+
      '<div class="ln ar">\u2192 gmail        connected</div>'+
      '<div class="ln ar">\u2192 calendar     connected</div>';
  }
  /* Seed the code-generator panel with the full handler immediately, so it is never blank. */
  function seedCodegen(el){
    var h=''; for(var i=0;i<codeLines.length;i++){
      h+='<div class="cgline"><span class="gut">'+(i+1)+'</span><span class="code">'+codeLines[i]+'</span></div>';
    }
    el.innerHTML=h;
  }
  function startOnView(elId, maker, seed){
    var el=document.getElementById(elId); if(!el) return;
    revealPanel(el);                 /* container visible right away */
    if(seed){ seed(el); }            /* paint visible content right away — never blank */
    var term=maker(el), started=false;
    function go(){ if(started) return; started=true; revealPanel(el); term.run(); }
    if(reduce){ go(); return; }
    /* Start when the panel scrolls into view (nice effect)... */
    var obs=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ go(); obs.disconnect(); }});},{threshold:.12, rootMargin:'0px 0px -6% 0px'});
    obs.observe(el.closest('.term')||el);
    /* ...but NEVER depend on it alone: a load fallback guarantees the animation runs
       (fixes blank above-the-fold / mobile panels where IO may not fire). */
    setTimeout(go, 900);
  }
  startOnView('termBody', function(el){ return Terminal(el, heroFrames, {loop:true, pauseEnd:3600, speed:20}); }, seedTerm);
  startOnView('callBody', function(el){ return buildCodegen(el); }, seedCodegen);

  /* chat sequential reveal */
  (function(){
    var body=document.getElementById('chatBody'); if(!body) return;
    var msgs=body.querySelectorAll('.cmsg');
    function play(){
      msgs.forEach(function(m,idx){ setTimeout(function(){ m.classList.add('show'); }, reduce?0:(idx*820+260)); });
    }
    var obs=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ play(); obs.disconnect(); }});},{threshold:.3});
    obs.observe(body);
  })();

  /* LIVE AGENTS popup */
  (function(){
    var tab=document.getElementById('loTab'),panel=document.getElementById('loPanel'),
        feed=document.getElementById('loFeed'),close=document.getElementById('loClose'),
        preview=document.getElementById('loPreview'),wrap=document.getElementById('liveops');
    if(!tab||!feed||!wrap) return;
    function setOpen(o){ wrap.classList.toggle('open',o); tab.setAttribute('aria-expanded',o?'true':'false');
      try{localStorage.setItem('efficio_liveops_open',o?'1':'0');}catch(e){} }
    tab.addEventListener('click',function(){setOpen(!wrap.classList.contains('open'));});
    close.addEventListener('click',function(e){e.stopPropagation();setOpen(false);});

    var POOL=[
     {ag:'AI Receptionist',    txt:'answered 3 inbound calls before staff arrived', meta:'calls captured'},
     {ag:'AI Sales Navigator', txt:'sent an itemized estimate in 11 sec',           meta:'time-to-quote'},
     {ag:'AI Office Manager',  txt:'sorted 41 messages, drafted 14, flagged 2 urgent', meta:'owner inbox time'},
     {ag:'AI Bookkeeper',      txt:'cleared $2,400 of overdue AR — 4 invoices paid', meta:'close-the-books speed'},
     {ag:'AI Receptionist',    txt:'filled a cancellation in 14 min',               meta:'calendar gap time'},
     {ag:'AI Office Manager',  txt:'sent a review request after a 5-star job',       meta:'review rate'},
     {ag:'AI Sales Navigator', txt:'rebooked an overdue customer worth $480',        meta:'reactivations / mo'},
     {ag:'AI Office Manager',  txt:'compiled tomorrow’s briefing in 6 lines',   meta:'morning prep time'},
     {ag:'AI Bookkeeper',      txt:'reconciled today’s Stripe + bank — $0 drift', meta:'reconciliation accuracy'},
     {ag:'AI Receptionist',    txt:'drafted a "running late" text — sent in 0.4s', meta:'comms latency'},
     {ag:'AI Marketing',       txt:'shipped a 3-email win-back campaign',            meta:'pipeline revived'},
     {ag:'AI Office Manager',  txt:'chased 4 outstanding documents — 3 came back', meta:'docs-returned rate'}
    ];
    var pi=0;
    function nowTime(){var d=new Date(),h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+(m<10?'0':'')+m+' '+ap;}
    function push(){
      var x=POOL[pi%POOL.length];pi++;
      var n=document.createElement('div');n.className='lo-item';
      n.innerHTML='<time>'+nowTime()+' &middot; '+x.meta+'</time><span class="ag">'+x.ag+'</span> '+x.txt;
      feed.insertBefore(n,feed.firstChild);
      while(feed.children.length>14) feed.removeChild(feed.lastChild);
      if(preview){ preview.style.opacity='0';
        setTimeout(function(){ preview.innerHTML='<span class="ag">'+x.ag+'</span> '+x.txt; preview.style.opacity='1'; }, reduce?0:200); }
    }
    for(var i=0;i<4;i++) push();
    if(!reduce){ setInterval(push,8000); }
    try{ setOpen(localStorage.getItem('efficio_liveops_open')==='1'); }catch(e){ setOpen(false); }
  })();
})();
