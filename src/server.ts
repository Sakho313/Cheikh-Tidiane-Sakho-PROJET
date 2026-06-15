import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { prisma } from './config/database';

const server = app.listen(env.PORT, () => {
  console.log('─────────────────────────────────────────────');
  console.log('  NIS2 Compliance Management API');
  console.log('─────────────────────────────────────────────');
  console.log(`  Environment : ${env.NODE_ENV}`);
  console.log(`  Port        : ${env.PORT}`);
  console.log(`  URL         : http://localhost:${env.PORT}`);
  console.log(`  API Base    : http://localhost:${env.PORT}/api/v1`);
  console.log(`  Health      : http://localhost:${env.PORT}/health`);
  console.log('─────────────────────────────────────────────');
});

// Graceful shutdown
function shutdown(signal: string): void {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error disconnecting from database:', err);
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
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
