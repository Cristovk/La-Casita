import { Markup, Scenes } from 'telegraf';
import type { MyContext } from '../types/context.js';
import type { CreatePresionArterialRecord } from '../types/presion.js';
import logger from '../utils/logger.js';
import { parsePresionInput } from '../utils/parsers/presion.js';
import { nowUTC } from '../utils/dateUtils.js';

// Nombre de la escena
export const PRESION_SCENE_ID = 'PRESION_FLOW';

// Pasos del Wizard
const presionWizard = new Scenes.WizardScene<MyContext>(
  PRESION_SCENE_ID,
  
// PASO 0: Inicializar sesión y mostrar opciones
  async (ctx) => {
    ctx.session.tempData = { presion: {} }; // Inicializar datos temporales
    ctx.session.step = 'selecting_method';
    
    await ctx.reply(
      '📊 *Registro de Presión Arterial*\n\n' +
      'Puedes ingresar los datos de dos formas:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Rápido (ej: 120/80 75)', 'method_quick')],
          [Markup.button.callback('👣 Paso a paso', 'method_step')],
          [Markup.button.callback('❌ Cancelar', 'cancel_flow')]
        ])
      }
    );
    return ctx.wizard.next();
  },

  // PASO 2: Manejar selección o input directo
  async (ctx) => {
    // Si el usuario cancela
    // @ts-ignore
    if (ctx.callbackQuery?.data === 'cancel_flow') {
      await ctx.answerCbQuery();
      await ctx.reply('❌ Registro cancelado.');
      return ctx.scene.leave();
    }

    // @ts-ignore
    const action = ctx.callbackQuery?.data;
    // @ts-ignore
    const text = ctx.message?.text;

    // Si seleccionó método Rápido
    if (action === 'method_quick') {
      await ctx.answerCbQuery();
      await ctx.reply('Escribe tu presión y pulso (ejemplo: *120/80 75*):', { parse_mode: 'Markdown' });
      // Avanzamos al paso de captura rápida (PASO 3 en el archivo, índice 2 en el wizard)
      ctx.wizard.selectStep(2);
      return;
    }

    // Si seleccionó Paso a Paso
    if (action === 'method_step') {
      await ctx.answerCbQuery();
      await ctx.reply('Ingresa la presión *SISTÓLICA* (la alta, ej: 120):', { parse_mode: 'Markdown' });
      // Avanzamos al paso de captura sistólica (PASO 4 en archivo, índice 3 en wizard)
      ctx.wizard.selectStep(3);
      return;
    }

    // Si el usuario escribió texto directamente (intento de formato rápido)
    if (text) {
      const parsed = parsePresionInput(text);
      if (parsed) {
        ctx.session.tempData!.presion = {
          ...ctx.session.tempData!.presion,
          ...parsed
        };
        const pulsoText = parsed.pulso ? ` | 💓 ${parsed.pulso}` : '';
        await ctx.reply(`✅ Leído: ${parsed.sistolica}/${parsed.diastolica}${pulsoText}`);
        
        // Ir a la pregunta de ayunas (se muestra al final del PASO 7, índice 6)
        ctx.wizard.selectStep(6);
        return ctx.wizard.steps[6](ctx); 
      } else {
        await ctx.reply('⚠️ Formato no reconocido. Usa "120/80 75" o selecciona una opción:');
        return;
      }
    }
  },

  // PASO 3: Captura Rápida (Input de texto)
  async (ctx) => {
    // @ts-ignore
    const text = ctx.message?.text;
    
    // Permitir cancelar aquí también escribiendo /cancelar (aunque el middleware lo intercepta, es bueno tenerlo)
    if (text && text.startsWith('/cancelar')) {
      await ctx.reply('❌ Registro cancelado.');
      return ctx.scene.leave();
    }

    if (!text) return;

    const parsed = parsePresionInput(text);
    if (parsed) {
      ctx.session.tempData!.presion = {
        ...ctx.session.tempData!.presion,
        ...parsed
      };
      const pulsoText = parsed.pulso ? ` | 💓 ${parsed.pulso}` : '';
      await ctx.reply(`✅ Leído: ${parsed.sistolica}/${parsed.diastolica}${pulsoText}`);
      
      // Ir a la pregunta de ayunas (se muestra al final del PASO 7, índice 6)
      ctx.wizard.selectStep(6);
      return ctx.wizard.steps[6](ctx);
    } else {
      await ctx.reply('⚠️ Formato inválido.\nIntenta: *120/80* ó *120/80 75*', { parse_mode: 'Markdown' });
      return;
    }
  },

  // PASO 4: Paso a Paso - Sistólica
  async (ctx) => {
    // @ts-ignore
    const text = ctx.message?.text;

    // Ignorar si no hay texto (ej: edited_message sin texto, o updates extraños)
    if (!text) return;

    // Verificar explícitamente si es un comando de cancelación ANTES de intentar parsear
    if (text === '/cancelar' || text.startsWith('/')) {
      // Dejar que el middleware interceptor maneje esto o salir explícitamente
      return; 
    }

    const sistolica = parseInt(text, 10);

    if (isNaN(sistolica) || sistolica < 60 || sistolica > 300) {
      await ctx.reply('⚠️ Valor inválido. Ingresa un número entre 60 y 300:');
      return;
    }

    ctx.session.tempData!.presion!.sistolica = sistolica;
    await ctx.reply('Ahora ingresa la presión *DIASTÓLICA* (la baja, ej: 80):', { parse_mode: 'Markdown' });
    return ctx.wizard.next();
  },

  // PASO 5: Paso a Paso - Diastólica
  async (ctx) => {
    // @ts-ignore
    const text = ctx.message?.text;

    if (!text) return;

    // Verificar explícitamente si es un comando de cancelación
    if (text === '/cancelar' || text.startsWith('/')) {
      return;
    }

    const diastolica = parseInt(text, 10);

    if (isNaN(diastolica) || diastolica < 30 || diastolica > 200) {
      await ctx.reply('⚠️ Valor inválido. Ingresa un número entre 30 y 200:');
      return;
    }

    ctx.session.tempData!.presion!.diastolica = diastolica;
    // Continuar al siguiente paso (Pregunta Pulso)
    return ctx.wizard.next(); 
  },

  // PASO 6: Pregunta Pulso (Solo para flujo paso a paso)
  async (ctx) => {
    await ctx.reply(
      '💓 ¿Cuál es tu *Pulso*? (Opcional)',
      Markup.inlineKeyboard([
        [Markup.button.callback('⏭️ Omitir', 'skip_pulso')]
      ])
    );
    return ctx.wizard.next();
  },

  // PASO 7: Capturar Pulso (O salta aquí desde Rápida)
  async (ctx) => {
    // Si venimos de Rápida y ya tenemos pulso, saltamos directo a Ayunas
    if (ctx.session.tempData?.presion?.pulso) {
       // Ya tenemos pulso, pasamos a la siguiente pregunta (Ayunas)
       // Continuamos sin procesar entrada adicional
    } else {
      // Estamos en el flujo paso a paso, esperamos entrada del usuario
      // @ts-ignore
      const text = ctx.message?.text;
      // @ts-ignore
      const action = ctx.callbackQuery?.data;

      if (action === 'skip_pulso') {
        await ctx.answerCbQuery();
        // Continuar sin pulso
      } else if (text) {
        if (text.startsWith('/')) return; // Ignore commands

        const pulso = parseInt(text, 10);
        if (!isNaN(pulso) && pulso > 30 && pulso < 250) {
          ctx.session.tempData!.presion!.pulso = pulso;
        } else {
          // Si estamos aquí es porque el usuario escribió algo inválido en el paso de pulso
          await ctx.reply('⚠️ Pulso inválido (30-250). Ingresa un número o presiona Omitir.');
          return; 
        }
      } else if (!action) {
        // No text and no action (e.g. edited message without text?)
        return;
      }
    }

    // Siguiente: En ayunas
    await ctx.reply(
      '🍽️ ¿Estás en *ayunas*?',
      Markup.inlineKeyboard([
        [Markup.button.callback('Sí', 'ayunas_yes'), Markup.button.callback('No', 'ayunas_no')],
        [Markup.button.callback('⏭️ Omitir', 'skip_ayunas')]
      ])
    );
    return ctx.wizard.next();
  },

  // PASO 8: Capturar Ayunas
  async (ctx) => {
    // @ts-ignore
    const action = ctx.callbackQuery?.data;
    if (action) await ctx.answerCbQuery();

    if (action === 'ayunas_yes') ctx.session.tempData!.presion!.en_ayunas = true;
    if (action === 'ayunas_no') ctx.session.tempData!.presion!.en_ayunas = false;
    
    // Siguiente: Brazo
    await ctx.reply(
      '💪 ¿En qué *brazo*?',
      Markup.inlineKeyboard([
        [Markup.button.callback('Izquierdo', 'arm_left'), Markup.button.callback('Derecho', 'arm_right')],
        [Markup.button.callback('⏭️ Omitir', 'skip_arm')]
      ])
    );
    return ctx.wizard.next();
  },

  // PASO 9: Capturar Brazo y Confirmar
  async (ctx) => {
    // @ts-ignore
    const action = ctx.callbackQuery?.data;
    if (action) await ctx.answerCbQuery();

    if (action === 'arm_left') ctx.session.tempData!.presion!.brazo = 'izquierdo';
    if (action === 'arm_right') ctx.session.tempData!.presion!.brazo = 'derecho';

    // Mostrar Resumen
    const data = ctx.session.tempData!.presion!;
    const summary = 
      `📋 *Resumen del Registro*\n\n` +
      `🩸 Presión: *${data.sistolica}/${data.diastolica}* mmHg\n` +
      `💓 Pulso: ${data.pulso ? data.pulso + ' bpm' : '-'}\n` +
      `🍽️ Ayunas: ${data.en_ayunas === undefined ? '-' : (data.en_ayunas ? 'Sí' : 'No')}\n` +
      `💪 Brazo: ${data.brazo ? (data.brazo === 'izquierdo' ? 'Izquierdo' : 'Derecho') : '-'}`;

    await ctx.reply(summary, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Confirmar y Guardar', 'confirm_save')],
        [Markup.button.callback('❌ Cancelar', 'cancel_save')]
      ])
    });
    
    return ctx.wizard.next();
  },

  // PASO 10: Guardar
  async (ctx) => {
    // @ts-ignore
    const action = ctx.callbackQuery?.data;
    if (action) await ctx.answerCbQuery();

    if (action === 'cancel_save') {
      await ctx.reply('❌ Registro cancelado.');
      return ctx.scene.leave();
    }

    if (action === 'confirm_save') {
      try {
        await ctx.reply('⏳ Guardando...');
        const user = ctx.state.user;
        if (!user) throw new Error('User context missing');

        logger.debug({ telegramId: user.telegram_id }, 'Saving presion record');

        // Preparar datos para insertar en presion_arterial_records
        const rawData = ctx.session.tempData!.presion!;
        const presionRecord: CreatePresionArterialRecord = {
          household_id: user.household_id,
          user_id: user.id,
          sistolica: rawData.sistolica!,
          diastolica: rawData.diastolica!,
          pulso: rawData.pulso,
          en_ayunas: rawData.en_ayunas,
          brazo: rawData.brazo,
          recorded_at: nowUTC().toISOString()
        };

        logger.debug({ presionRecord }, 'Presion record prepared for insert');

        // Insertar directamente en presion_arterial_records
        const { data: insertedRecord, error: insertError } = await ctx.supabase
          .from('presion_arterial_records')
          .insert(presionRecord)
          .select();

        if (insertError) {
          throw new Error(`Insert failed: ${insertError.message}`);
        }

        logger.info({ recordId: insertedRecord?.[0]?.id }, 'Presion record saved successfully');
        await ctx.reply('✅ ¡Registro de presión guardado exitosamente!');
        
      } catch (error) {
        logger.error({ error }, 'Error saving presion record');
        await ctx.reply(`❌ Error al guardar en la base de datos: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    return ctx.scene.leave();
  }
);

export default presionWizard;
