// English-only HTML pages for eBounce.

const CSS = `
:root{--brand:#ea580c;--brand-d:#c2410c;--bg:#f8fafc;--card:#fff;--text:#1e293b;--muted:#64748b;--ok:#16a34a;--fail:#dc2626;--warn:#d97706;--line:#e2e8f0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
a{color:var(--brand);text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.nav{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:10}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:60px}
.logo{font-weight:800;font-size:20px;color:var(--text)}
.logo span{color:var(--brand)}
.navlinks a{margin-left:22px;color:var(--muted);font-weight:500}
.navlinks a.btn{color:#fff}
.btn{display:inline-block;background:var(--brand);color:#fff!important;padding:10px 22px;border-radius:8px;font-weight:600;border:0;cursor:pointer;font-size:15px}
.btn:hover{background:var(--brand-d)}
.btn.ghost{background:#fff;color:var(--text)!important;border:1px solid var(--line)}
.hero{padding:80px 0 60px;text-align:center}
.hero h1{font-size:44px;line-height:1.2;margin-bottom:16px}
.hero h1 .hl{color:var(--brand)}
.hero p.sub{font-size:19px;color:var(--muted);max-width:640px;margin:0 auto 28px}
.badges{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:36px}
.badge{background:#fff;border:1px solid var(--line);border-radius:20px;padding:6px 16px;font-size:14px;color:var(--muted)}
.code{background:#0f172a;color:#e2e8f0;border-radius:10px;padding:18px 20px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;text-align:left;overflow-x:auto;max-width:640px;margin:0 auto}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;padding:40px 0}
.feat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px}
.feat h3{margin-bottom:8px;font-size:17px}
.feat p{color:var(--muted);font-size:14px}
.compare{width:100%;border-collapse:collapse;margin:30px 0;background:#fff;border-radius:12px;overflow:hidden}
.compare th,.compare td{padding:14px 16px;border-bottom:1px solid var(--line);text-align:left;font-size:15px}
.compare th{background:#0f172a;color:#fff}
.compare tr.hl td{background:#fff7ed;font-weight:700}
.sec{padding:50px 0}
.sec h2{text-align:center;margin-bottom:8px;font-size:30px}
.sec p.lead{text-align:center;color:var(--muted);margin-bottom:30px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:26px;position:relative}
.card.pop{border:2px solid var(--brand)}
.card .tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--brand);color:#fff;font-size:12px;font-weight:700;padding:2px 14px;border-radius:12px}
.card h3{font-size:20px;margin-bottom:4px}
.card .price{font-size:34px;font-weight:800;margin:8px 0}
.card .price small{font-size:14px;color:var(--muted);font-weight:400}
.card ul{list-style:none;margin:16px 0;font-size:14px;color:var(--muted)}
.card ul li{padding:5px 0}
.card ul li:before{content:"✓ ";color:var(--ok);font-weight:700}
.formbox{max-width:420px;margin:60px auto;background:#fff;border:1px solid var(--line);border-radius:12px;padding:36px}
.formbox h2{margin-bottom:6px}
.formbox p{color:var(--muted);font-size:14px;margin-bottom:20px}
.field{margin-bottom:16px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
.field input{width:100%;padding:11px 14px;border:1px solid var(--line);border-radius:8px;font-size:15px}
.err{background:#fef2f2;color:var(--fail);border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:14px;margin-bottom:16px;display:none}
.footer{border-top:1px solid var(--line);margin-top:60px;padding:30px 0;color:var(--muted);font-size:13px;text-align:center}
.dash{max-width:900px;margin:40px auto}
.panel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:24px;margin-bottom:20px}
.panel h3{margin-bottom:14px}
.meter{height:14px;background:#f1f5f9;border-radius:7px;overflow:hidden;margin:10px 0}
.meter>div{height:100%;background:var(--brand);border-radius:7px}
table.keys{width:100%;border-collapse:collapse;font-size:14px}
table.keys td,table.keys th{padding:10px;border-bottom:1px solid var(--line);text-align:left}
.keyval{font-family:ui-monospace,monospace;background:#f1f5f9;padding:10px 14px;border-radius:8px;word-break:break-all;font-size:13px}
.small{font-size:13px;color:var(--muted)}
.tester{display:flex;gap:10px;margin-top:12px}
.tester input{flex:1;padding:10px 14px;border:1px solid var(--line);border-radius:8px;font-size:14px}
pre.out{background:#0f172a;color:#e2e8f0;border-radius:8px;padding:14px;font-size:12.5px;overflow-x:auto;margin-top:12px;max-height:300px;overflow-y:auto}
`;

function nav(active) {
  return `<div class="nav"><div class="wrap">
    <a class="logo" href="/">e<span>Bounce</span></a>
    <div class="navlinks">
      <a href="/pricing">Pricing</a><a href="/docs">API Docs</a><a href="/faq">FAQ</a>
      <a href="/login">Log in</a><a class="btn" href="/signup">Sign up free</a>
    </div></div></div>`;
}

export function renderPage(inner, status = 200) {
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>eBounce — Free Email Verifier & Email Verification API | Email Bounce Checker</title>
<meta name="description" content="eBounce is a free email verifier and email bounce checker API. Get 10,000 free email verifications every month — 100x the industry standard. Syntax, MX, disposable and role-based checks via simple REST API.">
<meta name="keywords" content="email verification, email verifier, free email verifier, email bounce checker, email validation API, verify email address, bulk email verification">
<meta property="og:title" content="eBounce — Free Email Verifier API">
<meta property="og:description" content="10,000 free email validations every month. Simple REST API for email verification.">
<meta property="og:type" content="website">
<style>${CSS}</style></head>
<body>${inner}<div class="footer"><div class="wrap">eBounce — fast, honest email verification API. &copy; 2026</div></div></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export function pageLanding() {
  return `${nav()}
<div class="hero"><div class="wrap">
  <h1>Free email verifier &<br><span class="hl">email bounce checker API.</span></h1>
  <p class="sub">eBounce verifies email addresses in real time — syntax, MX records, disposable domains and role-based detection. 10,000 free email validations every month, 100x the industry standard. No credit card required.</p>
  <div class="badges"><span class="badge">✓ 10,000 free / month</span><span class="badge">✓ No credit card</span><span class="badge">✓ REST API</span><span class="badge">✓ Bulk verification</span></div>
  <div class="code">curl "https://ebounce.custmax.com/api/check?email=test@example.com" \\<br>&nbsp;&nbsp;-H "X-API-Key: ebk_your_key"</div>
  <div style="margin-top:28px"><a class="btn" href="/signup">Get 10,000 free validations</a>
  <a class="btn ghost" href="/pricing" style="margin-left:12px">See pricing</a></div>
</div></div>
<div class="wrap"><div class="sec">
  <h2>Why teams switch to eBounce</h2><p class="lead">The same core checks. A fraction of the price.</p>
  <table class="compare">
    <tr><th></th><th>ZeroBounce</th><th>MillionVerifier</th><th>NeverBounce</th><th>Bouncer</th><th>eBounce</th></tr>
    <tr><td>Free plan</td><td>100 / month</td><td>100 one-time</td><td>10 one-time</td><td>100 one-time</td><td><strong>10,000 / month</strong></td></tr>
    <tr><td>Entry paid</td><td>$39 / 2,000</td><td>$39 / 10,000</td><td>$8 / 1,000</td><td>$8 / 1,000</td><td><strong>Free</strong></td></tr>
    <tr><td>100k validations</td><td>~$700</td><td>$149</td><td>~$400</td><td>$400</td><td><strong>Free</strong></td></tr>
    <tr class="hl"><td>Cost per 1k (paid)</td><td>$19.50</td><td>$3.90</td><td>$8.00</td><td>$8.00</td><td><strong>$0.79 – $1.80</strong></td></tr>
  </table>
  <div class="features">
    <div class="feat"><h3>⚡ Real-time API</h3><p>Single checks in milliseconds, batch endpoint for up to 500 emails per call.</p></div>
    <div class="feat"><h3>🧹 Core hygiene checks</h3><p>Syntax, MX records, disposable domains, and role-based address detection.</p></div>
    <div class="feat"><h3>📊 Honest quotas</h3><p>Monthly quotas that reset. No expiring-credit traps, no surprise charges.</p></div>
    <div class="feat"><h3>🔑 Simple auth</h3><p>One API key per project. Rotate or revoke anytime from your dashboard.</p></div>
  </div>
</div></div>`;
}

export function pagePricing() {
  return `${nav()}
<div class="wrap"><div class="sec">
  <h2>Simple, free pricing</h2>
  <p class="lead">eBounce is free while we're in beta. No credit card, no catch.</p>
  <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:24px">
    <div class="card" style="border:2px solid #4caf50;max-width:340px">
      <h3>Free</h3><div class="price">$0<span>/month</span></div>
      <p class="small"><strong>10,000</strong> validations / month</p>
      <ul class="small" style="text-align:left"><li>Single + batch API</li><li>Web tester</li><li>Syntax, MX, disposable &amp; role-based checks</li><li>Community support</li></ul>
      <a class="btn" href="/signup">Get started free</a>
    </div>
  </div>
  <p class="small" style="margin-top:32px;color:#888">Paid plans with higher limits are coming soon. Free tier stays free.</p>
</div></div>`;
}

export function pageSignup() {
  return `${nav()}
<div class="wrap"><div class="formbox">
  <h2>Create your account</h2><p>10,000 free validations every month. No credit card required.</p>
  <div class="err" id="err"></div>
  <div class="field"><label>Email</label><input id="email" type="email" placeholder="you@company.com"></div>
  <div class="field"><label>Password (min 8 characters)</label><input id="pw" type="password"></div>
  <button class="btn" style="width:100%" onclick="signup()">Create account</button>
  <p style="margin-top:14px;text-align:center">Already have an account? <a href="/login">Log in</a></p>
</div></div>
<script>
async function signup(){
  const e=document.getElementById('err'); e.style.display='none';
  const email=document.getElementById('email').value, password=document.getElementById('pw').value;
  const r=await fetch('/api/auth/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
  const d=await r.json();
  if(!d.ok){e.textContent=d.message||d.error||'Signup failed';e.style.display='block';return;}
  location.href='/dashboard';
}
</script>`;
}

export function pageLogin() {
  return `${nav()}
<div class="wrap"><div class="formbox">
  <h2>Welcome back</h2><p>Log in to your eBounce dashboard.</p>
  <div class="err" id="err"></div>
  <div class="field"><label>Email</label><input id="email" type="email"></div>
  <div class="field"><label>Password</label><input id="pw" type="password"></div>
  <button class="btn" style="width:100%" onclick="login()">Log in</button>
  <p style="margin-top:14px;text-align:center">No account? <a href="/signup">Sign up free</a></p>
</div></div>
<script>
async function login(){
  const e=document.getElementById('err'); e.style.display='none';
  const email=document.getElementById('email').value, password=document.getElementById('pw').value;
  const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
  const d=await r.json();
  if(!d.ok){e.textContent=d.message||d.error||'Login failed';e.style.display='block';return;}
  location.href=new URLSearchParams(location.search).get('next')||'/dashboard';
}
</script>`;
}

export function pageDashboard() {
  return `${nav()}
<div class="wrap"><div class="dash">
  <h2 style="margin-bottom:20px">Dashboard</h2>
  <div class="panel"><h3>Usage — <span id="period"></span></h3>
    <div style="font-size:28px;font-weight:800"><span id="used">–</span> <span class="small">/ <span id="quota">–</span> validations</span></div>
    <div class="meter"><div id="bar" style="width:0%"></div></div>
    <div class="small"><span id="plan">–</span> plan · <span id="remaining">–</span> remaining · <a href="/pricing">Upgrade</a></div>
    <div id="billrow" style="margin-top:14px"></div>
  </div>
  <div class="panel"><h3>API keys</h3>
    <table class="keys"><thead><tr><th>Name</th><th>Created</th><th>Last used</th><th></th></tr></thead>
    <tbody id="keys"></tbody></table>
    <div style="margin-top:14px;display:flex;gap:10px">
      <input id="keyname" placeholder="Key name (e.g. production)" style="flex:1;padding:10px 14px;border:1px solid var(--line);border-radius:8px">
      <button class="btn" onclick="newKey()">Create key</button>
    </div>
    <div id="newkey" style="margin-top:12px;display:none"><div class="small" style="margin-bottom:6px">Your new key (shown once — copy it now):</div><div class="keyval" id="newkeyval"></div></div>
  </div>
  <div class="panel"><h3>Try it</h3>
    <div class="tester"><input id="temail" placeholder="email@example.com"><button class="btn" onclick="test()">Verify</button></div>
    <pre class="out" id="out">Result will appear here…</pre>
  </div>
  <div style="text-align:right"><button class="btn ghost" onclick="logout()">Log out</button></div>
</div></div>
<script>
async function load(){
  const r=await fetch('/api/dashboard'); const d=await r.json();
  if(!d.ok){location.href='/login?next=/dashboard';return;}
  document.getElementById('period').textContent=d.period;
  document.getElementById('used').textContent=d.usage.toLocaleString();
  document.getElementById('quota').textContent=d.planQuota.toLocaleString();
  document.getElementById('plan').textContent=d.plan[0].toUpperCase()+d.plan.slice(1)+(d.planPrice?' ($'+d.planPrice+'/mo)':'');
  document.getElementById('remaining').textContent=d.remaining.toLocaleString();
  document.getElementById('bar').style.width=Math.min(100,d.usage/d.planQuota*100)+'%';
  const tb=document.getElementById('keys'); tb.innerHTML='';
  d.keys.forEach(k=>{
    const tr=document.createElement('tr');
    tr.innerHTML='<td>'+k.name+'</td><td>'+new Date(k.created_at).toLocaleDateString()+'</td><td>'+(k.last_used_at?new Date(k.last_used_at).toLocaleString():'never')+'</td><td><button class="btn ghost" style="padding:4px 12px" onclick="delKey(\\''+k.id+'\\')">Revoke</button></td>';
    tb.appendChild(tr);
  });
  const br=document.getElementById('billrow');
  if(d.plan==='free'&&d.billingConfigured){br.innerHTML='<a class="btn" href="/pricing">Upgrade plan</a>';}
  else if(d.plan!=='free'&&d.billingConfigured){br.innerHTML='<button class="btn ghost" onclick="portal()">Manage billing</button>';}
  else if(!d.billingConfigured){br.innerHTML='<span class="small">Paid billing coming soon.</span>';}
}
async function newKey(){
  const name=document.getElementById('keyname').value||'default';
  const r=await fetch('/api/keys',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name})});
  const d=await r.json(); if(!d.ok){alert('Failed');return;}
  document.getElementById('newkeyval').textContent=d.api_key;
  document.getElementById('newkey').style.display='block'; load();
}
async function delKey(id){ if(!confirm('Revoke this key?'))return;
  await fetch('/api/keys/'+id,{method:'DELETE'}); load(); }
async function test(){
  const em=document.getElementById('temail').value;
  const r=await fetch('/api/check?email='+encodeURIComponent(em));
  document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2); load();
}
async function logout(){await fetch('/api/auth/logout',{method:'POST'});location.href='/';}
async function portal(){
  const r=await fetch('/api/billing/portal',{method:'POST'}); const d=await r.json();
  if(d.ok)location.href=d.url; else alert(d.message||d.error);
}
load();
</script>`;
}

export function pageDocs() {
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>API Documentation</h2><p class="lead">Base URL: <code>https://ebounce.custmax.com</code></p>
  <div class="panel"><h3>Authentication</h3>
    <p class="small">Pass your API key in the <code>X-API-Key</code> header or as <code>?api_key=</code>. Create keys in your <a href="/dashboard">dashboard</a>.</p>
    <div class="code">curl -H "X-API-Key: ebk_your_key" \\<br>&nbsp;&nbsp;"https://ebounce.custmax.com/api/check?email=test@example.com"</div>
  </div>
  <div class="panel"><h3>GET /api/check — verify one email</h3>
    <p class="small">Query: <code>email</code> (required). Costs 1 validation.</p>
    <div class="code">{"ok":true,"result":{"email":"test@example.com","syntax":true,"mx":true,<br>&nbsp;"disposable":false,"role_based":false,"verdict":"pass","reason":"ok"}}</div>
    <p class="small" style="margin-top:10px">Verdicts: <code>pass</code> / <code>fail</code>. Reasons: <code>ok</code>, <code>bad-syntax</code>, <code>no-mx</code>, <code>disposable</code>, <code>role-based</code>, <code>dns-error</code>.</p>
  </div>
  <div class="panel"><h3>POST /api/check-batch — verify up to 500</h3>
    <p class="small">JSON body: <code>{"emails": ["a@x.com", "b@y.com"]}</code>. Costs 1 validation per email.</p>
    <div class="code">{"ok":true,"total":2,"pass":1,"results":[...]}</div>
  </div>
  <div class="panel"><h3>Errors</h3>
    <p class="small"><code>401</code> missing/invalid API key · <code>402</code> monthly quota exceeded (upgrade at /pricing) · <code>400</code> bad request.</p>
  </div>
</div></div>`;
}

export function pageFaq() {
  const qa = [
    ["What is email verification?", "Email verification checks whether an email address is real and can receive mail. eBounce validates syntax, MX records, disposable domains and role-based addresses in real time through a simple REST API."],
    ["What is an email bounce checker?", "A bounce checker predicts whether your emails will bounce before you send them. Hard bounces (invalid addresses) hurt your sender reputation and get you blocklisted. Verifying your list with eBounce first keeps bounce rates low."],
    ["How is eBounce different from ZeroBounce or NeverBounce?", "Three things: 10,000 free verifications every month (100x the industry standard free tier), a dead-simple REST API with no credit card required to start."],
    ["What does the free plan include?", "10,000 email verifications per month, single and batch API access, the web tester, and community support. No credit card required. The quota resets on the 1st of each month."],
    ["What checks does eBounce perform?", "Four layers: (1) syntax validation per RFC standards, (2) MX record lookup to confirm the domain accepts mail, (3) disposable/temporary email detection across hundreds of providers, (4) role-based address detection (info@, support@, sales@). Deep SMTP mailbox verification is rolling out next."],
    ["What is a catch-all domain?", "A catch-all domain accepts mail to any address (e.g. anything@company.com). Verification services mark these as risky because the mailbox may not exist. eBounce flags catch-all domains so you can treat them separately."],
    ["How fast is the API?", "Single verifications typically return in under a second. Batch requests verify up to 500 emails per call; enable deep SMTP checks for higher accuracy when you need it."],
    ["Do you offer bulk list cleaning?", "Yes — POST up to 500 emails per batch request to /api/check-batch. Each email costs one validation from your monthly quota."],
    ["What happens when I exceed my quota?", "The API returns HTTP 402 with a quota_exceeded error. Paid plans with higher limits are coming soon — the free tier stays free."],
    ["Is my data private?", "We never sell or share your verification data. API keys are hashed, sessions are cookie-based, and you can revoke keys anytime from your dashboard."],
    ["Can I use eBounce to validate signup forms in real time?", "Yes — call GET /api/check from your backend when a user registers. Invalid, disposable and role-based addresses get rejected before they enter your database."],
    ["How do I get started?", "Create a free account, copy your API key from the dashboard, and make your first request. It takes under a minute and no credit card is required."],
  ];
  const items = qa.map(([q, a]) => `<div class="panel" style="margin-bottom:14px"><h3 style="margin-top:0">${q}</h3><p class="small">${a}</p></div>`).join("\n");
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>Frequently Asked Questions</h2>
  <p class="lead">Everything about free email verification, the eBounce API, bounce checking and pricing.</p>
  ${items}
  <p style="margin-top:24px"><a class="btn" href="/signup">Start verifying free</a></p>
</div></div>`;
}

export function pageAlt_zerobounce() {
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>eBounce — the free ZeroBounce alternative</h2>
  <p class="lead">Get 10,000 free email verifications every month — 100x ZeroBounce's free tier. Same core checks, simpler API, no credit card required.</p>
  <div class="panel"><h3>Head-to-head comparison</h3>
  <table style="width:100%;border-collapse:collapse" class="small">
    <tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:8px"></th><th style="padding:8px">ZeroBounce</th><th style="padding:8px">eBounce</th></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Free plan</td><td style="padding:8px">100 / month</td><td style="padding:8px"><strong>10,000 / month</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Entry paid price</td><td style="padding:8px">$39 / 2,000</td><td style="padding:8px"><strong>Free (paid plans coming soon)</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Checks</td><td style="padding:8px">Syntax, MX, SMTP</td><td style="padding:8px">Syntax, MX, disposable, role-based</td></tr>
    <tr><td style="padding:8px">API</td><td style="padding:8px">REST</td><td style="padding:8px">REST, no credit card to start</td></tr>
  </table></div>
  <div class="panel"><h3>Why switch to eBounce?</h3>
  <ul class="small"><li><strong>100x more free verifications</strong> — 10,000/month vs 100 / month.</li>
  <li><strong>No credit card required</strong> — sign up and get an API key in under a minute.</li>
  <li><strong>Simple REST API</strong> — one endpoint for single checks, one for batches up to 500.</li>
  <li><strong>Built for developers</strong> — clear JSON responses, honest error codes, generous rate limits.</li></ul></div>
  <p style="margin-top:24px"><a class="btn" href="/signup">Try eBounce free</a></p>
  <p class="small" style="margin-top:16px">Looking for a ZeroBounce alternative with a bigger free tier? eBounce gives you 10,000 free email verifications every month.</p>
</div></div>`;
}

export function pageAlt_neverbounce() {
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>eBounce — the free NeverBounce alternative</h2>
  <p class="lead">Get 10,000 free email verifications every month. NeverBounce gives you 10 free credits, once. eBounce gives you 10,000, every month.</p>
  <div class="panel"><h3>Head-to-head comparison</h3>
  <table style="width:100%;border-collapse:collapse" class="small">
    <tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:8px"></th><th style="padding:8px">NeverBounce</th><th style="padding:8px">eBounce</th></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Free plan</td><td style="padding:8px">10 one-time</td><td style="padding:8px"><strong>10,000 / month</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Entry paid price</td><td style="padding:8px">$8 / 1,000</td><td style="padding:8px"><strong>Free (paid plans coming soon)</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Checks</td><td style="padding:8px">Syntax, MX, SMTP</td><td style="padding:8px">Syntax, MX, disposable, role-based</td></tr>
    <tr><td style="padding:8px">API</td><td style="padding:8px">REST</td><td style="padding:8px">REST, no credit card to start</td></tr>
  </table></div>
  <div class="panel"><h3>Why switch to eBounce?</h3>
  <ul class="small"><li><strong>100x more free verifications</strong> — 10,000/month vs 10 one-time.</li>
  <li><strong>No credit card required</strong> — sign up and get an API key in under a minute.</li>
  <li><strong>Simple REST API</strong> — one endpoint for single checks, one for batches up to 500.</li>
  <li><strong>Built for developers</strong> — clear JSON responses, honest error codes, generous rate limits.</li></ul></div>
  <p style="margin-top:24px"><a class="btn" href="/signup">Try eBounce free</a></p>
  <p class="small" style="margin-top:16px">Looking for a NeverBounce alternative with a bigger free tier? eBounce gives you 10,000 free email verifications every month.</p>
</div></div>`;
}

export function pageAlt_millionverifier() {
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>eBounce — the free MillionVerifier alternative</h2>
  <p class="lead">Get 10,000 free email verifications every month — renewed monthly, not a one-time trial. Simple REST API, no credit card required.</p>
  <div class="panel"><h3>Head-to-head comparison</h3>
  <table style="width:100%;border-collapse:collapse" class="small">
    <tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:8px"></th><th style="padding:8px">MillionVerifier</th><th style="padding:8px">eBounce</th></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Free plan</td><td style="padding:8px">100 one-time</td><td style="padding:8px"><strong>10,000 / month</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Entry paid price</td><td style="padding:8px">$39 / 10,000</td><td style="padding:8px"><strong>Free (paid plans coming soon)</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Checks</td><td style="padding:8px">Syntax, MX, SMTP</td><td style="padding:8px">Syntax, MX, disposable, role-based</td></tr>
    <tr><td style="padding:8px">API</td><td style="padding:8px">REST</td><td style="padding:8px">REST, no credit card to start</td></tr>
  </table></div>
  <div class="panel"><h3>Why switch to eBounce?</h3>
  <ul class="small"><li><strong>100x more free verifications</strong> — 10,000/month vs 100 one-time.</li>
  <li><strong>No credit card required</strong> — sign up and get an API key in under a minute.</li>
  <li><strong>Simple REST API</strong> — one endpoint for single checks, one for batches up to 500.</li>
  <li><strong>Built for developers</strong> — clear JSON responses, honest error codes, generous rate limits.</li></ul></div>
  <p style="margin-top:24px"><a class="btn" href="/signup">Try eBounce free</a></p>
  <p class="small" style="margin-top:16px">Looking for a MillionVerifier alternative with a bigger free tier? eBounce gives you 10,000 free email verifications every month.</p>
</div></div>`;
}

export function pageAlt_bouncer() {
  return `${nav()}
<div class="wrap"><div class="sec" style="text-align:left;max-width:800px;margin:0 auto">
  <h2>eBounce — the free Bouncer alternative</h2>
  <p class="lead">Get 10,000 free email verifications every month. Bouncer's free tier is 100 credits, once. Ours is 10,000, every month.</p>
  <div class="panel"><h3>Head-to-head comparison</h3>
  <table style="width:100%;border-collapse:collapse" class="small">
    <tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:8px"></th><th style="padding:8px">Bouncer</th><th style="padding:8px">eBounce</th></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Free plan</td><td style="padding:8px">100 one-time</td><td style="padding:8px"><strong>10,000 / month</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Entry paid price</td><td style="padding:8px">$8 / 1,000</td><td style="padding:8px"><strong>Free (paid plans coming soon)</strong></td></tr>
    <tr style="border-bottom:1px solid #eee"><td style="padding:8px">Checks</td><td style="padding:8px">Syntax, MX, SMTP</td><td style="padding:8px">Syntax, MX, disposable, role-based</td></tr>
    <tr><td style="padding:8px">API</td><td style="padding:8px">REST</td><td style="padding:8px">REST, no credit card to start</td></tr>
  </table></div>
  <div class="panel"><h3>Why switch to eBounce?</h3>
  <ul class="small"><li><strong>100x more free verifications</strong> — 10,000/month vs 100 one-time.</li>
  <li><strong>No credit card required</strong> — sign up and get an API key in under a minute.</li>
  <li><strong>Simple REST API</strong> — one endpoint for single checks, one for batches up to 500.</li>
  <li><strong>Built for developers</strong> — clear JSON responses, honest error codes, generous rate limits.</li></ul></div>
  <p style="margin-top:24px"><a class="btn" href="/signup">Try eBounce free</a></p>
  <p class="small" style="margin-top:16px">Looking for a Bouncer alternative with a bigger free tier? eBounce gives you 10,000 free email verifications every month.</p>
</div></div>`;
}
