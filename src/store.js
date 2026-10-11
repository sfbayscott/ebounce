// KV-backed storage for eBounce.
// Keys: u:{id} user JSON | ue:{email} -> id | k:{keyHash} key meta |
//       kl:{userId} key list | s:{token} session | use:{userId}:{period} count

export async function getUser(env, id) {
  if (!id) return null;
  return env.KV.get(`u:${id}`, 'json');
}

export async function getUserByEmail(env, email) {
  const id = await env.KV.get(`ue:${email.toLowerCase()}`);
  return getUser(env, id);
}

export async function createUser(env, user) {
  await env.KV.put(`u:${user.id}`, JSON.stringify(user));
  await env.KV.put(`ue:${user.email.toLowerCase()}`, user.id);
}

export async function updateUser(env, id, patch) {
  const user = await getUser(env, id);
  if (!user) return null;
  Object.assign(user, patch);
  await env.KV.put(`u:${id}`, JSON.stringify(user));
  return user;
}

export async function getKeyOwner(env, keyHash) {
  return env.KV.get(`k:${keyHash}`, 'json');
}

export async function listApiKeys(env, userId) {
  return (await env.KV.get(`kl:${userId}`, 'json')) || [];
}

export async function createApiKeyRecord(env, userId, name, keyHash, keyId, rawKey) {
  await env.KV.put(`k:${keyHash}`, JSON.stringify({ user_id: userId, key_id: keyId, name }));
  const list = await listApiKeys(env, userId);
  list.push({ id: keyId, name, created_at: Date.now(), last_used_at: null });
  await env.KV.put(`kl:${userId}`, JSON.stringify(list));
}

export async function touchApiKey(env, keyHash) {
  const meta = await getKeyOwner(env, keyHash);
  if (!meta) return;
  const list = await listApiKeys(env, meta.user_id);
  const item = list.find(k => k.id === meta.key_id);
  if (item) {
    item.last_used_at = Date.now();
    await env.KV.put(`kl:${meta.user_id}`, JSON.stringify(list));
  }
}

export async function deleteApiKey(env, userId, keyId) {
  const list = await listApiKeys(env, userId);
  const item = list.find(k => k.id === keyId);
  if (!item) return false;
  // find keyHash: scan k: entries via list match (store hash in list for simplicity)
  await env.KV.delete(`k:${item.hash}`);
  await env.KV.put(`kl:${userId}`, JSON.stringify(list.filter(k => k.id !== keyId)));
  return true;
}

export async function storeKeyHash(env, userId, keyId, keyHash) {
  const list = await listApiKeys(env, userId);
  const item = list.find(k => k.id === keyId);
  if (item) {
    item.hash = keyHash;
    await env.KV.put(`kl:${userId}`, JSON.stringify(list));
  }
}

export async function getUsage(env, userId, period) {
  const v = await env.KV.get(`use:${userId}:${period}`);
  return v ? parseInt(v, 10) : 0;
}

export async function addUsage(env, userId, period, n) {
  const cur = await getUsage(env, userId, period);
  await env.KV.put(`use:${userId}:${period}`, String(cur + n));
}

export async function createSession(env, userId, token, ttlMs) {
  await env.KV.put(`s:${token}`, JSON.stringify({ user_id: userId, expires_at: Date.now() + ttlMs }), { expirationTtl: Math.ceil(ttlMs / 1000) });
}

export async function getSession(env, token) {
  return env.KV.get(`s:${token}`, 'json');
}

export async function deleteSession(env, token) {
  await env.KV.delete(`s:${token}`);
}
