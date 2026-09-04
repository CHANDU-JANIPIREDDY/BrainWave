const axios = require('axios');
const { env } = require('../../config/env');
const { AppError } = require('../../utils/httpErrors');

let accessToken = null;
let expiresAtMs = 0;
let refreshInFlight = null;

function shouldRefresh() {
  return !accessToken || Date.now() >= expiresAtMs - 60_000;
}

function assertOAuthConfig() {
  if (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET || !env.ZOHO_REFRESH_TOKEN) {
    throw new AppError('Zoho OAuth is not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.', 503);
  }
  if (/your_refresh_token_here/i.test(env.ZOHO_REFRESH_TOKEN)) {
    throw new AppError('Zoho refresh token is not set. Generate a Self Client refresh token and add it to .env.', 503);
  }
}

async function refreshAccessToken() {
  assertOAuthConfig();

  refreshInFlight = refreshInFlight || (async () => {
    try {
      const response = await axios.post(env.ZOHO_OAUTH_TOKEN_URL, null, {
        params: {
          refresh_token: env.ZOHO_REFRESH_TOKEN,
          client_id: env.ZOHO_CLIENT_ID,
          client_secret: env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
        timeout: 20_000,
      });

      const data = response.data || {};
      if (!data.access_token) {
        throw new AppError('Zoho did not return an access token. Check the refresh token and scopes.', 502);
      }

      accessToken = data.access_token;
      const expiresInSeconds = Number(data.expires_in || 0);
      expiresAtMs = expiresInSeconds > 0 ? Date.now() + expiresInSeconds * 1000 : Date.now() + 55 * 60 * 1000;
      return accessToken;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate a Zoho access token. Verify India DC OAuth credentials and refresh token.', 502);
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function getZohoAccessToken() {
  if (!shouldRefresh()) return accessToken;
  return refreshAccessToken();
}

module.exports = { getZohoAccessToken };
