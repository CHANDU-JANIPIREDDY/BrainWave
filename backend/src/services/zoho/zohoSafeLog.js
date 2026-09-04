const SECRET_KEY = /token|secret|authorization|password|client_id|refresh|access_token/i;

function redactValue(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (/zoho-oauthtoken|client_secret|refresh_token|access_token|1000\.[A-Za-z0-9]{8,}/i.test(value)) {
      return '[redacted]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : redactValue(nested);
    }
    return out;
  }
  return value;
}

function pickZohoCode(data) {
  if (!data || typeof data !== 'object') return null;
  return data.code || data.error || data.errorCode || data.ERRORCODE || null;
}

function pickZohoMessage(data) {
  if (data == null) return null;
  if (typeof data === 'string') return data;
  return data.message || data.error || data.msg || null;
}

function logZohoResponse({ method, url, status, data }) {
  const body = redactValue(data);
  // eslint-disable-next-line no-console
  console.log(
    '[Zoho]',
    JSON.stringify({
      endpoint: `${String(method || 'GET').toUpperCase()} ${url}`,
      httpStatus: status ?? null,
      zohoCode: pickZohoCode(body),
      zohoMessage: pickZohoMessage(body),
      body,
    }),
  );
}

module.exports = { redactValue, pickZohoCode, pickZohoMessage, logZohoResponse };
