import type { Context, Scenes } from 'telegraf';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'pino';
import type { SessionData } from './session.js';

interface UserState {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  role: 'admin' | 'member';
  household_id: string;
  household_name: string;
}

interface MyContext extends Context {
  session: SessionData;
  state: {
    user?: UserState;
  };
  supabase: SupabaseClient;
  log: Logger;
  scene: Scenes.SceneContextScene<MyContext>;
}

export type { MyContext, UserState };
