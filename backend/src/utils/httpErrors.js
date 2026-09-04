class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function publicZohoError(error) {
  const status = Number(error?.status || error?.response?.status || 502);
  const raw = error?.response?.data;
  const zohoCode = raw && typeof raw === 'object' ? raw.code || raw.error || raw.errorCode : null;
  const zohoMessage =
    (typeof raw === 'string' && raw) ||
    raw?.message ||
    raw?.error ||
    error?.message ||
    'Zoho API request failed';

  const combined = [zohoCode, zohoMessage].filter(Boolean).join(': ');
  const safe = String(combined || zohoMessage);

  if (/client_secret|refresh_token|access_token|zoho-oauthtoken|1000\./i.test(safe)) {
    return { status: status >= 400 ? status : 502, message: 'Zoho integration is temporarily unavailable.' };
  }

  return { status: status >= 400 && status < 600 ? status : 502, message: safe };
}

module.exports = { AppError, sendError, sendSuccess, publicZohoError };
