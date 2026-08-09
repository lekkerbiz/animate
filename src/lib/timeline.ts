import type { DoseLog, DoseStatus, Event, Medication, Schedule } from '@/types/database';

/**
 * Lógica pura del calendario: no toca la red ni React.
 *
 * La idea central es que las tomas de un día NO están guardadas en ninguna
 * tabla: se calculan cruzando la vigencia de cada pauta con sus horas. En
 * `dose_logs` solo vive lo que ya pasó. Por eso el pasado y el futuro se
 * pintan con el mismo código, y una pauta creada hoy no inventa tomas ayer.
 */

/** Estado de una toma prevista. 'pendiente' no existe en la BBDD: es la ausencia de registro. */
export type PlannedStatus = DoseStatus | 'pendiente';

export type PlannedDose = {
  key: string;
  date: string;
  time: string;
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  medicationDose: string;
  instructions: string | null;
  log: DoseLog | null;
  status: PlannedStatus;
};

export type DaySummary = {
  date: string;
  total: number;
  dadas: number;
  falladas: number;
  pendientes: number;
  eventos: number;
};

/** Lista de fechas YYYY-MM-DD entre dos extremos, ambos incluidos. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  // en UTC a propósito: solo generamos etiquetas de fecha, y así ningún
  // cambio de hora local nos hace saltar o repetir un día
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Primer y último día del mes que contiene a `date`. */
export function monthBounds(date: string): { from: string; to: string } {
  const [y, m] = date.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` };
}

/** true si la pauta está vigente ese día. Las fechas ISO se comparan como texto. */
function isActiveOn(medication: Medication, date: string): boolean {
  if (date < medication.starts_on) return false;
  return medication.ends_on == null || date <= medication.ends_on;
}

type BuildInput = {
  medications: Medication[];
  schedules: Schedule[];
  logs: DoseLog[];
  from: string;
  to: string;
};

/** Todas las tomas previstas del rango, con su registro real si lo hay. */
export function plannedDoses({ medications, schedules, logs, from, to }: BuildInput): PlannedDose[] {
  const medById = new Map(medications.map((m) => [m.id, m]));
  const logByKey = new Map(logs.map((l) => [`${l.schedule_id}|${l.date}`, l]));
  const days = eachDay(from, to);
  const out: PlannedDose[] = [];

  for (const schedule of schedules) {
    const medication = medById.get(schedule.medication_id);
    if (!medication) continue;

    for (const date of days) {
      if (!isActiveOn(medication, date)) continue;

      const log = logByKey.get(`${schedule.id}|${date}`) ?? null;
      out.push({
        key: `${schedule.id}|${date}`,
        date,
        time: schedule.time.slice(0, 5),
        scheduleId: schedule.id,
        medicationId: medication.id,
        medicationName: medication.name,
        medicationDose: medication.dose,
        instructions: medication.instructions,
        log,
        status: log?.status ?? 'pendiente',
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

/** Resumen por día, para pintar los puntos de la cuadrícula del mes. */
export function summarizeByDay(doses: PlannedDose[], events: Event[]): Map<string, DaySummary> {
  const byDay = new Map<string, DaySummary>();

  const ensure = (date: string): DaySummary => {
    let summary = byDay.get(date);
    if (!summary) {
      summary = { date, total: 0, dadas: 0, falladas: 0, pendientes: 0, eventos: 0 };
      byDay.set(date, summary);
    }
    return summary;
  };

  for (const dose of doses) {
    const summary = ensure(dose.date);
    summary.total += 1;
    if (dose.status === 'dada') summary.dadas += 1;
    else if (dose.status === 'pendiente') summary.pendientes += 1;
    else summary.falladas += 1;
  }

  for (const event of events) ensure(event.occurred_on).eventos += 1;

  return byDay;
}

/**
 * Adherencia del rango: proporción de tomas cumplidas sobre las exigibles.
 * Las pendientes de hoy o de días futuros no cuentan como fallo — aún no han
 * vencido, y contarlas hundiría el porcentaje según avanza el mes.
 */
export function adherence(doses: PlannedDose[], today: string): number | null {
  const due = doses.filter((d) => d.date < today || (d.date === today && d.status !== 'pendiente'));
  if (!due.length) return null;
  return due.filter((d) => d.status === 'dada').length / due.length;
}
