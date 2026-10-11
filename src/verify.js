// Email verification engine: syntax, MX (via DNS-over-HTTPS), disposable, role-based.
// Same checks as the original eBounce prefilter. Workers cannot open raw
// SMTP sockets, so this is a prefilter-grade check (no SMTP handshake).

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'info', 'support', 'sales', 'contact', 'help',
  'hello', 'mail', 'webmaster', 'postmaster', 'abuse', 'noreply', 'no-reply',
  'billing', 'careers', 'jobs', 'hr', 'marketing', 'press', 'media', 'team',
  'office', 'service', 'services', 'accounts', 'enquiries', ' inquiries'.trim(),
  'feedback', 'subscribe', 'unsubscribe', 'newsletter', 'notifications',
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'throwaway.email', 'trashmail.com', 'yopmail.com', 'getnada.com',
  'temp-mail.org', 'sharklasers.com', 'guerrillamailblock.com', 'dispostable.com',
  'maildrop.cc', 'fakeinbox.com', 'trashmail.net', 'mintemail.com',
  'mytemp.email', 'emailondeck.com', 'mohmal.com', 'tempail.com',
  'tempmailo.com', 'tmail.ws', 'mailnesia.com', 'crazymailing.com',
  'spamgourmet.com', 'jetable.org', 'binkmail.com', 'e4ward.com',
  'mailcatch.com', 'soodonims.com', 'opayq.com', 'inboxkitten.com',
  '20minutemail.com', 'anonbox.net', 'deadaddress.com', 'filzmail.com',
  'spambox.us', 'spambog.com', 'trash2009.com', 'xagloo.com',
  'wegwerfmail.de', 'trash-mail.com', 'meltmail.com', 'bobmail.info',
  'chacuo.net', 'disbox.net', 'dodgeit.com', 'dontreg.com',
  'harakirimail.com', 'incognitomail.com', 'ipoo.org', 'jetable.com',
  'kasmail.com', 'klzlk.com', 'kulturbetrieb.info', 'lhsdv.com',
  'lifebyfood.com', 'lookugly.com', 'lr78.com', 'm4ilweb.info',
  'mail4trash.com', 'mailnull.com', 'massreward.com', 'mt2009.com',
  'mx0.wwwnew.eu', 'mytrashmail.com', 'nervmich.net', 'netmails.com',
  'netzidiot.de', 'nurfuerspam.de', 'owlpic.com', 'proxymail.eu',
  'rcpt.at', 'safetymail.info', 'saynotospams.com', 'schafmail.de',
  'snakemail.com', 'sofort-mail.de', 'sudzmail.com', 'teewars.com',
  'teleworm.com', 'twinmail.de', 'upliftnow.com', 'venompen.com',
  'willselfdestruct.com', 'xoxy.net', 'yogamaven.com', 'zippymail.info',
  '0-mail.com', '0815.ru', '1chuan.com', '1zhuan.com', 'amail.com',
]);

async function getMxHosts(domain) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const res = await fetch(url, { headers: { accept: 'application/dns-json' } });
    if (!res.ok) return null; // network issue -> unknown
    const data = await res.json();
    const hosts = [];
    for (const a of data.Answer || []) {
      if (a.type === 15) {
        const parts = String(a.data).split(' ');
        if (parts.length === 2) hosts.push(`${parts[0]} ${parts[1]}`);
      }
    }
    return hosts;
  } catch { return null; }
}

export async function verifyEmail(email) {
  const e = String(email || '').trim();
  const result = { email: e, syntax: false, mx: false, disposable: false, role_based: false, verdict: 'fail', reason: '' };

  if (!EMAIL_RE.test(e) || e.length > 254) { result.reason = 'bad-syntax'; return result; }
  result.syntax = true;

  const domain = e.split('@')[1].toLowerCase();
  const local = e.split('@')[0].toLowerCase();

  if (DISPOSABLE_DOMAINS.has(domain)) { result.disposable = true; result.reason = 'disposable'; return result; }
  if (ROLE_PREFIXES.has(local)) { result.role_based = true; result.reason = 'role-based'; return result; }

  const mx = await getMxHosts(domain);
  if (mx === null) { result.reason = 'dns-error'; return result; }
  if (mx.length === 0) { result.reason = 'no-mx'; return result; }
  result.mx = true;
  result.mx_hosts = mx;

  result.verdict = 'pass';
  result.reason = 'ok';
  return result;
}
