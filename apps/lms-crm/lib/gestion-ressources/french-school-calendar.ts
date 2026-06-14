import { addDays, format, getDay, startOfDay } from 'date-fns';

export type SchoolPlanningDayKind =
  | 'weekday'
  | 'saturday'
  | 'closed_holiday';

export type FrenchHoliday = {
  date: Date;
  label: string;
};

/** Algorithme de Gauss — dimanche de Pâques (calendrier grégorien). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return startOfDay(new Date(year, month - 1, day));
}

function fixedHolidays(year: number): FrenchHoliday[] {
  const y = year;
  return [
    { date: startOfDay(new Date(y, 0, 1)), label: "Jour de l'An" },
    { date: startOfDay(new Date(y, 4, 1)), label: 'Fête du travail' },
    { date: startOfDay(new Date(y, 4, 8)), label: 'Victoire 1945' },
    { date: startOfDay(new Date(y, 6, 14)), label: 'Fête nationale' },
    { date: startOfDay(new Date(y, 7, 15)), label: 'Assomption' },
    { date: startOfDay(new Date(y, 10, 1)), label: 'Toussaint' },
    { date: startOfDay(new Date(y, 10, 11)), label: 'Armistice' },
    { date: startOfDay(new Date(y, 11, 25)), label: 'Noël' },
  ];
}

/** Jours fériés légaux France métropolitaine (fixes + Pâques, Ascension, Pentecôte). */
export function getFrenchPublicHolidays(year: number): FrenchHoliday[] {
  const easter = easterSunday(year);
  const movable: FrenchHoliday[] = [
    { date: addDays(easter, 1), label: 'Lundi de Pâques' },
    { date: addDays(easter, 39), label: 'Ascension' },
    { date: addDays(easter, 50), label: 'Lundi de Pentecôte' },
  ];
  return [...fixedHolidays(year), ...movable];
}

const holidayCache = new Map<number, Map<string, string>>();

function holidayMapForYear(year: number): Map<string, string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const map = new Map<string, string>();
  for (const h of getFrenchPublicHolidays(year)) {
    map.set(format(h.date, 'yyyy-MM-dd'), h.label);
  }
  holidayCache.set(year, map);
  return map;
}

export function frenchPublicHolidayLabel(date: Date): string | null {
  const d = startOfDay(date);
  const key = format(d, 'yyyy-MM-dd');
  const label = holidayMapForYear(d.getFullYear()).get(key);
  return label ?? null;
}

export function isFrenchPublicHoliday(date: Date): boolean {
  return frenchPublicHolidayLabel(date) !== null;
}

export function isSaturday(date: Date): boolean {
  return getDay(date) === 6;
}

export function getSchoolPlanningDayKind(date: Date): SchoolPlanningDayKind {
  if (frenchPublicHolidayLabel(date)) return 'closed_holiday';
  if (isSaturday(date)) return 'saturday';
  return 'weekday';
}

/** Colonnes planning : lundi → samedi (pas de dimanche). */
export function getSchoolPlanningDays(weekStartMonday: Date): Date[] {
  const start = startOfDay(weekStartMonday);
  return Array.from({ length: 6 }, (_, i) => addDays(start, i));
}

export function schoolPlanningWeekEnd(weekStartMonday: Date): Date {
  return addDays(startOfDay(weekStartMonday), 5);
}

/** Fermé à l'affichage : férié, ou samedi sans session planifiée. */
export function isSchoolClosedForPlanning(
  day: Date,
  hasSessions: boolean,
): boolean {
  if (isFrenchPublicHoliday(day)) return true;
  if (isSaturday(day) && !hasSessions) return true;
  return false;
}
