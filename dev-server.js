// Development server that handles API routes
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Import API handlers
import authHandler from './api/auth.js';
import seedHandler from './api/seed.js';
import usersHandler from './api/users.js';
import vehiclesHandler from './api/vehicles.js';

// Middleware
app.use(express.json());

// API routes
app.use('/api/auth', authHandler);
app.use('/api/seed', seedHandler);
app.use('/api/users', usersHandler);
app.use('/api/vehicles', vehiclesHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📁 Serving API routes: /api/auth, /api/seed, /api/users, /api/vehicles`);
});
