import type { MyContext } from '../types/context.js';
import type { PresionArterialRecord } from '../types/presion.js';
import { formatDateForUser } from '../utils/dateUtils.js';
import logger from '../utils/logger.js';

/**
 * Comando /debug - Solo para desarrollo, muestra información del usuario y últimos registros de presión
 * Uso: /debug
 */
export async function debugCommand(ctx: MyContext) {
  const user = ctx.state.user;

  if (!user) {
    return ctx.reply('⚠️ No estás autenticado.');
  }

  try {
    // Obtener últimos 5 registros de presión desde la tabla especializada
    const { data: presionRecords, error: recordsError } = await ctx.supabase
      .from('presion_arterial_records')
      .select('id, created_at, recorded_at, sistolica, diastolica, pulso, en_ayunas, brazo')
      .eq('household_id', user.household_id)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (recordsError) {
      throw recordsError;
    }

    let debugInfo = `📊 *DEBUG INFO*\n\n`;
    debugInfo += `👤 *Usuario*: ${user.first_name}\n`;
    debugInfo += `🏠 *Hogar ID*: ${user.household_id}\n`;
    debugInfo += `🔑 *Usuario ID*: ${user.id}\n`;
    debugInfo += `📝 *Rol*: ${user.role}\n\n`;

    if (presionRecords && presionRecords.length > 0) {
      debugInfo += `📋 *Últimos ${presionRecords.length} registros de presión*:\n\n`;
      presionRecords.forEach((record: any, idx: number) => {
        debugInfo += `${idx + 1}. ID: \`${record.id.substring(0, 8)}...\`\n`;
        debugInfo += `   Grabado: ${formatDateForUser(record.recorded_at)}\n`;
        debugInfo += `   Datos: 🩸 ${record.sistolica}/${record.diastolica}`;
        if (record.pulso) debugInfo += ` | 💓 ${record.pulso}`;
        debugInfo += `\n\n`;
      });
    } else {
      debugInfo += `ℹ️ *Sin registros de presión aún*\n`;
    }

    logger.info({ userId: user.id, recordCount: presionRecords?.length }, 'Debug info displayed');
    await ctx.reply(debugInfo, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error({ error }, 'Debug command failed');
    await ctx.reply(`❌ Error al obtener información: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}
