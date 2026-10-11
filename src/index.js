// eBounce SaaS — Cloudflare Worker (KV storage)
// English-only email verification API with Stripe billing.

import { renderPage, pageLanding, pagePricing, pageSignup, pageLogin, pageDashboard, pageDocs, pageFaq, pageAlt_zerobounce, pageAlt_neverbounce, pageAlt_millionverifier, pageAlt_bouncer } from './pages.js';
import { hashPassword, verifyPassword, randomToken, sha256Hex, getSessionUser, requireAuthPage } from './auth.js';
import { verifyEmail } from './verify.js';
import { createCheckoutSession, createPortalSession, verifyWebhookSignature, handleStripeEvent } from './stripe.js';
import * as store from './store.js';

export const PLANS = {
  free:     { name: 'Free',    price: 0,   quota: 10000,  priceEnv: null },
  starter:  { name: 'Starter', price: 4,   quota: 5000,   priceEnv: 'STRIPE_PRICE_STARTER' },
  growth:   { name: 'Growth',  price: 15,  quota: 25000,  priceEnv: 'STRIPE_PRICE_GROWTH' },
  scale:    { name: 'Scale',   price: 40,  quota: 100000, priceEnv: 'STRIPE_PRICE_SCALE' },
};

function currentPeriod() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function checkQuota(env, userId) {
  const user = await store.getUser(env, userId);
  const plan = PLANS[user?.plan] || PLANS.free;
  const period = currentPeriod();
  const count = await store.getUsage(env, userId, period);
  return { plan, period, count, allowed: count < plan.quota, remaining: Math.max(0, plan.quota - count) };
}

// Resolve API caller: X-API-Key header, ?api_key=, or session cookie.
async function resolveApiUser(env, req) {
  const url = new URL(req.url);
  const key = req.headers.get('x-api-key') || url.searchParams.get('api_key');
  if (key) {
    const keyHash = await sha256Hex(key.trim());
    const meta = await store.getKeyOwner(env, keyHash);
    if (!meta) return { error: 'invalid_api_key' };
    const user = await store.getUser(env, meta.user_id);
    if (!user) return { error: 'invalid_api_key' };
    await store.touchApiKey(env, keyHash);
    return { userId: user.id, via: 'key' };
  }
  const user = await getSessionUser(env, req);
  if (user) return { userId: user.id, via: 'session' };
  return { error: 'missing_api_key' };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

/**
 * Deep SMTP verification via the Linode backend (outbound port 25).
 * Returns merged result. Falls back to prefilter-only on any backend failure.
 * Configure via Worker secrets: EBOUNCE_SMTP_BACKEND_URL, EBOUNCE_VERIFY_SECRET.
 */
async function deepVerify(env, prefilterResult, skipDeep) {
  const base = (env.EBOUNCE_SMTP_BACKEND_URL || "").replace(/\/$/, "");
  const secret = env.EBOUNCE_VERIFY_SECRET || "";
  if (skipDeep || !base || !secret || prefilterResult.verdict !== "pass") {
    return { ...prefilterResult, deep: false };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(`${base}/verify?email=${encodeURIComponent(prefilterResult.email)}`, {
      headers: { "X-Verify-Secret": secret, "User-Agent": "eBounce-Worker/1.0" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ...prefilterResult, deep: false, deep_error: `backend:${res.status}` };
    const d = await res.json();
    if (d.verdict === "fail") {
      return { ...prefilterResult, verdict: "fail", reason: d.reason || "smtp-rejected",
               deep: true, smtp_ok: false, catch_all: false };
    }
    if (d.verdict === "unknown") {
      return { ...prefilterResult, deep: true, smtp_ok: false,
               deep_note: d.reason || "smtp-inconclusive" };
    }
    // smtp pass
    return { ...prefilterResult, deep: true, smtp_ok: true,
             catch_all: !!d.catch_all,
             reason: d.catch_all ? "catch-all" : prefilterResult.reason };
  } catch (e) {
    return { ...prefilterResult, deep: false, deep_error: "backend-unreachable" };
  }
}

async function handleCheck(env, req) {
  const auth = await resolveApiUser(env, req);
  if (auth.error === 'missing_api_key')
    return json({ ok: false, error: 'missing_api_key', message: 'Provide an API key via X-API-Key header or ?api_key= parameter. Get one free at /signup.' }, 401);
  if (auth.error === 'invalid_api_key')
    return json({ ok: false, error: 'invalid_api_key', message: 'The API key is invalid.' }, 401);

  const url = new URL(req.url);
  const email = (url.searchParams.get('email') || '').trim();
  if (!email) return json({ ok: false, error: 'missing_email', message: 'Query parameter ?email= is required.' }, 400);

  const q = await checkQuota(env, auth.userId);
  if (!q.allowed)
    return json({ ok: false, error: 'quota_exceeded', message: `Monthly quota of ${q.plan.quota.toLocaleString()} validations used. Upgrade at /pricing.` }, 402);

  const prefilter = await verifyEmail(email);
  const skipDeep = url.searchParams.get("deep") === "0";
  const result = await deepVerify(env, prefilter, skipDeep);
  await store.addUsage(env, auth.userId, q.period, 1);
  return json({ ok: true, result });
}

async function handleCheckBatch(env, req) {
  const auth = await resolveApiUser(env, req);
  if (auth.error === 'missing_api_key')
    return json({ ok: false, error: 'missing_api_key', message: 'Provide an API key via X-API-Key header or api_key field.' }, 401);
  if (auth.error === 'invalid_api_key')
    return json({ ok: false, error: 'invalid_api_key', message: 'The API key is invalid.' }, 401);

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_request', message: 'JSON body with "emails" array required.' }, 400); }
  if (!req.headers.get('x-api-key') && body.api_key) {
    const sep = req.url.includes('?') ? '&' : '?';
    const retry = await resolveApiUser(env, new Request(req.url + sep + 'api_key=' + encodeURIComponent(body.api_key), { headers: req.headers }));
    if (retry.error) return json({ ok: false, error: retry.error }, 401);
    auth.userId = retry.userId;
  }
  const emails = Array.isArray(body.emails) ? body.emails.map(e => String(e).trim()).filter(Boolean) : [];
  if (!emails.length) return json({ ok: false, error: 'missing_emails', message: '"emails" must be a non-empty array.' }, 400);
  if (emails.length > 500) return json({ ok: false, error: 'batch_too_large', message: 'Max 500 emails per batch request.' }, 400);

  const q = await checkQuota(env, auth.userId);
  const allowed = Math.min(emails.length, q.remaining);
  if (allowed <= 0)
    return json({ ok: false, error: 'quota_exceeded', message: `Monthly quota of ${q.plan.quota.toLocaleString()} validations used. Upgrade at /pricing.` }, 402);

  const slice = emails.slice(0, allowed);
  const results = [];
  for (const e of slice) results.push(await verifyEmail(e));
  // Optional deep SMTP check for batch: body.deep=true, capped at 50 pass results
  if (body.deep === true) {
    let deepCount = 0;
    for (let i = 0; i < results.length && deepCount < 50; i++) {
      if (results[i].verdict === "pass") {
        results[i] = await deepVerify(env, results[i], false);
        deepCount++;
      }
    }
  }
  await store.addUsage(env, auth.userId, q.period, slice.length);
  const pass = results.filter(r => r.verdict === 'pass').length;
  const resp = { ok: true, total: slice.length, pass, results };
  if (allowed < emails.length) resp.note = `Quota limited this batch to ${allowed} of ${emails.length} emails.`;
  return json(resp);
}

// Secure cookie flag only on https (zone runs http per owner requirement).
function sessionCookie(req, token, maxAge) {
  const visitor = req.headers.get('cf-visitor') || '';
  const secure = visitor.includes('"scheme":"https"') ? '; Secure' : '';
  return `ms_session=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`;
}
async function handleSignup(env, req) {
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);
  if (password.length < 8) return json({ ok: false, error: 'weak_password', message: 'Password must be at least 8 characters.' }, 400);
  if (await store.getUserByEmail(env, email))
    return json({ ok: false, error: 'email_taken', message: 'An account with this email already exists.' }, 409);
  const id = randomToken(16);
  await store.createUser(env, {
    id, email, password_hash: await hashPassword(password),
    plan: 'free', stripe_customer_id: null, stripe_subscription_id: null, created_at: Date.now(),
  });
  const rawKey = 'ebk_' + randomToken(32);
  const keyHash = await sha256Hex(rawKey);
  const keyId = randomToken(12);
  await store.createApiKeyRecord(env, id, 'default', keyHash, keyId, rawKey);
  await store.storeKeyHash(env, id, keyId, keyHash);
  const token = randomToken(32);
  await store.createSession(env, id, token, 30 * 86400 * 1000);
  return json({ ok: true, api_key: rawKey }, 200, {
    'Set-Cookie': sessionCookie(req, token, 2592000),
  });
}

async function handleLogin(env, req) {
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await store.getUserByEmail(env, email);
  if (!user || !(await verifyPassword(password, user.password_hash)))
    return json({ ok: false, error: 'invalid_credentials', message: 'Email or password is incorrect.' }, 401);
  const token = randomToken(32);
  await store.createSession(env, user.id, token, 30 * 86400 * 1000);
  return json({ ok: true }, 200, {
    'Set-Cookie': sessionCookie(req, token, 2592000),
  });
}

async function handleLogout(env, req) {
  const m = (req.headers.get('cookie') || '').match(/ms_session=([A-Za-z0-9_-]+)/);
  if (m) await store.deleteSession(env, m[1]);
  return json({ ok: true }, 200, {
    'Set-Cookie': sessionCookie(req, '', 0),
  });
}

async function handleCreateKey(env, req) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const name = String(body.name || 'default').slice(0, 40);
  const rawKey = 'ebk_' + randomToken(32);
  const keyHash = await sha256Hex(rawKey);
  const keyId = randomToken(12);
  await store.createApiKeyRecord(env, user.id, name, keyHash, keyId, rawKey);
  await store.storeKeyHash(env, user.id, keyId, keyHash);
  return json({ ok: true, api_key: rawKey, note: 'This key is shown only once. Store it securely.' });
}

async function handleDeleteKey(env, req, keyId) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  await store.deleteApiKey(env, user.id, keyId);
  return json({ ok: true });
}

async function handleListKeys(env, req) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  const keys = (await store.listApiKeys(env, user.id)).map(k => ({
    id: k.id, name: k.name, created_at: k.created_at, last_used_at: k.last_used_at || null,
  }));
  return json({ ok: true, keys });
}

async function handleDashboardData(env, req) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  const q = await checkQuota(env, user.id);
  const keys = (await store.listApiKeys(env, user.id)).map(k => ({
    id: k.id, name: k.name, created_at: k.created_at, last_used_at: k.last_used_at || null,
  }));
  return json({
    ok: true,
    email: user.email,
    plan: user.plan,
    planQuota: q.plan.quota,
    planPrice: q.plan.price,
    usage: q.count,
    period: q.period,
    remaining: q.remaining,
    keys,
    billingConfigured: Boolean(env.STRIPE_SECRET_KEY),
  });
}

// ---- Stripe ----
async function handleCheckout(env, req) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.STRIPE_SECRET_KEY)
    return json({ ok: false, error: 'billing_not_configured', message: 'Stripe is not configured yet. Please contact support.' }, 503);
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const planKey = String(body.plan || '');
  const plan = PLANS[planKey];
  if (!plan || !plan.priceEnv) return json({ ok: false, error: 'invalid_plan' }, 400);
  const priceId = env[plan.priceEnv];
  if (!priceId) return json({ ok: false, error: 'price_not_configured', message: 'This plan is not configured in Stripe yet.' }, 503);
  const origin = new URL(req.url).origin;
  const session = await createCheckoutSession(env, {
    priceId,
    customerEmail: user.email,
    metadata: { user_id: user.id, plan: planKey },
    successUrl: `${origin}/dashboard?billing=success`,
    cancelUrl: `${origin}/pricing?billing=cancelled`,
  });
  if (!session.url) return json({ ok: false, error: 'stripe_error', message: 'Could not create checkout session.' }, 502);
  return json({ ok: true, url: session.url });
}

async function handlePortal(env, req) {
  const user = await getSessionUser(env, req);
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'billing_not_configured' }, 503);
  const full = await store.getUser(env, user.id);
  if (!full?.stripe_customer_id) return json({ ok: false, error: 'no_subscription', message: 'No active subscription found.' }, 404);
  const origin = new URL(req.url).origin;
  const portal = await createPortalSession(env, full.stripe_customer_id, `${origin}/dashboard`);
  if (!portal.url) return json({ ok: false, error: 'stripe_error' }, 502);
  return json({ ok: true, url: portal.url });
}

async function handleStripeWebhook(env, req) {
  const sig = req.headers.get('stripe-signature') || '';
  const raw = await req.text();
  const ok = await verifyWebhookSignature(raw, sig, env.STRIPE_WEBHOOK_SECRET || '');
  if (!ok) return new Response('bad signature', { status: 400 });
  let event;
  try { event = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }
  await handleStripeEvent(env, event, PLANS);
  return new Response('ok', { status: 200 });
}

function sitemapXml(req) {
  const host = new URL(req.url).host;
  const base = `https://${host}`;
  const pages = ["", "/pricing", "/docs", "/faq", "/signup", "/login",
    "/zerobounce-alternative", "/neverbounce-alternative",
    "/millionverifier-alternative", "/bouncer-alternative"];
  const urls = pages.map(p => `  <url><loc>${base}${p || "/"}</loc><changefreq>weekly</changefreq><priority>${p === "" ? "1.0" : "0.8"}</priority></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      if (path === '/api/check' && req.method === 'GET') return await handleCheck(env, req);
      if (path === '/api/check-batch' && req.method === 'POST') return await handleCheckBatch(env, req);
      if (path === '/api/auth/signup' && req.method === 'POST') return await handleSignup(env, req);
      if (path === '/api/auth/login' && req.method === 'POST') return await handleLogin(env, req);
      if (path === '/api/auth/logout' && req.method === 'POST') return await handleLogout(env, req);
      if (path === '/api/keys' && req.method === 'POST') return await handleCreateKey(env, req);
      if (path === '/api/keys' && req.method === 'GET') return await handleListKeys(env, req);
      if (path.startsWith('/api/keys/') && req.method === 'DELETE') return await handleDeleteKey(env, req, path.slice('/api/keys/'.length));
      if (path === '/api/dashboard' && req.method === 'GET') return await handleDashboardData(env, req);
      if (path === '/api/billing/checkout' && req.method === 'POST') return await handleCheckout(env, req);
      if (path === '/api/billing/portal' && req.method === 'POST') return await handlePortal(env, req);
      if (path === '/webhooks/stripe' && req.method === 'POST') return await handleStripeWebhook(env, req);

      if (path === '/' || path === '/index.html') return renderPage(pageLanding());
      if (path === '/pricing') return renderPage(pagePricing());
      if (path === '/signup') return renderPage(pageSignup());
      if (path === '/login') return renderPage(pageLogin());
      if (path === '/docs') return renderPage(pageDocs());
      if (path === '/faq') return renderPage(pageFaq());
      if (path === '/zerobounce-alternative') return renderPage(pageAlt_zerobounce());
      if (path === '/neverbounce-alternative') return renderPage(pageAlt_neverbounce());
      if (path === '/millionverifier-alternative') return renderPage(pageAlt_millionverifier());
      if (path === '/bouncer-alternative') return renderPage(pageAlt_bouncer());
      if (path === '/sitemap.xml') return sitemapXml(req);
      if (path === '/robots.txt') return new Response("User-agent: *\nAllow: /\nSitemap: https://" + new URL(req.url).host + "/sitemap.xml\n", { headers: { "Content-Type": "text/plain" } });
      if (path === '/dashboard') {
        const gate = await requireAuthPage(env, req);
        if (gate) return gate;
        return renderPage(pageDashboard());
      }
      return renderPage(pageLanding(), 404);
    } catch (e) {
      return json({ ok: false, error: 'internal_error' }, 500);
    }
  },
};
