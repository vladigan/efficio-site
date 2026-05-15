"""One-shot blog builder. Reads marketing/posts/blog/*.md, writes website/blog/*.html + index.html."""
import os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.normpath(os.path.join(ROOT, "..", "marketing", "posts", "blog"))
OUT  = os.path.join(ROOT, "blog")
os.makedirs(OUT, exist_ok=True)

VLABEL = {"hvac":"HVAC contractors","law":"Law firms","dental":"Dental practices","real_estate":"Real estate teams"}
MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

def esc_inline(s):
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: '<a href="'+m.group(2)+'">'+m.group(1)+'</a>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return s

def md2html(s):
    out, in_p = [], False
    for raw in s.split("\n"):
        line = raw.rstrip()
        if not line.strip():
            if in_p: out.append("</p>"); in_p = False
            continue
        if line.startswith("## "):
            if in_p: out.append("</p>"); in_p = False
            out.append("<h2>"+esc_inline(line[3:].strip())+"</h2>")
        elif line.startswith("# "):
            if in_p: out.append("</p>"); in_p = False
        elif line.startswith("**") and line.endswith("**") and line.count("**") == 2:
            if in_p: out.append("</p>"); in_p = False
            out.append('<p class="faq-q-line">'+esc_inline(line)+'</p>')
        else:
            if not in_p: out.append("<p>"); in_p = True
            else: out.append(" ")
            out.append(esc_inline(line))
    if in_p: out.append("</p>")
    return "".join(out)

def parse_front(text):
    m = re.match(r'---\s*\n(.*?)\n---\s*\n(.*)', text, re.S)
    if not m: return {}, text
    fm = {}
    for line in m.group(1).split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"')
    return fm, m.group(2)

NAV = '''<nav class="nav" id="nav"><div class="nav-inner">
  <a href="/" class="logo"><span class="logo-mark">E</span><span class="logo-text">Efficio</span></a>
  <div class="nav-links">
    <a href="/services.html">Services</a>
    <a href="/demo/" target="_blank" rel="noopener">Live demo</a>
    <a href="/blog/">Blog</a>
    <a href="/pricing.html">Pricing</a>
    <a href="/why-us.html">Why us</a>
    <a href="/book.html" class="btn-nav" target="_blank" rel="noopener">Book a call</a>
  </div>
</div></nav>'''

FOOTER = '''<footer>
  <div class="foot-grid">
    <div class="foot-brand"><div class="logo"><span class="logo-mark">E</span><span class="logo-text">Efficio</span></div>
      <p>Your contracted AI team &mdash; at your disposal.</p></div>
    <div class="foot-col"><h5>Product</h5><a href="/services.html">Services</a><a href="/demo/">Live demo</a><a href="/pricing.html">Pricing</a></div>
    <div class="foot-col"><h5>Company</h5><a href="/why-us.html">Why us</a><a href="/blog/">Blog</a><a href="mailto:brady@efficio.tech">brady@efficio.tech</a></div>
    <div class="foot-col"><h5>Legal</h5><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a></div>
  </div>
  <div class="foot-bottom"><div>&copy; 2026 Efficio &middot; BNG Contracting Enterprise LLC &middot; Miami, FL</div></div>
</footer>'''

ARTICLE_CSS = '''<style>
.art-shell{max-width:760px;margin:0 auto;padding:130px 24px 90px}
.art-crumb{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:24px}
.art-crumb a{color:var(--purple3)}.art-crumb a:hover{color:var(--white)}
.art-vert{display:inline-block;font-size:10.5px;color:var(--purple3);background:rgba(124,58,237,.13);
  border:1px solid var(--bd2);padding:5px 11px;border-radius:99px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;margin-bottom:22px}
.art h1{font-size:clamp(2rem,4.2vw,3rem);font-weight:900;color:var(--white);letter-spacing:-.04em;
  line-height:1.07;margin-bottom:18px}
.art-meta{font-size:12.5px;color:var(--muted);margin-bottom:50px;padding-bottom:24px;border-bottom:1px solid var(--bd)}
.art-body{font-size:1.06rem;color:var(--text);line-height:1.78}
.art-body h2{font-size:1.55rem;font-weight:800;color:var(--white);letter-spacing:-.025em;
  margin:46px 0 16px;line-height:1.25}
.art-body p{margin-bottom:22px}
.art-body strong{color:var(--w2);font-weight:700}
.art-body a{color:var(--purple3);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(183,148,246,.3)}
.art-body a:hover{color:var(--white);border-bottom-color:var(--white)}
.art-body .faq-q-line{margin-top:28px;margin-bottom:8px;color:var(--white);font-weight:700}
.art-cta{margin-top:54px;padding:30px 28px;background:var(--surf);border:1px solid var(--purple);
  border-radius:var(--r2);text-align:center}
.art-cta h3{font-size:1.2rem;font-weight:800;color:var(--white);margin-bottom:8px;letter-spacing:-.02em}
.art-cta p{font-size:14px;color:var(--text);margin-bottom:18px}
.art-cta a{display:inline-block;background:var(--purple);color:#fff;font-weight:700;font-size:13.5px;
  padding:12px 22px;border-radius:var(--r);margin:0 4px;text-decoration:none}
.art-cta a.ghost{background:transparent;border:1px solid var(--bd2);color:var(--w2)}
.art-cta a:hover{background:var(--purple2);transform:translateY(-1px)}
.art-cta a.ghost:hover{border-color:var(--white);color:var(--white);background:transparent}
</style>'''

INDEX_CSS = '''<style>
.bl-shell{max-width:1100px;margin:0 auto;padding:130px 24px 90px}
.bl-head{margin-bottom:48px;max-width:680px}
.bl-head .label{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--purple3);margin-bottom:14px}
.bl-head h1{font-size:clamp(2.2rem,4.5vw,3.2rem);font-weight:900;color:var(--white);letter-spacing:-.04em;line-height:1.05;margin-bottom:14px}
.bl-head h1 em{font-style:normal;color:var(--purple2)}
.bl-head p{font-size:1.05rem;color:var(--text);line-height:1.6}
.bl-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:760px){.bl-grid{grid-template-columns:1fr}}
.bl-card{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r2);padding:30px 28px;
  display:block;text-decoration:none;color:inherit;transition:.18s;position:relative;overflow:hidden}
.bl-card:hover{border-color:var(--purple);transform:translateY(-3px)}
.bl-card::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 100% 0%,rgba(124,58,237,.12),transparent 60%);opacity:0;transition:.25s;pointer-events:none}
.bl-card:hover::after{opacity:1}
.bl-vert{display:inline-block;font-size:10.5px;color:var(--purple3);background:rgba(124,58,237,.13);
  border:1px solid var(--bd2);padding:4px 10px;border-radius:99px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;margin-bottom:14px;position:relative;z-index:1}
.bl-card h2{font-size:1.25rem;font-weight:800;color:var(--white);letter-spacing:-.025em;
  line-height:1.3;margin-bottom:12px;position:relative;z-index:1}
.bl-card p{font-size:13.5px;color:var(--text);line-height:1.6;margin-bottom:16px;position:relative;z-index:1}
.bl-meta{font-size:11.5px;color:var(--muted);font-weight:700;letter-spacing:.04em;position:relative;z-index:1}
.bl-card:hover .bl-meta{color:var(--purple3)}
</style>'''

ART_TPL = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script src="/assets/pixels.js"></script>
<title>{TITLE} | Efficio</title>
<meta name="description" content="{DESC}"/>
<link rel="canonical" href="https://efficio.tech/blog/{SLUG}.html"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="https://efficio.tech/blog/{SLUG}.html"/>
<meta property="og:title" content="{TITLE}"/>
<meta property="og:description" content="{DESC}"/>
<meta property="og:image" content="https://efficio.tech/og-image.svg"/>
<meta property="og:site_name" content="Efficio"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{TITLE}"/>
<meta name="twitter:description" content="{DESC}"/>
<meta name="twitter:image" content="https://efficio.tech/og-image.svg"/>
<script type="application/ld+json">{LD}</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/assets/theme.css"/>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c3aed'/><rect x='28' y='25' width='44' height='13' rx='4' fill='%23fff'/><rect x='28' y='43.5' width='30' height='13' rx='4' fill='%23fff'/><rect x='28' y='62' width='44' height='13' rx='4' fill='%23fff'/></svg>"/>
__ARTICLE_CSS__
</head>
<body>
__NAV__
<article class="art-shell art">
  <div class="art-crumb"><a href="/">Home</a> &middot; <a href="/blog/">Blog</a> &middot; {VLABEL}</div>
  <span class="art-vert">{VLABEL}</span>
  <h1>{TITLE}</h1>
  <div class="art-meta">Brady Gay &middot; {DATE_HUMAN} &middot; ~{MINUTES} min read</div>
  <div class="art-body">{BODY}</div>
  <div class="art-cta">
    <h3>Want this running in your business?</h3>
    <p>See the live demo dashboard a client gets, or book a 15-min call.</p>
    <a href="/demo/" target="_blank" rel="noopener">Open the live demo &rarr;</a>
    <a class="ghost" href="/book.html" target="_blank" rel="noopener">Book a 15-min call</a>
  </div>
</article>
__FOOTER__
<script src="/assets/transitions.js" defer></script>
</body>
</html>
'''

INDEX_TPL = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script src="/assets/pixels.js"></script>
<title>Blog &mdash; practical AI for service businesses | Efficio</title>
<meta name="description" content="Practical writing on AI for service businesses &mdash; where it earns its keep and where it does not. By Brady Gay, founder of Efficio."/>
<link rel="canonical" href="https://efficio.tech/blog/"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://efficio.tech/blog/"/>
<meta property="og:title" content="Efficio Blog"/>
<meta property="og:description" content="Practical writing on AI for service businesses."/>
<meta property="og:image" content="https://efficio.tech/og-image.svg"/>
<meta property="og:site_name" content="Efficio"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Efficio Blog"/>
<meta name="twitter:description" content="Practical writing on AI for service businesses."/>
<meta name="twitter:image" content="https://efficio.tech/og-image.svg"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/assets/theme.css"/>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c3aed'/><rect x='28' y='25' width='44' height='13' rx='4' fill='%23fff'/><rect x='28' y='43.5' width='30' height='13' rx='4' fill='%23fff'/><rect x='28' y='62' width='44' height='13' rx='4' fill='%23fff'/></svg>"/>
__INDEX_CSS__
</head>
<body>
__NAV__
<div class="bl-shell">
  <div class="bl-head">
    <div class="label">Blog</div>
    <h1>Practical AI for <em>service businesses.</em></h1>
    <p>Where AI actually earns its keep &mdash; and where it is hype. Written from operating four businesses on this stack, not from a vendor pitch deck.</p>
  </div>
  <div class="bl-grid">__CARDS__</div>
</div>
__FOOTER__
<script src="/assets/transitions.js" defer></script>
</body>
</html>
'''

def build_ld(title, desc, slug, date, title_short):
    items = (
      '{"@type":"ListItem","position":1,"name":"Home","item":"https://efficio.tech/"},'
      '{"@type":"ListItem","position":2,"name":"Blog","item":"https://efficio.tech/blog/"},'
      '{"@type":"ListItem","position":3,"name":"'+title_short+'","item":"https://efficio.tech/blog/'+slug+'.html"}'
    )
    article = (
      '{"@type":"Article","headline":"'+title.replace('"','\\"')+'",'
      '"description":"'+desc.replace('"','\\"')+'",'
      '"url":"https://efficio.tech/blog/'+slug+'.html",'
      '"datePublished":"'+date+'","dateModified":"'+date+'",'
      '"author":{"@type":"Person","name":"Brady Gay"},'
      '"publisher":{"@type":"Organization","name":"Efficio","logo":{"@type":"ImageObject","url":"https://efficio.tech/og-image.svg"}},'
      '"mainEntityOfPage":{"@type":"WebPage","@id":"https://efficio.tech/blog/'+slug+'.html"}}'
    )
    return '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","itemListElement":['+items+']},'+article+']}'

articles = []
for fn in sorted(glob.glob(os.path.join(SRC,"*.md"))):
    raw = open(fn, encoding="utf-8").read()
    fm, body_md = parse_front(raw)
    body_html = md2html(body_md)
    words = len(re.findall(r'\w+', body_md))
    minutes = max(3, round(words/220))
    vlabel = VLABEL.get(fm.get("vertical",""), fm.get("vertical",""))
    title_short = fm["title"].split(":")[0]
    y,m,da = fm["date"].split("-")
    date_human = MONTHS[int(m)-1]+" "+str(int(da))+", "+y
    ld = build_ld(fm["title"], fm["meta_description"], fm["slug"], fm["date"], title_short)
    page = (ART_TPL
        .replace("__ARTICLE_CSS__", ARTICLE_CSS)
        .replace("__NAV__", NAV).replace("__FOOTER__", FOOTER)
        .replace("{TITLE}", fm["title"]).replace("{DESC}", fm["meta_description"])
        .replace("{SLUG}", fm["slug"]).replace("{VLABEL}", vlabel)
        .replace("{DATE_HUMAN}", date_human).replace("{MINUTES}", str(minutes))
        .replace("{BODY}", body_html).replace("{LD}", ld))
    open(os.path.join(OUT, fm["slug"]+".html"), "w", encoding="utf-8").write(page)
    articles.append({"slug":fm["slug"],"title":fm["title"],"desc":fm["meta_description"],"vlabel":vlabel,"date_human":date_human,"minutes":minutes})
    print("OK  ", fm["slug"]+".html  ", str(words)+"w  ", str(minutes)+" min read")

cards = ""
for a in articles:
    cards += ('<a class="bl-card" href="/blog/'+a["slug"]+'.html">'
              '<span class="bl-vert">'+a["vlabel"]+'</span>'
              '<h2>'+a["title"]+'</h2>'
              '<p>'+a["desc"]+'</p>'
              '<div class="bl-meta">'+a["date_human"]+' &middot; ~'+str(a["minutes"])+' min read &rarr;</div>'
              '</a>')

index_page = (INDEX_TPL
    .replace("__INDEX_CSS__", INDEX_CSS)
    .replace("__NAV__", NAV).replace("__FOOTER__", FOOTER)
    .replace("__CARDS__", cards))
open(os.path.join(OUT,"index.html"),"w",encoding="utf-8").write(index_page)
print("OK   blog/index.html  ", len(articles), "articles linked")
