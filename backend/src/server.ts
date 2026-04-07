import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Banco de dados conectado');

    const server = app.listen(config.port, () => {
      logger.info(`🚀 AgilDoc API rodando na porta ${config.port}`);
      logger.info(`📌 Ambiente: ${config.nodeEnv}`);
      logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Recebido ${signal}, encerrando servidor...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Servidor encerrado');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Falha ao iniciar servidor', { error });
    process.exit(1);
  }
}

startServer();
