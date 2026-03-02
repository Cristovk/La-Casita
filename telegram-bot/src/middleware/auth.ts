import type { Middleware } from 'telegraf';
import type { MyContext } from '../types/context.js';
import { createSupabaseClient, createAdminClient } from '../services/supabase.js';
import logger from '../utils/logger.js';

// Cliente Admin singleton para reusar conexión si es posible (aunque supabase-js es ligero)
let adminClient = null;
try {
  adminClient = createAdminClient();
} catch (e) {
  logger.warn('Could not create admin client initially (maybe missing env var)');
}

export const authMiddleware: Middleware<MyContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id.toString();

  if (!telegramId) {
    logger.warn('No telegram_id found in context');
    return next();
  }

  try {
    // 1. Crear cliente ADMIN para el bot.
    // Nota: El enfoque RLS basado en set_config('app.telegram_id') no es confiable con PostgREST,
    // porque cada request HTTP puede usar otra conexión y perder el contexto.
    // Para el MVP, usamos SERVICE_ROLE en el backend del bot y aplicamos el aislamiento por household_id en la app.
    const authClient = adminClient || createAdminClient();
    ctx.supabase = authClient;

    // 2. Obtener el perfil del usuario
    const { data: user, error } = await authClient
      .from('users')
      .select('*, households(name)')
      .eq('telegram_id', telegramId)
      .single();

    if (user && !error) {
      ctx.state.user = {
        ...user,
        // @ts-ignore - Supabase types join handling
        household_name: user.households?.name
      };
      logger.debug({ telegramId }, 'User authenticated successfully via Admin Client');
    } else {
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        logger.error({ error, telegramId }, 'Error fetching user profile');
      } else {
        logger.debug({ telegramId }, 'User not found in database');
      }
    }
  } catch (error) {
    logger.error({ error, telegramId }, 'Auth middleware exception');
  }

  return next();
};

export const requireAuth: Middleware<MyContext> = async (ctx, next) => {
  if (!ctx.state.user) {
    return ctx.reply('⚠️ Debes registrarte primero. Usa /start para comenzar.');
  }
  return next();
};

export const requireAdmin: Middleware<MyContext> = async (ctx, next) => {
  if (ctx.state.user?.role !== 'admin') {
    return ctx.reply('⛔ Solo los administradores del hogar pueden realizar esta acción.');
  }
  return next();
};
