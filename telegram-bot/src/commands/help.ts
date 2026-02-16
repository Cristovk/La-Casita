import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';

export async function helpCommand(ctx: MyContext) {
  logger.info({ userId: ctx.from?.id }, 'Help command executed');

  const helpText = `
📖 *Comandos Disponibles*

🏠 *General*
/start - Iniciar o ver menú principal
/mihogar - Ver información de tu hogar
/ayuda - Mostrar esta ayuda

📝 *Registro de Datos*
/registrar - Registrar datos de salud
/ultimos - Ver últimos 10 registros

👥 *Gestión de Hogar*
/invitar - Generar código de invitación (solo admins)

⚙️ *Utilidades*
/cancelar - Cancelar operación actual

ℹ️ *Consejos*
• Puedes cancelar cualquier operación con /cancelar
• Los datos se guardan automáticamente
• Todos los miembros del hogar pueden ver los registros compartidos

¿Necesitas más ayuda? Escribe a @soporte_lacasita
`;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Volver al Menú', 'menu_main')]
    ])
  });
}
