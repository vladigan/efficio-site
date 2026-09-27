/* Efficio v6 interactions — shared. scroll-progress, nav state, reveals, spotlight, mobile nav. All element lookups guarded. */
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

  /* mobile nav menu — additive hamburger (<=820px). Clones the page's own nav
     links + CTA so destinations are never hardcoded. Purely additive; the
     desktop nav is untouched. Accessible: aria-expanded, Esc, focus handling. */
  (function(){
    var nav=document.getElementById('nav'); if(!nav) return;
    var navIn=nav.querySelector('.nav-in'), mid=nav.querySelector('.nav-mid');
    if(!navIn||!mid) return;
    if(nav.querySelector('.nav-burger')) return; /* never double-init */
    var cta=null, kids=navIn.children, i;
    for(i=0;i<kids.length;i++){ if(kids[i].classList && kids[i].classList.contains('btn-primary')) cta=kids[i]; }

    var burger=document.createElement('button');
    burger.type='button'; burger.className='nav-burger';
    burger.setAttribute('aria-label','Open menu');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-controls','navMenu');
    burger.innerHTML='<span class="nb-lines" aria-hidden="true"><i></i><i></i><i></i></span>';

    var menu=document.createElement('div');
    menu.className='nav-menu'; menu.id='navMenu';
    menu.setAttribute('role','dialog'); menu.setAttribute('aria-label','Site menu');
    var as=mid.querySelectorAll('a'), c;
    for(i=0;i<as.length;i++){ c=as[i].cloneNode(true); c.className='nm-link'; menu.appendChild(c); }
    if(cta){ var cc=cta.cloneNode(true); cc.classList.add('nm-cta'); menu.appendChild(cc); }

    if(cta) navIn.insertBefore(burger, cta); else navIn.appendChild(burger);
    nav.appendChild(menu);

    var open=false;
    function foci(){ return menu.querySelectorAll('a,button'); }
    function setOpen(o){
      if(o===open) return; open=o;
      nav.classList.toggle('menu-open', o);
      burger.setAttribute('aria-expanded', o?'true':'false');
      burger.setAttribute('aria-label', o?'Close menu':'Open menu');
      if(o){
        var f=foci(); if(f.length) f[0].focus();
        document.addEventListener('keydown', onKey);
        document.addEventListener('click', onDoc, true);
      } else {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('click', onDoc, true);
        burger.focus();
      }
    }
    function onKey(e){
      if(e.key==='Escape'||e.keyCode===27){ e.preventDefault(); setOpen(false); return; }
      if(e.key==='Tab'){
        var f=foci(); if(!f.length) return;
        var first=f[0], last=f[f.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      }
    }
    function onDoc(e){ if(!nav.contains(e.target)) setOpen(false); }
    burger.addEventListener('click', function(){ setOpen(!open); });
    menu.addEventListener('click', function(e){ if(e.target.closest('a')) setOpen(false); });
    var mq=window.matchMedia('(min-width:821px)');
    function onMQ(){ if(mq.matches) setOpen(false); }
    if(mq.addEventListener) mq.addEventListener('change', onMQ);
    else if(mq.addListener) mq.addListener(onMQ);
  })();
})();
