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

/** "2024-03-15" → "15/03/2024". Cadena vacía si no hay fecha. */
export function formatSpanishDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
}

/**
 * "15/03/2024" → "2024-03-15". Devuelve undefined si el texto no es una fecha
 * válida, para poder distinguirlo de "el campo está vacío" (null).
 */
export function parseSpanishDate(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return undefined;

  const [, d, m, y] = match;
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  // rechaza 31/02: el Date se desborda al mes siguiente y cambia el día
  if (parsed.getDate() !== Number(d) || parsed.getMonth() + 1 !== Number(m)) return undefined;
  if (parsed > new Date()) return undefined;

  return iso;
}

/** "2024-03-15" → "2 años y 5 meses". Null si no hay fecha o si es futura. */
export function formatAge(birthDate: string | null, now = new Date()): string | null {
  if (!birthDate) return null;
  const born = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;

  let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) return null;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(years === 1 ? '1 año' : `${years} años`);
  if (rest) parts.push(rest === 1 ? '1 mes' : `${rest} meses`);
  if (!parts.length) return 'Recién llegado';
  return parts.join(' y ');
}
