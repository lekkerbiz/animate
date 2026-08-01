import { useCallback, useEffect, useMemo, useState } from 'react';

import { todayLocalISO } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { DoseLog, Medication, Schedule } from '@/types/database';

export type TodayDose = {
  schedule: Schedule;
  medication: Medication;
  log: DoseLog | null;
};

/**
 * Tomas de hoy de una mascota + toggle de "dada" con sincronización Realtime.
 * El unique(schedule_id, date) de la BBDD garantiza que dos cuidadores
 * no puedan registrar la misma toma dos veces.
 */
export function useTodayMeds(petId: string | null, householdId: string | null) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayLocalISO();

  const refresh = useCallback(async () => {
    if (!petId || !householdId) return;

    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('pet_id', petId)
      .eq('active', true)
      .order('created_at');
    const medIds = (meds ?? []).map((m) => m.id);

    const [{ data: scheds }, { data: doseLogs }] = await Promise.all([
      medIds.length
        ? supabase.from('schedules').select('*').in('medication_id', medIds).order('time')
        : Promise.resolve({ data: [] as Schedule[] }),
      supabase.from('dose_logs').select('*').eq('household_id', householdId).eq('date', today),
    ]);

    setMedications(meds ?? []);
    setSchedules(scheds ?? []);
    setLogs(doseLogs ?? []);
    setLoading(false);
  }, [petId, householdId, today]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch asíncrono; el estado se asigna tras el await
    refresh();
  }, [refresh]);

  // Realtime: si otro cuidador marca/desmarca una toma o cambia una pauta, refrescamos
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase
      .channel(`household-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dose_logs',
          filter: `household_id=eq.${householdId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medications' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, refresh]);

  const doses: TodayDose[] = useMemo(() => {
    const medById = new Map(medications.map((m) => [m.id, m]));
    return schedules
      .map((schedule) => ({
        schedule,
        medication: medById.get(schedule.medication_id)!,
        log: logs.find((l) => l.schedule_id === schedule.id) ?? null,
      }))
      .filter((d) => d.medication)
      .sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  }, [medications, schedules, logs]);

  const toggleDose = useCallback(
    async (dose: TodayDose, caregiverId: string) => {
      if (!householdId) return;

      if (dose.log) {
        // Desmarcar (deshacer errores, PRD F1)
        setLogs((prev) => prev.filter((l) => l.id !== dose.log!.id));
        const { error } = await supabase.from('dose_logs').delete().eq('id', dose.log.id);
        if (error) await refresh();
        return;
      }

      // Optimista: pinta la huella al instante
      const optimistic: DoseLog = {
        id: `optimistic-${dose.schedule.id}`,
        household_id: householdId,
        schedule_id: dose.schedule.id,
        date: today,
        given_by: caregiverId,
        given_at: new Date().toISOString(),
        notes: null,
      };
      setLogs((prev) => [...prev, optimistic]);

      const { error } = await supabase.from('dose_logs').insert({
        household_id: householdId,
        schedule_id: dose.schedule.id,
        date: today,
        given_by: caregiverId,
      });
      // 23505 = otro cuidador la marcó justo antes; en cualquier caso, re-sincroniza
      await refresh();
      if (error && !error.message.includes('duplicate')) {
        console.warn('No se pudo registrar la toma:', error.message);
      }
    },
    [householdId, today, refresh]
  );

  return { doses, medications, loading, refresh, toggleDose };
}
