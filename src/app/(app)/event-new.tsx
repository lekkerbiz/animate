import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ChipGroup, Field, Subtitle, Title } from '@/components/ui';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatSpanishDate, parseSpanishDate } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { EventKind } from '@/types/database';

const KINDS = [
  { key: 'sintoma', label: 'Síntoma', emoji: '🤒' },
  { key: 'visita', label: 'Veterinario', emoji: '🩺' },
  { key: 'vacuna', label: 'Vacuna', emoji: '💉' },
  { key: 'peso', label: 'Peso', emoji: '⚖️' },
  { key: 'otro', label: 'Otro', emoji: '📌' },
] as const;

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export default function EventNew() {
  const insets = useSafeAreaInsets();
  const { caregiver } = useAuth();
  const { petId, date } = useLocalSearchParams<{ petId: string; date?: string }>();

  const [kind, setKind] = useState<EventKind>('sintoma');
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(formatSpanishDate(date ?? null));
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = 'Escribe de qué se trata.';

    const occurredOn = parseSpanishDate(day);
    if (occurredOn === undefined) nextErrors.day = 'Usa el formato DD/MM/AAAA y una fecha pasada.';
    else if (occurredOn === null) nextErrors.day = 'La fecha es obligatoria.';

    if (time.trim() && !TIME_RE.test(time.trim())) {
      nextErrors.time = 'La hora debe tener formato HH:MM.';
    }

    const parsedWeight = kind === 'peso' ? Number(weight.trim().replace(',', '.')) : null;
    if (kind === 'peso' && (!weight.trim() || !Number.isFinite(parsedWeight!) || parsedWeight! <= 0)) {
      nextErrors.weight = 'Escribe un peso mayor que cero.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!petId || !caregiver?.household_id) {
      setFormError('No hemos podido identificar la mascota o el hogar.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const { error } = await supabase.from('events').insert({
      household_id: caregiver.household_id,
      pet_id: petId,
      kind,
      occurred_on: occurredOn as string,
      occurred_at: time.trim() ? time.trim().padStart(5, '0') : null,
      title: title.trim(),
      notes: notes.trim() || null,
      value: kind === 'peso' ? parsedWeight : null,
      unit: kind === 'peso' ? 'kg' : null,
      created_by: caregiver.id,
    });

    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Volver</Text>
        </Pressable>

        <View style={styles.header}>
          <Title>Anotar evento</Title>
          <Subtitle>Lo que pase hoy es el historial de mañana.</Subtitle>
        </View>

        <ChipGroup label="Tipo" options={KINDS} value={kind} onChange={setKind} />

        <Field
          label="Qué ha pasado"
          placeholder={kind === 'visita' ? 'Ej. Revisión anual' : 'Ej. Ha vomitado dos veces'}
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Field
              label="Fecha"
              value={day}
              onChangeText={setDay}
              placeholder="DD/MM/AAAA"
              keyboardType="numbers-and-punctuation"
              error={errors.day}
            />
          </View>
          <View style={styles.pairItem}>
            <Field
              label="Hora (opcional)"
              value={time}
              onChangeText={setTime}
              placeholder="18:30"
              keyboardType="numbers-and-punctuation"
              error={errors.time}
            />
          </View>
        </View>

        {kind === 'peso' ? (
          <Field
            label="Peso (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="6,8"
            keyboardType="decimal-pad"
            error={errors.weight}
          />
        ) : null}

        <Field
          label="Notas (opcional)"
          placeholder="Lo que quieras recordar o contarle al veterinario"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Guardar evento" loading={saving} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.pinkSoft,
  },
  content: {
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
    gap: Spacing.l,
  },
  back: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.primary,
  },
  header: {
    gap: Spacing.m,
  },
  pair: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  pairItem: {
    flex: 1,
  },
  multiline: {
    minHeight: 110,
    paddingTop: Spacing.m,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: Spacing.m,
  },
  formError: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.danger,
  },
});
