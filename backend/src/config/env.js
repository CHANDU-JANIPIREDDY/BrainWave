const requiredEnv = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
};

function requireJwtSecret() {
  const secret = requiredEnv('JWT_SECRET');
  const weak = /^(dev_secret_change_me|replace_me_with_a_long_random_secret|secret|changeme)$/i.test(secret.trim());
  if (weak || secret.trim().length < 32) {
    throw new Error('JWT_SECRET must be a random value at least 32 characters long. Set it in the root .env file.');
  }
  return secret;
}

function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || value === '1';
}

const env = {
  PORT: process.env.PORT || 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  MONGO_URI: requiredEnv('MONGO_URI'),
  JWT_SECRET: requireJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',

  ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
  ZOHO_OAUTH_TOKEN_URL:
    process.env.ZOHO_OAUTH_TOKEN_URL || 'https://accounts.zoho.in/oauth/v2/token',

  ZOHO_PEOPLE_PORTAL_URL: process.env.ZOHO_PEOPLE_PORTAL_URL || 'https://people.zoho.in/',
  ZOHO_CRM_PORTAL_URL: process.env.ZOHO_CRM_PORTAL_URL || 'https://crm.zoho.in/',
  ZOHO_DESK_PORTAL_URL: process.env.ZOHO_DESK_PORTAL_URL || 'https://desk.zoho.in/',
  ZOHO_BOOKS_PORTAL_URL: process.env.ZOHO_BOOKS_PORTAL_URL || 'https://books.zoho.in/',

  ZOHO_PEOPLE_API_BASE_URL: process.env.ZOHO_PEOPLE_API_BASE_URL || 'https://people.zoho.in/people/api',
  ZOHO_CRM_API_BASE_URL: process.env.ZOHO_CRM_API_BASE_URL || 'https://www.zohoapis.in/crm/v2',
  ZOHO_DESK_API_BASE_URL: process.env.ZOHO_DESK_API_BASE_URL || 'https://desk.zoho.in/api/v1',
  ZOHO_BOOKS_API_BASE_URL: process.env.ZOHO_BOOKS_API_BASE_URL || 'https://www.zohoapis.in/books/v3',

  ZOHO_DESK_MOCK_MODE: asBool(process.env.ZOHO_DESK_MOCK_MODE, true),
  ZOHO_DESK_ORG_ID: process.env.ZOHO_DESK_ORG_ID || '',
  ZOHO_BOOKS_ORGANIZATION_ID: process.env.ZOHO_BOOKS_ORGANIZATION_ID || '',
  ZOHO_BOOKS_ORG_ID: process.env.ZOHO_BOOKS_ORG_ID || process.env.ZOHO_BOOKS_ORGANIZATION_ID || '',
};

module.exports = { env };
