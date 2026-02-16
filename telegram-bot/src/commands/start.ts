import { Markup } from 'telegraf';
import type { MyContext } from '../types/context.js';
import logger from '../utils/logger.js';
import { createSupabaseClient } from '../services/supabase.js';

export async function startCommand(ctx: MyContext) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  logger.info({ telegramId }, 'Start command executed');

  // Verificar si el usuario ya está registrado
  if (ctx.state.user) {
    return showMainMenu(ctx);
  }

  // Si no está registrado
  await ctx.reply(
    '👋 ¡Hola! Soy *LaCasita Bot*.\n\n' +
    'Te ayudaré a gestionar la información de tu hogar de forma segura y privada.\n\n' +
    'Para comenzar, ¿qué deseas hacer?',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Crear nuevo hogar', 'create_household')],
        [Markup.button.callback('🔑 Tengo un código de invitación', 'join_household')]
      ])
    }
  );
}

export async function showMainMenu(ctx: MyContext) {
  const { user } = ctx.state;
  if (!user) return;

  await ctx.reply(
    `🏠 *Hogar: ${user.household_name || 'Mi Hogar'}*\n\n` +
    `Hola ${user.first_name}, ¿qué deseas hacer hoy?`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Registrar datos', 'menu_register')],
        [Markup.button.callback('📊 Ver últimos registros', 'menu_latest')],
        [Markup.button.callback('👥 Mi hogar', 'menu_household')],
        [Markup.button.callback('❓ Ayuda', 'menu_help')]
      ])
    }
  );
}

export async function handleCreateHousehold(ctx: MyContext) {
  await ctx.answerCbQuery();
  await ctx.reply('Por favor, ingresa el nombre para tu nuevo hogar:');
  // Aquí deberíamos entrar a una escena o estado
  // await ctx.scene.enter('create_household_scene');
  ctx.session.currentScene = 'create_household';
}

export async function handleJoinHousehold(ctx: MyContext) {
  await ctx.answerCbQuery();
  await ctx.reply('Por favor, ingresa el código de invitación (6 caracteres):');
  // Aquí deberíamos entrar a una escena o estado
  // await ctx.scene.enter('join_household_scene');
  ctx.session.currentScene = 'join_household';
}
