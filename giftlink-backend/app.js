/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');
const pinoHttp = require('pino-http');

const connectToDatabase = require('./models/db');
const { loadData } = require('./util/import-mongo/index');

// Routes
const authRoutes = require('./routes/authRoutes');
const giftRoutes = require('./routes/giftRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const port = process.env.PORT || 3060;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger: pinoLogger }));

// ✅ Database Connection
connectToDatabase()
  .then(() => {
    pinoLogger.info('✅ Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB:', error);
  });

// ✅ Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/search', searchRoutes);

// ✅ Root Route (health check)
app.get('/', (req, res) => {
  res.send('GiftLink backend is running successfully 🚀');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).send('Internal Server Error');
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
