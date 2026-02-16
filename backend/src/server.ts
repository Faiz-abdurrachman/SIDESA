import app from './app';
import { config } from './config';
import prisma from './prisma/client';

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  server.close();
});
