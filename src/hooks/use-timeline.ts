import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import {
  monthBounds,
  plannedDoses,
  summarizeByDay,
  type PlannedDose,
  type PlannedStatus,
} from '@/lib/timeline';
import type { DoseLog, Event, Medication, Schedule } from '@/types/database';

/**
 * Tomas previstas y eventos de una mascota durante el mes de `anchor`.
 *
 * No filtra medicinas por `active`: desde la migración del calendario la
 * vigencia la deciden starts_on/ends_on, y filtrar por el booleano escondería
 * del pasado las pautas ya terminadas.
 */
export function useTimeline(petId: string | null, householdId: string | null, anchor: string) {
  const { from, to } = useMemo(() => monthBounds(anchor), [anchor]);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(petId != null);

  const refresh = useCallback(async () => {
    if (!petId) return;

    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('pet_id', petId)
      .lte('starts_on', to)
      .or(`ends_on.is.null,ends_on.gte.${from}`)
      .order('created_at');

    const medIds = (meds ?? []).map((m) => m.id);

    const [{ data: scheds }, { data: doseLogs }, { data: eventRows }] = await Promise.all([
      medIds.length
        ? supabase.from('schedules').select('*').in('medication_id', medIds).order('time')
        : Promise.resolve({ data: [] as Schedule[] }),
      supabase
        .from('dose_logs')
        .select('*')
        .eq('pet_id', petId)
        .gte('date', from)
        .lte('date', to),
      supabase
        .from('events')
        .select('*')
        .eq('pet_id', petId)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on'),
    ]);

    setMedications(meds ?? []);
    setSchedules(scheds ?? []);
    setLogs(doseLogs ?? []);
    setEvents(eventRows ?? []);
    setLoading(false);
  }, [petId, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch asíncrono; el estado se asigna tras el await
    refresh();
  }, [refresh]);

  // Realtime: si otro cuidador marca una toma o anota un evento, se refleja aquí
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase
      .channel(`timeline-${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dose_logs', filter: `household_id=eq.${householdId}` },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `household_id=eq.${householdId}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, refresh]);

  const doses = useMemo(
    () => plannedDoses({ medications, schedules, logs, from, to }),
    [medications, schedules, logs, from, to]
  );

  const summary = useMemo(() => summarizeByDay(doses, events), [doses, events]);

  /**
   * Fija el estado de una toma. 'pendiente' borra el registro, que es como se
   * deshace un error; el resto hace upsert sobre unique(schedule_id, date).
   */
  const setDoseStatus = useCallback(
    async (dose: PlannedDose, status: PlannedStatus, caregiverId: string | null) => {
      if (!householdId || !petId) return;

      if (status === 'pendiente') {
        if (!dose.log) return;
        await supabase.from('dose_logs').delete().eq('id', dose.log.id);
        await refresh();
        return;
      }

      await supabase.from('dose_logs').upsert(
        {
          household_id: householdId,
          pet_id: petId,
          schedule_id: dose.scheduleId,
          date: dose.date,
          status,
          medication_name: dose.medicationName,
          medication_dose: dose.medicationDose,
          scheduled_time: dose.time,
          given_by: caregiverId,
        },
        { onConflict: 'schedule_id,date' }
      );
      await refresh();
    },
    [householdId, petId, refresh]
  );

  return { doses, events, summary, loading, refresh, setDoseStatus, range: { from, to } };
}
