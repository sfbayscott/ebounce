#!/usr/bin/env python3
"""
eBounce SMTP deep-verification backend.
Runs on a server with outbound port 25 open (e.g. the aceppe.com Linode box).

What it does:
  GET /verify?email=foo@bar.com  ->  JSON { email, smtp_ok, catch_all, verdict, reason }
  - MX lookup for the domain
  - Connect to best MX on port 25, HELO, MAIL FROM, RCPT TO, then RSET/QUIT.
    Never sends a message body.
  - Catch-all detection: also probes a random address at the same domain;
    if the random address is accepted, the domain is catch-all.

Security: requires header X-Verify-Secret matching EBOUNCE_VERIFY_SECRET env var.
Rate limit: 30 req/min per IP (stdlib only, no dependencies).

Run:  EBOUNCE_VERIFY_SECRET=<long-random> python3 smtp_verify.py  (listens on 127.0.0.1:8787)
Put behind nginx/Caddy with TLS, or bind 0.0.0.0:8787 + firewall if the
Worker must reach it directly. Recommended: reverse-proxy at
https://www.aceppe.com/_ebounce_verify (secret header still required).
"""
import json, os, re, smtplib, socket, secrets, string, time, threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

SECRET = os.environ.get("EBOUNCE_VERIFY_SECRET", "")
PORT = int(os.environ.get("EBOUNCE_VERIFY_PORT", "8787"))
MAIL_FROM = os.environ.get("EBOUNCE_MAIL_FROM", "verify@ebounce.custmax.com")
HELO_HOST = os.environ.get("EBOUNCE_HELO_HOST", socket.getfqdn() or "ebounce.custmax.com")

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,}$")

# simple per-IP rate limiting: 30 requests / 60s sliding window
_hits = {}
_lock = threading.Lock()
def rate_ok(ip):
    now = time.time()
    with _lock:
        lst = [t for t in _hits.get(ip, []) if now - t < 60]
        if len(lst) >= 30:
            _hits[ip] = lst
            return False
        lst.append(now)
        _hits[ip] = lst
        return True

def mx_hosts(domain):
    """MX lookup via DNS-over-HTTPS (no dnspython dependency)."""
    import urllib.request
    try:
        url = f"https://cloudflare-dns.com/dns-query?name={domain}&type=MX"
        req = urllib.request.Request(url, headers={"accept": "application/dns-json",
                                                   "User-Agent": "eBounce/1.0"})
        data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode())
        ans = [a for a in data.get("Answer", []) if a.get("type") == 15]
        out = []
        for a in ans:
            parts = a["data"].split()
            if len(parts) == 2:
                out.append((int(parts[0]), parts[1].rstrip(".")))
        out.sort()
        return [h for _, h in out]
    except Exception:
        return None

def smtp_rcpt_ok(mx_host, email):
    """Probe RCPT TO. Returns (accepted: bool|None, info: str).
    None = inconclusive (timeout, greylist 4xx, connection refused)."""
    try:
        with smtplib.SMTP(timeout=12) as s:
            s.connect(mx_host, 25)
            s.helo(HELO_HOST)
            code, _ = s.mail(MAIL_FROM)
            if code != 250:
                return None, f"mail-from-rejected:{code}"
            code, resp = s.rcpt(email)
            try:
                s.rset()
            except Exception:
                pass
            if code == 250:
                return True, "250-ok"
            if 400 <= code < 500:
                return None, f"temp-fail:{code}"
            return False, f"rejected:{code}"
    except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected,
            socket.timeout, TimeoutError, OSError) as e:
        return None, f"conn-error:{type(e).__name__}"
    except Exception as e:
        return None, f"error:{type(e).__name__}"

def verify_email(email):
    email = email.strip().lower()
    if not EMAIL_RE.match(email) or len(email) > 254:
        return {"email": email, "verdict": "fail", "reason": "bad-syntax",
                "smtp_ok": False, "catch_all": False}
    domain = email.split("@", 1)[1]
    mxs = mx_hosts(domain)
    if mxs is None:
        return {"email": email, "verdict": "unknown", "reason": "dns-error",
                "smtp_ok": False, "catch_all": False}
    if not mxs:
        return {"email": email, "verdict": "fail", "reason": "no-mx",
                "smtp_ok": False, "catch_all": False}

    mx = mxs[0]
    ok, info = smtp_rcpt_ok(mx, email)
    if ok is None:
        return {"email": email, "verdict": "unknown", "reason": info,
                "smtp_ok": False, "catch_all": False, "mx_host": mx}
    if not ok:
        return {"email": email, "verdict": "fail", "reason": info,
                "smtp_ok": False, "catch_all": False, "mx_host": mx}

    # accepted -> check catch-all with a random address
    rand = "ebnc-" + "".join(secrets.choice(string.ascii_lowercase + string.digits)
                             for _ in range(16)) + "@" + domain
    rand_ok, rand_info = smtp_rcpt_ok(mx, rand)
    catch_all = (rand_ok is True)
    return {"email": email, "verdict": "pass", "reason": "smtp-ok",
            "smtp_ok": True, "catch_all": catch_all,
            "catch_all_probe": rand_info, "mx_host": mx}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if not SECRET:
            return self._send(500, {"error": "server misconfigured: secret not set"})
        if self.headers.get("X-Verify-Secret") != SECRET:
            return self._send(401, {"error": "unauthorized"})
        ip = self.client_address[0]
        if not rate_ok(ip):
            return self._send(429, {"error": "rate_limited"})
        u = urlparse(self.path)
        if u.path != "/verify":
            return self._send(404, {"error": "not found"})
        email = parse_qs(u.query).get("email", [""])[0]
        if not email:
            return self._send(400, {"error": "missing email parameter"})
        try:
            return self._send(200, verify_email(email))
        except Exception as e:
            return self._send(500, {"error": f"internal: {type(e).__name__}"})

if __name__ == "__main__":
    if not SECRET:
        print("WARNING: EBOUNCE_VERIFY_SECRET not set - refusing to start")
        raise SystemExit(1)
    srv = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"eBounce SMTP verifier listening on 127.0.0.1:{PORT}", flush=True)
    srv.serve_forever()
