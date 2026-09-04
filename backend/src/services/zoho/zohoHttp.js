const axios = require('axios');
const { getZohoAccessToken } = require('./zohoOAuth');
const { AppError } = require('../../utils/httpErrors');
const { logZohoResponse, pickZohoCode, pickZohoMessage } = require('./zohoSafeLog');

function publicMessageFromZoho(data, fallback) {
  const message = pickZohoMessage(data);
  const code = pickZohoCode(data);
  const combined = [code, message].filter(Boolean).join(': ') || fallback || 'Zoho API request failed';
  if (/client_secret|refresh_token|access_token|zoho-oauthtoken/i.test(combined)) {
    return 'Zoho integration is temporarily unavailable.';
  }
  return String(combined);
}

async function zohoApiRequest({ baseUrl, method = 'GET', path = '', query, body, headers = {} }) {
  if (!baseUrl) {
    throw new AppError('Zoho API base URL is not configured', 500);
  }

  const token = await getZohoAccessToken();
  const cleanBase = String(baseUrl).replace(/\/+$/, '');
  const cleanPath = path ? (String(path).startsWith('/') ? path : `/${path}`) : '';
  const url = `${cleanBase}${cleanPath}`;

  try {
    const res = await axios.request({
      method,
      url,
      params: query || undefined,
      data: body === undefined ? undefined : body,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        ...headers,
      },
      timeout: 30_000,
    });
    logZohoResponse({ method, url, status: res.status, data: res.data });
    return { data: res.data, status: res.status, url };
  } catch (error) {
    const status = error.response?.status || 502;
    const data = error.response?.data;
    logZohoResponse({ method, url, status, data });

    const wrapped = new AppError(publicMessageFromZoho(data, error.message), status);
    wrapped.response = error.response;
    wrapped.zohoEndpoint = `${String(method).toUpperCase()} ${url}`;
    throw wrapped;
  }
}

module.exports = { zohoApiRequest };
