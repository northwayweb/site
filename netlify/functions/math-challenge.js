const crypto = require('crypto');

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

exports.handler = async () => {
  const secret = process.env.MATH_CHALLENGE_SECRET;

  if (!secret) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server is missing MATH_CHALLENGE_SECRET' }),
    };
  }

  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const iat = Date.now();

  const payloadJson = JSON.stringify({ a, b, iat });
  const payloadB64 = base64UrlEncode(payloadJson);

  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64');
  const sigB64 = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const token = `${payloadB64}.${sigB64}`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({
      question: `${a} + ${b} =`,
      token,
    }),
  };
};
