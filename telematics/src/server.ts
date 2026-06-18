import 'dotenv/config';
import { createServer } from 'http';
import { env } from './config/env';
import app from './app';
import { prisma } from './config/database';
import { initSocket } from './realtime/socket';

const httpServer = createServer(app);

// Serveur temps réel (suivi live de la flotte) attaché au même port HTTP.
initSocket(httpServer);

const server = httpServer.listen(env.PORT, () => {
  console.log('─────────────────────────────────────────────');
  console.log('  SAO Telematics API');
  console.log('─────────────────────────────────────────────');
  console.log(`  Environment : ${env.NODE_ENV}`);
  console.log(`  Port        : ${env.PORT}`);
  console.log(`  URL         : http://localhost:${env.PORT}`);
  console.log(`  API Base    : http://localhost:${env.PORT}/api/v1`);
  console.log(`  Docs        : http://localhost:${env.PORT}/api/docs`);
  console.log(`  WebSocket   : ws://localhost:${env.PORT}  (Socket.IO)`);
  console.log('─────────────────────────────────────────────');
});

function shutdown(signal: string): void {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed');
    prisma
      .$disconnect()
      .then(() => {
        console.log('Database connection closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error disconnecting from database:', err);
        process.exit(1);
      });
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
