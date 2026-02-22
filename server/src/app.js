import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import ledgerRoutes from './routes/ledger.routes.js';
import { requireDatabase } from './middleware/dbReady.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
app.set('dbReady', () => false);

const parseAllowedOrigins = () => {
  const values = [];

  if (process.env.CLIENT_ORIGIN) {
    values.push(process.env.CLIENT_ORIGIN);
  }

  if (process.env.CLIENT_ORIGINS) {
    values.push(...process.env.CLIENT_ORIGINS.split(','));
  }

  return values
    .map((item) => item.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const isLocalhostOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch (_error) {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS: origin not allowed'));
    }
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  const getDbReady = app.get('dbReady');
  const isDbReady = typeof getDbReady === 'function' ? getDbReady() : false;

  if (!isDbReady) {
    return res.status(503).json({
      ok: false,
      message: 'API is running, but database is unavailable'
    });
  }

  return res.json({
    ok: true,
    message: 'LedgerBook API is healthy'
  });
});

app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/ledger', requireDatabase, ledgerRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
