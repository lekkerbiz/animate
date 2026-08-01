/** Fecha local del dispositivo en formato YYYY-MM-DD (la "fecha programada" de la PRD, nunca UTC). */
export function todayLocalISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "HH:MM:SS" o "HH:MM" → "HH:MM" */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

/** true si la hora programada (HH:MM) ya pasó hoy. */
export function isPastTime(time: string, now = new Date()): boolean {
  const [h, m] = time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}
