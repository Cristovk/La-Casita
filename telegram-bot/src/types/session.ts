import type { Scenes } from 'telegraf';

export interface PresionData {
  sistolica?: number;
  diastolica?: number;
  pulso?: number;
  en_ayunas?: boolean;
  brazo?: 'izquierdo' | 'derecho';
}

export interface SessionTempData {
  // Para flujo de registro
  subcategoryId?: string;
  subcategorySlug?: string;
  recordData?: Record<string, any>;
  currentField?: string;
  fieldIndex?: number;
  
  // Para flujo de invitación
  inviteCode?: string;
  
  // Para flujo de creación de hogar
  householdName?: string;
  
  // Datos específicos de presión
  presion?: PresionData;
}

export interface SessionData extends Scenes.SceneSessionData {
  currentScene?: string;
  step?: number;
  tempData?: SessionTempData;
  __scenes?: Scenes.SceneSessionData;
}
