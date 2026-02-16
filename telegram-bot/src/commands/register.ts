import { Markup, Scenes } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';

export async function registerCommand(ctx: MyContext) {
  // Verificar auth
  if (!ctx.state.user) {
    return ctx.reply('⚠️ Debes registrarte primero.');
  }

  // Por ahora, solo tenemos flujo de Presión Arterial activo para el MVP
  await ctx.reply(
    '📝 *¿Qué deseas registrar?*',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💉 Presión Arterial', 'register_presion')],
        [Markup.button.callback('🔜 Glucosa (Pronto)', 'noop')],
        [Markup.button.callback('🔜 Peso (Pronto)', 'noop')],
        [Markup.button.callback('❌ Cancelar', 'cancel_register')]
      ])
    }
  );
}

// Handler para iniciar la escena
export async function startRegisterPresion(ctx: MyContext) {
  await ctx.answerCbQuery();
  await ctx.scene.enter('PRESION_FLOW');
}

export async function cancelRegister(ctx: MyContext) {
  await ctx.answerCbQuery();
  await ctx.deleteMessage(); // Borrar menú de selección
}
