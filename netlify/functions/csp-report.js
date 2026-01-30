exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: 'Method Not Allowed',
    };
  }

  let report = null;
  try {
    report = event.body ? JSON.parse(event.body) : null;
  } catch (e) {
    report = null;
  }

  if (report) {
    try {
      console.log('CSP violation report:', JSON.stringify(report));
    } catch (e) {
      // ignore
    }
  }

  return {
    statusCode: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
    body: '',
  };
};
