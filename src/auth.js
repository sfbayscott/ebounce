// Auth helpers: PBKDF2 password hashing, KV sessions, SHA-256 API key hashing.
import { getUser, getSession, deleteSession } from './store.js';

function b64encode(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(s) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function randomToken(n) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$100000$${b64encode(salt)}$${b64encode(bits)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [, iterStr, saltB64, hashB64] = stored.split('$');
    const iterations = parseInt(iterStr, 10);
    const salt = b64decode(saltB64);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
    return b64encode(bits) === hashB64;
  } catch { return false; }
}

export async function getSessionUser(env, req) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/ms_session=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const sess = await getSession(env, m[1]);
  if (!sess || sess.expires_at < Date.now()) {
    if (sess) await deleteSession(env, m[1]);
    return null;
  }
  return getUser(env, sess.user_id);
}

export async function requireAuthPage(env, req) {
  const user = await getSessionUser(env, req);
  if (user) return null;
  return new Response(null, { status: 302, headers: { Location: '/login?next=/dashboard' } });
}
