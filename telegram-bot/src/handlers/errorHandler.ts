import { Telegraf } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';

export function setupErrorHandlers(bot: Telegraf<MyContext>) {
  // Error handler de Telegraf
  bot.catch((err, ctx) => {
    const error = err as Error;
    
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      update: ctx.update 
    }, 'Bot error occurred');

    // Responder al usuario de forma amigable
    ctx.reply(
      '😔 Ocurrió un error inesperado. Por favor intenta nuevamente.\n' +
      'Si el problema persiste, usa /ayuda para contactar soporte.'
    ).catch(e => {
      logger.error({ error: e }, 'Failed to send error message');
    });
  });

  // Errores no capturados de Node.js
  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled promise rejection');
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    
    try {
      bot.stop(signal);
      logger.info('Bot stopped gracefully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
