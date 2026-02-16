import type { MyContext } from '../types/context.js';
import { showMainMenu } from '../commands/start.js';
import logger from '../utils/logger.js';

export async function handleText(ctx: MyContext) {
  const currentScene = ctx.session.currentScene;
  
  if (!currentScene) {
    // Si no hay escena activa, ignorar o manejar comandos desconocidos
    return;
  }

  // @ts-ignore - We know text exists because this is a text handler
  const text = ctx.message?.text?.trim();
  if (!text) return;

  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  logger.info({ telegramId, currentScene, text }, 'Handling text input for scene');

  switch (currentScene) {
    case 'create_household':
      await processCreateHousehold(ctx, text, telegramId);
      break;
    
    case 'join_household':
      await processJoinHousehold(ctx, text, telegramId);
      break;
      
    default:
      logger.warn({ currentScene }, 'Unknown scene');
      break;
  }
}

async function processCreateHousehold(ctx: MyContext, householdName: string, telegramId: string) {
  try {
    // 1. Usar función RPC segura para crear hogar y usuario en una transacción
    // Esto evita problemas de RLS y recursión
    const { data: householdData, error } = await ctx.supabase.rpc('create_household_and_admin', {
      household_name: householdName,
      telegram_id: telegramId,
      telegram_username: ctx.from?.username || null,
      first_name: ctx.from?.first_name || '',
      last_name: ctx.from?.last_name || null
    });

    if (error) {
      logger.error({ error }, 'Failed to create household via RPC');
      await ctx.reply('❌ Hubo un error al crear el hogar. Por favor intenta de nuevo.');
      return;
    }

    const household = householdData as any; // Cast simple ya que viene de RPC jsonb

    // 2. Limpiar escena y actualizar estado local
    ctx.session.currentScene = undefined;
    
    // 3. Obtener el ID del usuario recién creado para el contexto (opcional, pero útil)
    // El RPC podría retornar también el user_id, pero por ahora asumimos que el authMiddleware
    // lo capturará en el siguiente request. Para la respuesta inmediata construimos el objeto:
    
    ctx.state.user = {
      id: '', // Se llenará en la próxima interacción real
      telegram_id: telegramId,
      first_name: ctx.from?.first_name || '',
      last_name: ctx.from?.last_name,
      role: 'admin',
      household_id: household.id,
      household_name: household.name
    };

    await ctx.reply(`✅ ¡Excelente! El hogar *"${householdName}"* ha sido creado exitosamente.`, { parse_mode: 'Markdown' });
    
    // 4. Mostrar menú principal
    await showMainMenu(ctx);

  } catch (error) {
    logger.error({ error }, 'Exception in processCreateHousehold');
    await ctx.reply('❌ Ocurrió un error inesperado.');
  }
}

async function processJoinHousehold(ctx: MyContext, inviteCode: string, telegramId: string) {
  try {
    // 1. Buscar la invitación
    const { data: invite, error: inviteError } = await ctx.supabase
      .from('household_invites')
      .select('*, households(name)')
      .eq('invite_code', inviteCode)
      .is('used_by', null) // No usada
      .gt('expires_at', new Date().toISOString()) // No expirada
      .single();

    if (inviteError || !invite) {
      logger.warn({ inviteCode }, 'Invalid or expired invite code');
      await ctx.reply('❌ El código de invitación no es válido, ya fue usado o ha expirado.');
      return;
    }

    // 2. Crear el usuario vinculado al hogar
    const { error: userError } = await ctx.supabase
      .from('users')
      .insert({
        household_id: invite.household_id,
        telegram_id: telegramId,
        telegram_username: ctx.from?.username,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        role: 'member'
      })
      .select()
      .single();

    if (userError) {
      logger.error({ error: userError }, 'Failed to create user from invite');
      await ctx.reply('❌ Hubo un error al unirte al hogar. ¿Quizás ya estás registrado?');
      return;
    }

    // 3. Marcar invitación como usada
    // Necesitamos el ID del usuario recién creado. 
    // Como el insert anterior retornó error o data, hagamos un query rápido para obtener el ID si es necesario,
    // pero para actualizar used_by necesitamos el UUID del usuario.
    
    // Mejor hacemos fetch del usuario recién creado
    const { data: newUser } = await ctx.supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (newUser) {
      await ctx.supabase
        .from('household_invites')
        .update({ 
          used_by: newUser.id,
          used_at: new Date().toISOString()
        })
        .eq('id', invite.id);
    }

    // 4. Limpiar escena y actualizar estado
    ctx.session.currentScene = undefined;
    
    // @ts-ignore
    const householdName = invite.households?.name;

    ctx.state.user = {
      id: newUser?.id || '',
      telegram_id: telegramId,
      first_name: ctx.from?.first_name || '',
      last_name: ctx.from?.last_name,
      role: 'member',
      household_id: invite.household_id,
      household_name: householdName
    };

    await ctx.reply(`✅ ¡Te has unido exitosamente al hogar *"${householdName}"*!`, { parse_mode: 'Markdown' });
    await showMainMenu(ctx);

  } catch (error) {
    logger.error({ error }, 'Exception in processJoinHousehold');
    await ctx.reply('❌ Ocurrió un error inesperado.');
  }
}
