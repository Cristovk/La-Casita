import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';
import { formatDateForUser } from '../utils/dateUtils.js';
import { createAdminClient } from '../services/supabase.js';

export async function myHouseholdCommand(ctx: MyContext) {
  // Verificación de autenticación (ya cubierta por requireAuth middleware si se usa)
  if (!ctx.state.user) {
    return ctx.reply('⚠️ Debes registrarte primero. Usa /start para comenzar.');
  }

  const { user } = ctx.state;
  logger.info({ userId: user.id, householdId: user.household_id }, 'MyHousehold command executed');

  try {
    // Usar AdminClient para lecturas seguras si RLS sigue molestando en consultas join/cross-table
    // O seguir usando ctx.supabase si confiamos en que RLS está arreglado.
    // Dado el historial de problemas RLS, para este comando informativo usaremos adminClient para garantizar la respuesta
    // mientras mantenemos RLS estricto para escrituras.
    const adminClient = createAdminClient();

    // 1. Obtener información del hogar
    const { data: household, error: householdError } = await adminClient
      .from('households')
      .select('*')
      .eq('id', user.household_id)
      .single();

    if (householdError || !household) {
      throw new Error('No se pudo obtener información del hogar');
    }

    // 2. Obtener miembros
    const { data: members, error: membersError } = await adminClient
      .from('users')
      .select('*')
      .eq('household_id', user.household_id);

    if (membersError) {
      throw new Error('No se pudieron obtener los miembros');
    }

    // 3. Obtener estadísticas (total registros y último registro)
    // Aquí sí podemos usar ctx.supabase porque records tiene RLS simple por household_id
    const { count: totalRecords, error: countError } = await ctx.supabase
      .from('records')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', user.household_id);

    const { data: lastRecord, error: lastRecordError } = await ctx.supabase
      .from('records')
      .select('recorded_at')
      .eq('household_id', user.household_id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    // 4. Formatear mensaje
    const membersList = members.map(m => 
      `• ${m.first_name || 'Usuario'} ${m.last_name || ''} (${m.role === 'admin' ? 'Admin ⭐' : 'Miembro'})`
    ).join('\n');

    const lastRecordDate = lastRecord 
      ? formatDateForUser(lastRecord.recorded_at) 
      : 'Sin registros';

    const message = `
🏠 *${household.name}*

👥 *Miembros* (${members.length})
${membersList}

📊 *Estadísticas*
• Total de registros: ${totalRecords || 0}
• Último registro: ${lastRecordDate}

🔗 Usa /invitar para agregar más miembros
`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📩 Invitar', 'menu_invite')],
        [Markup.button.callback('📊 Ver registros', 'menu_latest')],
        [Markup.button.callback('🔙 Volver', 'menu_main')]
      ])
    });

  } catch (error) {
    logger.error({ error }, 'Error in myHousehold command');
    await ctx.reply('❌ Ocurrió un error al obtener la información de tu hogar.');
  }
}
