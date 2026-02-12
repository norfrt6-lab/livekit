import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import roomRoutes, { roomErrorHandler } from './routes/room.routes';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  console.error('\nPlease create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: config.server.corsOrigins,
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/rooms', roomRoutes);

// Error handler
app.use(roomErrorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           LiveKit Interactive Show Server                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running on port ${config.server.port}                               ║
║  Environment: ${config.server.nodeEnv.padEnd(20)}                    ║
║  LiveKit URL: ${config.livekit.wsUrl.slice(0, 35).padEnd(35)}      ║
╚═══════════════════════════════════════════════════════════════╝

API Endpoints:
  POST   /api/rooms              - Create a new room
  GET    /api/rooms              - List all rooms
  GET    /api/rooms/:name        - Get room info
  POST   /api/rooms/:name/join   - Join as viewer
  POST   /api/rooms/:name/guest/invite - Invite guest (host)
  DELETE /api/rooms/:name/guest  - Remove guest (host)
  POST   /api/rooms/:name/start  - Start the show
  POST   /api/rooms/:name/end    - End the show
  GET    /api/rooms/:name/viewers - Get viewer count
  GET    /health                 - Health check
`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
