function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRenderOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && (url.hostname === 'onrender.com' || url.hostname.endsWith('.onrender.com'));
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin, configured) {
  if (!origin) return true;

  const allowed = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...parseOrigins(configured),
  ]);

  return allowed.has(origin) || isRenderOrigin(origin);
}

function corsOriginDelegate(configured) {
  return (origin, callback) => {
    callback(null, isAllowedOrigin(origin, configured));
  };
}

module.exports = { parseOrigins, isAllowedOrigin, corsOriginDelegate };
