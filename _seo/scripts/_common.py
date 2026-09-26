"""Shared helpers for the SEO agent scripts. Standard library only, so the scheduled
task never has to pip-install anything before it can pull numbers."""
import base64, json, os, re, sys, urllib.error, urllib.parse, urllib.request
from datetime import date, datetime, timedelta, timezone

SEO_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_DIR  = os.path.dirname(SEO_DIR)
DATA_DIR  = os.path.join(SEO_DIR, "data")
STATE     = os.path.join(SEO_DIR, "state.json")
SITE_ROOT = "https://efficio.tech"


def load_env():
    """Read _seo/.env into os.environ (existing env vars win)."""
    path = os.path.join(SEO_DIR, ".env")
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def env(name, required=True, default=None):
    v = os.environ.get(name) or default
    if required and not v:
        sys.exit(f"MISSING: {name} is not set in _seo/.env — the data is missing, do not guess it.")
    return v


def http(method, url, body=None, headers=None, timeout=90):
    data = None
    headers = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode()
        headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw.strip().startswith(("{", "[")) else raw
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} from {url.split('?')[0]}: {e.read().decode()[:800]}")


def basic_auth(user, pw):
    return "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()


def google_token(scope_hint=""):
    """Exchange the stored refresh token for a short-lived access token."""
    load_env()
    form = urllib.parse.urlencode({
        "client_id":     env("GOOGLE_CLIENT_ID"),
        "client_secret": env("GOOGLE_CLIENT_SECRET"),
        "refresh_token": env("GOOGLE_REFRESH_TOKEN"),
        "grant_type":    "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=form, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())["access_token"]
    except urllib.error.HTTPError as e:
        sys.exit(f"Google token refresh failed ({e.code}): {e.read().decode()[:400]}"
                 " — rerun scripts/google_auth.py" + (f" ({scope_hint})" if scope_hint else ""))


def norm_page(url):
    """Collapse the URL variants this site serves into one key per page.
    GitHub Pages serves /for/agencies and /for/agencies.html as the same file, canonicals
    use the extensionless form, the sitemap uses .html — GSC and GA4 can report either."""
    if not url:
        return url
    p = urllib.parse.urlsplit(url if "://" in url else SITE_ROOT + ("" if url.startswith("/") else "/") + url)
    path = p.path or "/"
    path = re.sub(r"/index(\.html)?$", "/", path)
    path = re.sub(r"\.html$", "", path)
    return path


def page_file(path):
    """Map a normalised page path back to the HTML file in the repo (or None)."""
    rel = path.lstrip("/")
    for cand in ([rel + "index.html"] if rel.endswith("/") or rel == "" else [rel + ".html", rel + "/index.html"]):
        f = os.path.join(SITE_DIR, cand or "index.html")
        if os.path.exists(f):
            return os.path.relpath(f, SITE_DIR)
    return None


def load_state():
    with open(STATE, encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with open(STATE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=False)
        f.write("\n")


def gsc_last_complete_day():
    """GSC data lands 2-3 days late; never treat anything newer than today-3 as complete."""
    return date.today() - timedelta(days=3)


def daterange(start, end):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1)


def read_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)
