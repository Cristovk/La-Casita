import type { Middleware } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';
import { cancelCommand } from '../commands/cancel.js';

const EXEMPT_COMMANDS = ['/cancelar', '/ayuda'];

export const commandInterceptorMiddleware: Middleware<MyContext> = async (ctx, next) => {
  // @ts-ignore
  const text = ctx.message?.text || ctx.editedMessage?.text;
  // Verificar si hay una escena activa revisando directamente la sesión,
  // ya que ctx.scene aún no está inicializado por el Stage middleware
  const hasScene = !!ctx.session?.__scenes?.current;

  // logger.debug({ text, hasScene }, 'Interceptor checking');

  // Si estamos en una escena y llega un comando
  if (text && text.startsWith('/') && hasScene) {
    const command = text.split(' ')[0];

    logger.info({ 
      scene: ctx.session.__scenes?.current, 
      command 
    }, 'Command intercepted in scene');

    // Si es /cancelar, ejecutamos directamente el comando de cancelar y dejamos la escena
    if (command === '/cancelar') {
      // Limpiamos la escena manualmente en la sesión
      delete ctx.session.__scenes;
      ctx.session.tempData = {};
      
      await cancelCommand(ctx);
      // Importante: No llamamos a next() para detener la cadena
      return;
    }
    
    // Si es otro comando no exento (ej: /mihogar), salimos de la escena primero
    if (!EXEMPT_COMMANDS.includes(command)) {
      // Limpiamos la escena manualmente en la sesión
      delete ctx.session.__scenes;
      ctx.session.tempData = {}; 
      
      await ctx.reply('⚠️ Operación anterior cancelada por nuevo comando.');
      // Dejamos pasar (next) para que el bot ejecute el nuevo comando
    }
  }

  return next();
};
