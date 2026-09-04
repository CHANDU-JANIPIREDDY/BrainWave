const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { env } = require('./config/env');

const { authRoutes } = require('./routes/authRoutes');
const { portalRoutes } = require('./routes/portalRoutes');
const { adminRoutes } = require('./routes/adminRoutes');
const { zohoRoutes } = require('./routes/zohoRoutes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes
  app.use('/api/portal', portalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/zoho', zohoRoutes);

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.expose ? err.message : 'Internal server error';
    res.status(status).json({ success: false, message });
  });

  return app;
}

module.exports = { createApp };

