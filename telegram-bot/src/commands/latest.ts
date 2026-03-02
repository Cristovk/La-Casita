import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import type { PresionArterialRecord } from '../types/presion.js';
import { formatDateForUser } from '../utils/dateUtils.js';
import logger from '../utils/logger.js';
import { createAdminClient } from '../services/supabase.js';

export async function latestCommand(ctx: MyContext) {
  if (!ctx.state.user) return ctx.reply('⚠️ Debes registrarte primero.');

  try {
    const adminClient = createAdminClient();

    // Obtener últimas presiones arteriales
    const { data: presionRecords, error: presionError } = await adminClient
      .from('presion_arterial_records')
      .select(`
        id,
        recorded_at,
        sistolica,
        diastolica,
        pulso,
        en_ayunas,
        brazo,
        users ( first_name )
      `)
      .eq('household_id', ctx.state.user.household_id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (presionError) throw presionError;

    if (!presionRecords || presionRecords.length === 0) {
      return ctx.reply(
        '📭 No hay registros de presión aún.',
        Markup.inlineKeyboard([
          [Markup.button.callback('📝 Registrar ahora', 'menu_register')]
        ])
      );
    }

    let message = '📊 *Últimos Registros de Presión*\n\n';

    presionRecords.forEach((record: any) => {
      const userName = record.users?.first_name || 'Desconocido';
      const date = formatDateForUser(record.recorded_at);
      
      let dataStr = `🩸 ${record.sistolica}/${record.diastolica} mmHg`;
      if (record.pulso) dataStr += ` | 💓 ${record.pulso} bpm`;
      if (record.brazo) dataStr += ` | 💪 ${record.brazo === 'izquierdo' ? 'Izq' : 'Der'}`;
      if (record.en_ayunas !== null) dataStr += ` | 🍽️ ${record.en_ayunas ? 'Ayunas' : 'No ayunas'}`;

      message += `📋 *${userName}*\n`;
      message += `📅 ${date}\n`;
      message += `${dataStr}\n\n`;
    });

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Registrar nuevo', 'menu_register')],
        [Markup.button.callback('🔙 Volver', 'menu_main')]
      ]) 
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching presion records');
    await ctx.reply('❌ Error al obtener registros.');
  }
}
