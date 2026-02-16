import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.error('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

export async function createSupabaseClient(telegramId?: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false }
  });

  if (telegramId) {
    const { error } = await client.rpc('set_telegram_id', { 
      telegram_id: telegramId 
    });
    
    if (error) {
      logger.error({ error, telegramId }, 'Failed to set telegram_id');
      throw new Error('Authentication failed');
    }
  }

  return client;
}

// Cliente con permisos de administrador (SERVICE_ROLE)
// Usar SOLO para operaciones críticas de sistema o autenticación interna
export function createAdminClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Admin client requires service role key');
  }
  
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}

export async function getSupabaseForUser(telegramId: string): Promise<SupabaseClient> {
  return createSupabaseClient(telegramId);
}

export async function queryWithLogging<T>(
  client: SupabaseClient, 
  operation: string, 
  queryPromise: Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const start = Date.now();
  try {
    const result = await queryPromise;
    const duration = Date.now() - start;
    
    if (result.error) {
      logger.error({ operation, error: result.error, duration }, 'Query failed');
    } else {
      logger.debug({ operation, duration }, 'Query success');
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error({ operation, error, duration }, 'Query exception');
    throw error;
  }
}
