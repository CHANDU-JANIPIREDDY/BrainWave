const express = require('express');

const { login, me, logout } = require('../controllers/authController');
const { requireAuthJWT } = require('../middlewares/requireAuthJWT');

const authRoutes = express.Router();

// POST /api/auth/login
authRoutes.post('/login', login);

// GET /api/auth/me
authRoutes.get('/me', requireAuthJWT(), me);
authRoutes.post('/logout', requireAuthJWT(), logout);

module.exports = { authRoutes };

