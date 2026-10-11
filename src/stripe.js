// Stripe integration (KV version).
import { updateUser } from './store.js';

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripePost(env, path, params) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    body.append(k, v);
  }
  const res = await fetch(STRIPE_API + path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  return res.json();
}

export async function createCheckoutSession(env, { priceId, customerEmail, metadata, successUrl, cancelUrl }) {
  return stripePost(env, '/checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    'metadata[user_id]': metadata.user_id,
    'metadata[plan]': metadata.plan,
    'subscription_data[metadata][user_id]': metadata.user_id,
    'subscription_data[metadata][plan]': metadata.plan,
  });
}

export async function createPortalSession(env, customerId, returnUrl) {
  return stripePost(env, '/billing_portal/sessions', { customer: customerId, return_url: returnUrl });
}

async function hmacSha256Hex(key, data) {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyWebhookSignature(rawBody, sigHeader, webhookSecret) {
  if (!webhookSecret || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1) return false;
  const age = Math.abs(Date.now() / 1000 - parseInt(parts.t, 10));
  if (age > 300) return false;
  const expected = await hmacSha256Hex(webhookSecret, `${parts.t}.${rawBody}`);
  return timingSafeEqual(expected, parts.v1);
}

export function planFromPriceId(priceId, PLANS, env) {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceEnv && env[plan.priceEnv] === priceId) return key;
  }
  return null;
}

export async function handleStripeEvent(env, event, PLANS) {
  const type = event.type;
  const obj = event.data?.object || {};

  if (type === 'checkout.session.completed') {
    const userId = obj.metadata?.user_id;
    const plan = obj.metadata?.plan;
    if (userId && plan && PLANS[plan]) {
      await updateUser(env, userId, {
        plan,
        stripe_customer_id: obj.customer || null,
        stripe_subscription_id: obj.subscription || null,
      });
    }
  } else if (type === 'customer.subscription.updated') {
    const userId = obj.metadata?.user_id;
    const priceId = obj.items?.data?.[0]?.price?.id;
    const plan = priceId ? planFromPriceId(priceId, PLANS, env) : null;
    const active = ['active', 'trialing', 'past_due'].includes(obj.status);
    if (userId) {
      await updateUser(env, userId, {
        plan: active && plan ? plan : 'free',
        stripe_subscription_id: obj.id,
      });
    }
  } else if (type === 'customer.subscription.deleted') {
    const userId = obj.metadata?.user_id;
    if (userId) await updateUser(env, userId, { plan: 'free', stripe_subscription_id: null });
  }
}
