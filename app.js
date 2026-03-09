import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import db from './src/config/database.js';
import Mustahiq from './src/models/mustahiqModel.js';
import Muzakki from './src/models/muzakkiModel.js';
import Distribusi from './src/models/distribusiModel.js';
import Penerimaan from './src/models/penerimaanModel.js';
import User from './src/models/userModel.js';
import userRoute from './src/routes/userRoute.js';
import authRoute from './src/routes/authRoute.js';
import mustahiqRoute from './src/routes/mustahiqRoute.js';
import muzakkiRoute from './src/routes/muzakkiRoute.js';
import penerimaanRoute from './src/routes/penerimaanRoute.js';
import distribusiRoute from './src/routes/distribusiRoute.js';
import dashboardRoute from './src/routes/dashboardRoute.js';
import laporanRoute from './src/routes/laporanRoute.js';
import migrasiRoute from './src/routes/migrasiRoute.js';
import auditLogRoute from './src/routes/auditLogRoute.js';
import referenceRoute from './src/routes/referenceRoute.js';
import logger from './src/utils/logger.js';

dotenv.config();

// Validate wajib env vars di awal
if (!process.env.JWT_SECRET) {
  logger.error('[FATAL] JWT_SECRET is not set in environment variables. Server will not start.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// --- Security & Performance Middleware ---
app.use(helmet());

// CORS: batasi origin sesuai environment
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile app, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true
}));

app.use(compression());

// Logging: alihkan Morgan stream ke Winston logger
app.use(morgan(isProduction ? 'combined' : 'dev', { stream: logger.stream }));

// Body parser dengan limit size untuk mencegah payload bomb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 999999,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP ini, coba lagi setelah 15 menit.'
  }
});

// Rate limit lebih ketat khusus untuk login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit.'
  }
});

app.use('/api', limiter);

// --- Define Associations ---
Mustahiq.hasMany(Distribusi, { foreignKey: 'mustahiq_id' });
Distribusi.belongsTo(Mustahiq, { foreignKey: 'mustahiq_id' });

Muzakki.hasMany(Penerimaan, { foreignKey: 'muzakki_id' });
Penerimaan.belongsTo(Muzakki, { foreignKey: 'muzakki_id' });

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth/login', loginLimiter); // login rate limit lebih ketat
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/mustahiq', mustahiqRoute);
app.use('/api/muzakki', muzakkiRoute);
app.use('/api/penerimaan', penerimaanRoute);
app.use('/api/distribusi', distribusiRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/laporan', laporanRoute);
app.use('/api/migrasi', migrasiRoute);
app.use('/api/audit-log', auditLogRoute);
app.use('/api/ref', referenceRoute);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' tidak ditemukan.`
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, url: req.originalUrl, method: req.method });

  // CORS error
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode < 500 ? err.message : 'Terjadi kesalahan pada server.',
    // Hanya tampilkan detail error di development
    ...(isProduction ? {} : { error: err.message })
  });
});

// --- Connect to Database & Start Server ---
// CATATAN MIGRATION: Skema database dikelola via Sequelize Migrations.
// Untuk menjalankan migration: npx sequelize-cli db:migrate
// Untuk rollback:              npx sequelize-cli db:migrate:undo
(async () => {
  try {
    await db.authenticate();
    logger.info('[DB] Database connected.');
    // Server baru listen SETELAH DB siap
    const server = app.listen(port, () => {
      logger.info(`[SERVER] Running on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    // --- Graceful Shutdown ---
    const shutdown = (signal) => {
      logger.warn(`[SERVER] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await db.close();
        logger.info('[SERVER] HTTP server closed. Database connection closed.');
        process.exit(0);
      });

      // Force exit setelah 10 detik jika masih ada koneksi
      setTimeout(() => {
        logger.error('[SERVER] Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('[FATAL] Could not connect to the database:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
})();
