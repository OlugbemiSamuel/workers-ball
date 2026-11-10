require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { getDb } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple admin auth middleware
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Attach db getter to app for routes
app.getDb = getDb;

// Public routes (no auth)
app.use('/api/guests', require('./src/routes/guests'));
app.use('/api/accredit', require('./src/routes/accredit'));
app.use('/api/tickets', require('./src/routes/tickets'));
app.use('/api/import-export', require('./src/routes/import-export'));
app.use('/api/reports', require('./src/routes/reports'));

// Auth route for admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
    return res.json({ success: true, token: `Basic ${token}` });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', event: process.env.EVENT_NAME, timestamp: new Date().toISOString() });
});

// Serve static React build in production
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
} else {
  app.get('*', (req, res) => {
    res.json({ message: 'Workers Ball API running. Frontend build not found. Build client and copy to /public.' });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize database then start server
(async () => {
  try {
    await getDb();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Workers Ball Accreditation server running on port ${PORT}`);
      console.log(`Event: ${process.env.EVENT_NAME}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();

module.exports = app;
