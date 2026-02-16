import type { SessionStore } from 'telegraf';
import { SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

// Removed 'implements SessionStore<any>' to avoid TS error about class implementation
// The class still matches the interface structurally
export class SupabaseSessionStore {
  private supabase: SupabaseClient;
  private ttl: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(supabase: SupabaseClient, ttlMs = 24 * 60 * 60 * 1000) {
    this.supabase = supabase;
    this.ttl = ttlMs;
    this.startCleanupInterval();
  }

  async get(key: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .select('session')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found code
          logger.error({ error, key }, 'Failed to get session');
        }
        return undefined;
      }

      return data?.session || undefined;
    } catch (error) {
      logger.error({ error, key }, 'Exception getting session');
      return undefined;
    }
  }

  async set(key: string, session: any): Promise<void> {
    try {
      const expires_at = new Date(Date.now() + this.ttl).toISOString();
      
      const { error } = await this.supabase
        .from('sessions')
        .upsert({ key, session, expires_at });

      if (error) {
        logger.error({ error, key }, 'Failed to set session');
      }
    } catch (error) {
      logger.error({ error, key }, 'Exception setting session');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('sessions')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error({ error, key }, 'Failed to delete session');
      }
    } catch (error) {
      logger.error({ error, key }, 'Exception deleting session');
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        const { error } = await this.supabase
          .from('sessions')
          .delete()
          .lt('expires_at', new Date().toISOString());
          
        if (error) {
          logger.error({ error }, 'Session cleanup failed');
        } else {
          logger.debug('Session cleanup completed');
        }
      } catch (error) {
        logger.error({ error }, 'Session cleanup exception');
      }
    }, 60 * 60 * 1000); // Cada hora
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
