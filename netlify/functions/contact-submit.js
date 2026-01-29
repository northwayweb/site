const crypto = require('crypto');

function base64UrlDecodeToString(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getSiteUrl(event) {
  const proto = (event.headers && (event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto'])) || 'https';
  const host = (event.headers && (event.headers.host || event.headers.Host)) || '';

  if (process.env.URL) return process.env.URL;
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;
  if (process.env.SITE_URL) return process.env.SITE_URL;

  if (host) return `${proto}://${host}`;
  return '';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secret = process.env.MATH_CHALLENGE_SECRET;
  if (!secret) {
    return {
      statusCode: 500,
      body: 'Server is missing MATH_CHALLENGE_SECRET',
    };
  }

  const params = new URLSearchParams(event.body || '');

  const honeypot = String(params.get('bot-field') || '').trim();
  if (honeypot) {
    return {
      statusCode: 303,
      headers: { Location: '/thanks.html?submitted=1' },
      body: '',
    };
  }

  const token = String(params.get('math_token') || '').trim();
  const answerRaw = String(params.get('math_answer') || '').trim();
  const answer = Number.parseInt(answerRaw, 10);

  if (!token || Number.isNaN(answer)) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=challenge#contact' },
      body: '',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=challenge#contact' },
      body: '',
    };
  }

  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64');
  const expectedSigB64 = expectedSig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const expectedBuf = Buffer.from(expectedSigB64);
  const actualBuf = Buffer.from(sigB64);
  const sigOk = expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
  if (!sigOk) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=challenge#contact' },
      body: '',
    };
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64));
  } catch (e) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=challenge#contact' },
      body: '',
    };
  }

  const a = Number(payload.a);
  const b = Number(payload.b);
  const iat = Number(payload.iat);

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(iat)) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=challenge#contact' },
      body: '',
    };
  }

  const maxAgeMs = 10 * 60 * 1000;
  if (Date.now() - iat > maxAgeMs) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=expired#contact' },
      body: '',
    };
  }

  if (answer !== a + b) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=incorrect#contact' },
      body: '',
    };
  }

  const formName = String(params.get('form-name') || 'contact');

  const forward = new URLSearchParams();
  forward.set('form-name', formName);
  forward.set('name', String(params.get('name') || ''));
  forward.set('business', String(params.get('business') || ''));
  forward.set('email', String(params.get('email') || ''));
  forward.set('message', String(params.get('message') || ''));
  forward.set('bot-field', '');

  const siteUrl = getSiteUrl(event);
  if (!siteUrl) {
    return {
      statusCode: 500,
      body: 'Unable to determine site URL for forwarding',
    };
  }

  const res = await fetch(`${siteUrl}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: forward.toString(),
  });

  if (!res.ok) {
    return {
      statusCode: 303,
      headers: { Location: '/?error=submit#contact' },
      body: '',
    };
  }

  return {
    statusCode: 303,
    headers: { Location: '/thanks.html?submitted=1' },
    body: '',
  };
};
