import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import { nowUTC } from '../utils/dateUtils.js';
import logger from '../utils/logger.js';

export async function inviteCommand(ctx: MyContext) {
  if (!ctx.state.user) return ctx.reply('⚠️ Debes registrarte primero.');
  
  if (ctx.state.user.role !== 'admin') {
    return ctx.reply('⛔ Solo los administradores pueden generar invitaciones.');
  }

  try {
    // Generar código simple de 6 caracteres
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Expiración en 7 días
    const expiresAt = new Date(nowUTC().getTime() + 7 * 24 * 60 * 60 * 1000);

    const { error } = await ctx.supabase
      .from('household_invites')
      .insert({
        household_id: ctx.state.user.household_id,
        invite_code: code,
        created_by: ctx.state.user.id,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;

    await ctx.reply(
      `🔑 *Código de Invitación Generado*\n\n` +
      `\`${code}\`\n\n` +
      `Envía este código a la persona que deseas invitar.\n` +
      `1. Debe iniciar el bot\n` +
      `2. Seleccionar "Tengo un código"\n` +
      `3. Ingresar el código\n\n` +
      `⏳ Válido por 7 días. Uso único.`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    logger.error({ error }, 'Error generating invite');
    await ctx.reply('❌ Error al generar la invitación.');
  }
}
