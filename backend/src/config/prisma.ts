import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (e.duration > 1000) {
      logger.warn('Slow query detected', {
        query: e.query,
        duration: e.duration,
      });
    }
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma error', { message: e.message });
});

export { prisma };
