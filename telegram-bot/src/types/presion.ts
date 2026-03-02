/**
 * Tipo para registro de presión arterial
 * Corresponde a la tabla presion_arterial_records en Supabase
 */
export interface PresionArterialRecord {
  id: string;
  household_id: string;
  user_id: string;
  sistolica: number;
  diastolica: number;
  pulso?: number | null;
  en_ayunas?: boolean | null;
  brazo?: 'izquierdo' | 'derecho' | null;
  recorded_at: string; // ISO 8601 timestamp
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo para insertar un nuevo registro (sin ID ni timestamps)
 */
export interface CreatePresionArterialRecord {
  household_id: string;
  user_id: string;
  sistolica: number;
  diastolica: number;
  pulso?: number | null;
  en_ayunas?: boolean | null;
  brazo?: 'izquierdo' | 'derecho' | null;
  recorded_at: string;
  notes?: string | null;
}
