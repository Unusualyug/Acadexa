import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startJobs } from './jobs/index.js';

async function bootstrap() {
  await connectDB();
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`[server] Acadexa API listening on http://0.0.0.0:${env.port} (${env.nodeEnv})`);
  });
  startJobs();

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, closing gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
}

bootstrap().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
