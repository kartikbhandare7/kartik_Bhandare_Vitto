require('dotenv').config(); // must be FIRST — loads .env file

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectPostgres } = require('./config/postgres');
const { connectMongo }    = require('./config/mongo');

const profileRoutes  = require('./routes/profile.routes');
const loanRoutes     = require('./routes/loan.routes');
const decisionRoutes = require('./routes/decision.routes');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());                              // allow frontend to call this API
app.use(express.json({ limit: '10kb' }));    // parse JSON body, max 10kb
app.use(morgan('dev'));                        // log every request to console

// ── Health check — used by Render/Railway to verify the app is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/v1/profile',  profileRoutes);
app.use('/api/v1/loan',     loanRoutes);
app.use('/api/v1/decision', decisionRoutes);

// ── Error handling (must be registered AFTER routes) ───────────
app.use(notFound);      // catches any URL that doesn't match a route
app.use(errorHandler);  // catches any error thrown by a controller

// ── Start server ────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectPostgres(); // connect + auto-create tables
    await connectMongo();    // connect to MongoDB
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error(err); 
    process.exit(1);
  }
};

startServer();
