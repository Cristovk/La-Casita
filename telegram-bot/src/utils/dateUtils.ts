import moment from 'moment-timezone';

const TIMEZONE = 'America/Santiago';

/**
 * Convierte fecha UTC a formato local para el usuario
 * @param utcDate Date o string en UTC
 * @param format Formato opcional (default: 'DD/MM/YYYY HH:mm')
 * @returns String formateado en zona local
 */
export function formatDateForUser(utcDate: Date | string, format = 'DD/MM/YYYY HH:mm'): string {
  return moment(utcDate).tz(TIMEZONE).format(format);
}

/**
 * Parsear fecha ingresada por usuario (asume zona local)
 * @param input String de fecha
 * @param format Formato opcional (default: 'DD/MM/YYYY HH:mm')
 * @returns Date en UTC
 */
export function parseUserDate(input: string, format = 'DD/MM/YYYY HH:mm'): Date {
  return moment.tz(input, format, TIMEZONE).toDate();
}

/**
 * Obtener timestamp UTC actual
 * @returns Date actual en UTC
 */
export function nowUTC(): Date {
  return moment.utc().toDate();
}

/**
 * Obtener rango de fechas para consultas (inicio y fin del día en zona local)
 * @param date String en formato 'DD/MM/YYYY'
 * @returns Objeto con start y end en UTC
 */
export function getLocalDateRange(date: string): { start: Date; end: Date } {
  const start = moment.tz(date, 'DD/MM/YYYY', TIMEZONE).startOf('day').toDate();
  const end = moment.tz(date, 'DD/MM/YYYY', TIMEZONE).endOf('day').toDate();
  return { start, end };
}

/**
 * Validar si un string es una fecha válida
 * @param input String de fecha
 * @returns boolean
 */
export function isValidDate(input: string): boolean {
  return moment(input).isValid();
}
