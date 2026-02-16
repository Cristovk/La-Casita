import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import { formatDateForUser } from '../utils/dateUtils.js';
import logger from '../utils/logger.js';
import { createAdminClient } from '../services/supabase.js';

export async function latestCommand(ctx: MyContext) {
  if (!ctx.state.user) return ctx.reply('⚠️ Debes registrarte primero.');

  try {
    // Usar admin client para evitar problemas de RLS en joins con users/subcategories si fuera necesario
    // Aunque records debería ser accesible, los joins pueden complicarse.
    // Probemos con adminClient para lectura segura.
    const adminClient = createAdminClient();

    const { data: records, error } = await adminClient
      .from('records')
      .select(`
        recorded_at,
        data,
        subcategories ( name, icon, slug ),
        users ( first_name )
      `)
      .eq('household_id', ctx.state.user.household_id)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!records || records.length === 0) {
      return ctx.reply(
        '📭 No hay registros aún.',
        Markup.inlineKeyboard([
          [Markup.button.callback('📝 Registrar ahora', 'menu_register')]
        ])
      );
    }

    let message = '📊 *Últimos Registros*\n\n';

    records.forEach(r => {
      // @ts-ignore
      const subName = r.subcategories?.name;
      // @ts-ignore
      const icon = r.subcategories?.icon || '📄';
      // @ts-ignore
      const userName = r.users?.first_name;
      const date = formatDateForUser(r.recorded_at);
      
      // Formateo simple de data según el tipo (hardcoded para MVP, luego dinámico)
      let dataStr = '';
      // @ts-ignore
      if (r.subcategories?.slug === 'presion-arterial') {
        const d = r.data as any;
        dataStr = `🩸 ${d.sistolica}/${d.diastolica}`;
        if (d.pulso) dataStr += ` | 💓 ${d.pulso}`;
      } else {
        dataStr = JSON.stringify(r.data);
      }

      message += `${icon} *${subName}* - ${userName}\n`;
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
    logger.error({ error }, 'Error fetching latest records');
    await ctx.reply('❌ Error al obtener registros.');
  }
}
