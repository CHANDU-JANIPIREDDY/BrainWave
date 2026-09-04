const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const User = require('../models/User');

function requireAuthJWT() {
  return async function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.sub).lean();
      if (!user || user.isDeleted) return res.status(401).json({ success: false, message: 'Unauthorized' });

      req.auth = {
        userId: user._id.toString(),
        username: user.username,
      };

      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }
  };
}

module.exports = { requireAuthJWT };

