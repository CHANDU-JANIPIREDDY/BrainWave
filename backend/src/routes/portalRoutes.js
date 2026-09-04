const express = require('express');
const { listAuthorizedApps } = require('../controllers/portalController');
const { requireAuthJWT } = require('../middlewares/requireAuthJWT');

const portalRoutes = express.Router();

// Protected: returns the Zoho applications authorized for the authenticated portal user.
portalRoutes.get('/applications', requireAuthJWT(), listAuthorizedApps);

module.exports = { portalRoutes };

