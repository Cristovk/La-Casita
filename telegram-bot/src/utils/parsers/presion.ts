export interface PresionResult {
  sistolica: number;
  diastolica: number;
  pulso?: number; // Opcional
}

/**
 * Parsea un string con formato de presión arterial
 * Soporta:
 * - "120/80"
 * - "120/80 75" (con pulso)
 * - "120 80"
 * - "120 80 75"
 * - "120-80"
 * - "120-80-75"
 */
export function parsePresionInput(input: string): PresionResult | null {
  if (!input) return null;
  
  const cleanInput = input.trim();
  
  // Regex mejorado:
  // Grupo 1: Sistólica (2-3 dígitos)
  // Separador: / , - o espacio
  // Grupo 2: Diastólica (2-3 dígitos)
  // Grupo 3 (Opcional): Separador + Pulso (2-3 dígitos)
  const regex = /^(\d{2,3})[\/\s,-]+(\d{2,3})(?:[\/\s,-]+(\d{2,3}))?$/;
  
  const match = cleanInput.match(regex);

  if (!match) return null;

  const sistolica = parseInt(match[1], 10);
  const diastolica = parseInt(match[2], 10);
  const pulso = match[3] ? parseInt(match[3], 10) : undefined;

  // Validaciones de rango
  if (sistolica < 60 || sistolica > 300) return null;
  if (diastolica < 30 || diastolica > 200) return null;
  if (sistolica <= diastolica) return null;
  
  // Validar pulso si existe
  if (pulso !== undefined && (pulso < 30 || pulso > 250)) return null;

  return { sistolica, diastolica, pulso };
}

export function isPresionFormat(input: string): boolean {
  return parsePresionInput(input) !== null;
}
