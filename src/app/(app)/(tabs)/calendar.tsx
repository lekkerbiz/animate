import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthGrid } from '@/components/calendar/month-grid';
import { PetStories } from '@/components/home/pet-stories';
import { SectionTitle } from '@/components/pet/section-title';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTimeline } from '@/hooks/use-timeline';
import { todayLocalISO } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { adherence, type PlannedDose } from '@/lib/timeline';
import { useAuth } from '@/providers/auth-provider';
import type { Event, Pet } from '@/types/database';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const EVENT_ICON: Record<Event['kind'], keyof typeof Ionicons.glyphMap> = {
  sintoma: 'thermometer-outline',
  visita: 'medkit-outline',
  vacuna: 'shield-checkmark-outline',
  peso: 'speedometer-outline',
  otro: 'ellipsis-horizontal',
};

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const { caregiver } = useAuth();
  const today = todayLocalISO();

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);

  const householdId = caregiver?.household_id ?? null;
  const pet = pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null;

  const { doses, events, summary, setDoseStatus, refresh } = useTimeline(
    pet?.id ?? null,
    householdId,
    anchor
  );

  const loadPets = useCallback(async () => {
    if (!householdId) return;
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at');
    setPets(data ?? []);
  }, [householdId]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
      refresh();
    }, [loadPets, refresh])
  );

  const dayDoses = useMemo(() => doses.filter((d) => d.date === selected), [doses, selected]);
  const dayEvents = useMemo(
    () => events.filter((e) => e.occurred_on === selected),
    [events, selected]
  );
  const rate = useMemo(() => adherence(doses, today), [doses, today]);

  const shiftMonth = (delta: number) => {
    const [y, m] = anchor.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1 + delta, 1));
    setAnchor(next.toISOString().slice(0, 10));
  };

  const [year, month] = anchor.split('-').map(Number);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.m, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Calendario</Text>

        {pets.length ? (
          <PetStories
            pets={pets}
            selectedId={pet?.id ?? null}
            onSelect={(p) => setSelectedPetId(p.id)}
            onAdd={() => router.push('/pet-new')}
          />
        ) : null}

        <View style={styles.card}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mes anterior"
              onPress={() => shiftMonth(-1)}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.ink} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[month - 1]} {year}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mes siguiente"
              onPress={() => shiftMonth(1)}
              hitSlop={10}
            >
              <Ionicons name="chevron-forward" size={22} color={Colors.ink} />
            </Pressable>
          </View>

          <MonthGrid
            anchor={anchor}
            today={today}
            selected={selected}
            summary={summary}
            onSelect={setSelected}
          />

          {rate != null ? (
            <Text style={styles.adherence}>
              {Math.round(rate * 100)}% de las tomas cumplidas este mes
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionTitle icon="time-outline" title={formatDayTitle(selected, today)} />
          {dayDoses.length ? (
            <View style={styles.list}>
              {dayDoses.map((dose) => (
                <DoseRow
                  key={dose.key}
                  dose={dose}
                  onSet={(status) => setDoseStatus(dose, status, caregiver?.id ?? null)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Ninguna toma prevista para este día.</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle
            icon="clipboard-outline"
            title="Eventos"
            actionLabel="Añadir"
            onAction={() =>
              pet &&
              router.push({
                pathname: '/event-new',
                params: { petId: pet.id, date: selected },
              })
            }
          />
          {dayEvents.length ? (
            <View style={styles.list}>
              {dayEvents.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <Ionicons name={EVENT_ICON[event.kind]} size={20} color={Colors.purple} />
                  <View style={styles.eventText}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.notes ? (
                      <Text style={styles.eventNotes} numberOfLines={2}>
                        {event.notes}
                      </Text>
                    ) : null}
                  </View>
                  {event.value != null ? (
                    <Text style={styles.eventValue}>
                      {event.value} {event.unit ?? ''}
                    </Text>
                  ) : event.occurred_at ? (
                    <Text style={styles.eventValue}>{event.occurred_at.slice(0, 5)}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Sin eventos anotados este día.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DoseRow({
  dose,
  onSet,
}: {
  dose: PlannedDose;
  onSet: (status: 'dada' | 'omitida' | 'pendiente') => void;
}) {
  const given = dose.status === 'dada';
  const failed = dose.status === 'omitida' || dose.status === 'rechazada';

  return (
    <View style={styles.doseRow}>
      <Text style={styles.doseTime}>{dose.time}</Text>
      <View style={styles.doseText}>
        <Text style={[styles.doseName, given && styles.doseNameGiven]}>
          {dose.medicationName} · {dose.medicationDose}
        </Text>
        {dose.instructions ? (
          <Text style={styles.doseInstructions} numberOfLines={1}>
            {dose.instructions}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={given ? 'Desmarcar toma' : 'Marcar como dada'}
        accessibilityState={{ selected: given }}
        onPress={() => onSet(given ? 'pendiente' : 'dada')}
        hitSlop={6}
        style={[styles.doseAction, given && styles.doseActionGiven]}
      >
        <Ionicons name="checkmark" size={18} color={given ? Colors.white : Colors.inkSecondary} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={failed ? 'Quitar la marca de fallada' : 'Marcar como no tomada'}
        accessibilityState={{ selected: failed }}
        onPress={() => onSet(failed ? 'pendiente' : 'omitida')}
        hitSlop={6}
        style={[styles.doseAction, failed && styles.doseActionFailed]}
      >
        <Ionicons name="close" size={18} color={failed ? Colors.white : Colors.inkSecondary} />
      </Pressable>
    </View>
  );
}

function formatDayTitle(date: string, today: string): string {
  if (date === today) return 'Hoy';
  const [, m, d] = date.split('-');
  return `${Number(d)} de ${MONTHS[Number(m) - 1]}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.l,
  },
  screenTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: Colors.ink,
    paddingHorizontal: Spacing.l,
  },
  card: {
    marginHorizontal: Spacing.l,
    padding: Spacing.m,
    backgroundColor: Colors.white,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.s,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.s,
    paddingBottom: Spacing.s,
  },
  monthLabel: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.ink,
    textTransform: 'capitalize',
  },
  adherence: {
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
    paddingTop: Spacing.s,
  },
  section: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.s,
  },
  list: {
    backgroundColor: Colors.white,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.m,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.m,
    minHeight: 56,
  },
  doseTime: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.inkSecondary,
    width: 44,
  },
  doseText: {
    flex: 1,
    gap: 2,
  },
  doseName: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  doseNameGiven: {
    color: Colors.inkSecondary,
    textDecorationLine: 'line-through',
  },
  doseInstructions: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  doseAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseActionGiven: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  doseActionFailed: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.m,
    minHeight: 56,
  },
  eventText: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  eventNotes: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  eventValue: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  empty: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.inkSecondary,
  },
});
