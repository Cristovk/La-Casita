import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';
import { showMainMenu } from './start.js';

export async function cancelCommand(ctx: MyContext) {
  if (ctx.scene?.current) {
    logger.info({ scene: ctx.scene.current.id }, 'User cancelled scene');
    await ctx.scene.leave();
  }

  // Limpiar sesión
  ctx.session = {};

  await ctx.reply('❌ Operación cancelada.');

  // Si el usuario está registrado, mostrar el menú principal completo
  if (ctx.state.user) {
    return showMainMenu(ctx);
  }

  // Si no está registrado, mostrar opciones básicas
  await ctx.reply(
    '¿En qué puedo ayudarte?',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Crear hogar', 'create_household')],
      [Markup.button.callback('🔑 Unirse a hogar', 'join_household')]
    ])
  );
}
