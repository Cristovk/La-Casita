import { Telegraf, session, Scenes } from 'telegraf';
import dotenv from 'dotenv';
import type { MyContext } from './types/context.js';
import logger from './utils/logger.js';
import { SupabaseSessionStore } from './services/sessionStore.js';
import { createSupabaseClient } from './services/supabase.js';
import { authMiddleware } from './middleware/auth.js';
import { loggerMiddleware } from './middleware/logger.js';
import { commandInterceptorMiddleware } from './middleware/commandInterceptor.js';
import { setupErrorHandlers } from './handlers/errorHandler.js';
import { handleText } from './handlers/textHandler.js';

// Commands
import { startCommand, showMainMenu, handleCreateHousehold, handleJoinHousehold } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { cancelCommand } from './commands/cancel.js';
import { myHouseholdCommand } from './commands/myHousehold.js';
import { registerCommand, startRegisterPresion, cancelRegister } from './commands/register.js';
import { latestCommand } from './commands/latest.js';
import { inviteCommand } from './commands/invite.js';

// Scenes
import presionWizard from './flows/presionFlow.js';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  logger.fatal('BOT_TOKEN is missing');
  process.exit(1);
}

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);

// Setup Scenes
const stage = new Scenes.Stage<MyContext>([presionWizard]);

// Setup error handlers
setupErrorHandlers(bot);

// Initialize Supabase for session store
const supabase = await createSupabaseClient(); 

// Middleware
bot.use(session({
  store: new SupabaseSessionStore(supabase)
}));
bot.use(loggerMiddleware);
bot.use(authMiddleware); // Auth primero para tener usuario disponible
bot.use(commandInterceptorMiddleware); // Interceptor después de auth, antes de stage
bot.use(stage.middleware()); // Scene middleware must be after session


// Global Commands
bot.start(startCommand);
bot.help(helpCommand);
bot.command('cancelar', cancelCommand);
bot.command('mihogar', myHouseholdCommand);
bot.command('registrar', registerCommand);
bot.command('ultimos', latestCommand);
bot.command('invitar', inviteCommand);

// Menu Actions (Callbacks)
bot.action('create_household', handleCreateHousehold);
bot.action('join_household', handleJoinHousehold);

// Menu Actions (Main Menu)
bot.action('menu_register', (ctx) => { ctx.answerCbQuery(); return registerCommand(ctx); });
bot.action('menu_latest', (ctx) => { ctx.answerCbQuery(); return latestCommand(ctx); });
bot.action('menu_household', (ctx) => { ctx.answerCbQuery(); return myHouseholdCommand(ctx); });
bot.action('menu_help', (ctx) => { ctx.answerCbQuery(); return helpCommand(ctx); });
bot.action('menu_main', (ctx) => { ctx.answerCbQuery(); return showMainMenu(ctx); });
bot.action('menu_invite', (ctx) => { ctx.answerCbQuery(); return inviteCommand(ctx); });

// Register Actions
bot.action('register_presion', startRegisterPresion);
bot.action('cancel_register', cancelRegister);
bot.action('noop', (ctx) => ctx.answerCbQuery('Próximamente...'));

// Text Handler (for inputs like household name AND generic text in scenes if not handled by wizard)
bot.on('text', handleText);

// Launch
bot.launch().then(() => {
  logger.info('Bot started successfully');
}).catch((err) => {
  logger.fatal({ err }, 'Failed to launch bot');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
