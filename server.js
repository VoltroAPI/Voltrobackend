require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const swaggerRoutes = require('./src/routes/swaggerRoutes');
const { setupDatabase } = require('./src/models/init');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow specific origins in production, all in development
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : '*';

if (allowedOrigins === '*') {
  app.use(cors());
} else {
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Trust proxy — needed if behind IIS/Azure/reverse proxy for correct IP & protocol
app.set('trust proxy', 1);

app.use('/api', routes);
app.use('/', swaggerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  if ([2627, 2601, 547].includes(err.number)) {
    status = 409;
    message = 'Database constraint violated (duplicate or invalid reference)';
  }
  res.status(status).json({ success: false, message });
});

if (require.main === module) {
  setupDatabase()
    .then(() => app.listen(PORT, () => console.log(`VoltroAPI listening on port ${PORT}`)))
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;