import type { Middleware } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';

export const loggerMiddleware: Middleware<MyContext> = async (ctx, next) => {
  const start = Date.now();
  const telegramId = ctx.from?.id?.toString();
  const username = ctx.from?.username;
  const chatId = ctx.chat?.id;
  // @ts-ignore - text might not exist on message
  const messageText = ctx.message?.text;
  const command = messageText?.split(' ')[0];

  // Crear child logger con contexto
  ctx.log = logger.child({
    telegramId,
    username,
    chatId,
    command
  });

  if (messageText) {
    ctx.log.info({ messageText }, 'Incoming message');
  } else {
    ctx.log.info({ updateType: ctx.updateType }, 'Incoming update');
  }

  try {
    await next();
    const duration = Date.now() - start;
    ctx.log.info({ duration }, 'Request completed');
  } catch (error) {
    const duration = Date.now() - start;
    ctx.log.error({ error, duration }, 'Request failed');
    throw error;
  }
};
