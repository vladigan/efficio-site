"""One-time: get a Google refresh token for Search Console + GA4 (read-only scopes).

    python3 scripts/google_auth.py

Opens a consent URL, catches the redirect on localhost, prints GOOGLE_REFRESH_TOKEN
for you to paste into _seo/.env. Uses a Desktop-app OAuth client, so no redirect URI
needs registering in the console."""
import http.server, json, secrets, urllib.parse, urllib.request, webbrowser
from _common import load_env, env

SCOPES = [
    "https://www.googleapis.com/auth/webmasters.readonly",   # Search Console (read + URL Inspection)
    "https://www.googleapis.com/auth/analytics.readonly",    # GA4 Data API
]
PORT = 8765

load_env()
cid, csec = env("GOOGLE_CLIENT_ID"), env("GOOGLE_CLIENT_SECRET")
state = secrets.token_urlsafe(16)
redirect = f"http://127.0.0.1:{PORT}/"
url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
    "client_id": cid, "redirect_uri": redirect, "response_type": "code",
    "scope": " ".join(SCOPES), "access_type": "offline", "prompt": "consent", "state": state,
})
code = {}

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        if q.get("state", [""])[0] == state and "code" in q:
            code["v"] = q["code"][0]
        self.send_response(200); self.end_headers()
        self.wfile.write(b"Done - you can close this tab and return to the terminal.")
    def log_message(self, *a): pass

print("Open this URL and approve access:\n\n" + url + "\n")
try: webbrowser.open(url)
except Exception: pass
srv = http.server.HTTPServer(("127.0.0.1", PORT), H)
while "v" not in code:
    srv.handle_request()

form = urllib.parse.urlencode({"code": code["v"], "client_id": cid, "client_secret": csec,
                               "redirect_uri": redirect, "grant_type": "authorization_code"}).encode()
tok = json.loads(urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=form)).read())
print("\nAdd this line to _seo/.env:\n\nGOOGLE_REFRESH_TOKEN=" + tok["refresh_token"])
