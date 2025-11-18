/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');
const pinoHttp = require('pino-http');

const connectToDatabase = require('./models/db');
const { loadData } = require('./util/import-mongo/index');

// Services
const { startMonthlyResetCron } = require('./services/cronJobs');

// Routes
const authRoutes = require('./routes/authRoutes');
const giftRoutes = require('./routes/giftRoutes');
const searchRoutes = require('./routes/searchRoutes');
const itemRoutes = require('./routes/itemRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
const port = process.env.PORT || 3060;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger: pinoLogger }));

// ✅ Rate Limiting
app.use('/api/', generalLimiter); // Apply to all API routes
app.use('/api/auth/', authLimiter); // Stricter limit for auth routes

// ✅ Database Connection
connectToDatabase()
  .then(() => {
    pinoLogger.info('✅ Connected to MongoDB successfully');
    
    // Start cron jobs after successful DB connection
    startMonthlyResetCron();
    pinoLogger.info('✅ Cron jobs initialized');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error);
  });

// ✅ Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);

// ✅ Root Route (health check)
app.get('/', (req, res) => {
  res.send('GiftLink backend is running successfully 🚀');
});

// ✅ 404 Handler - Must be after all routes
app.use(notFoundHandler);

// ✅ Global Error Handler - Must be last
app.use(errorHandler);

// ✅ Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
