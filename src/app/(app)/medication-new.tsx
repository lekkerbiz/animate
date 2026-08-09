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

import { Button, Field, Subtitle, Title } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { formatSpanishDate, parseSpanishDate, todayLocalISO } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const QUICK_TIMES = ['08:00', '14:00', '22:00'];

export default function MedicationNew() {
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [timeDraft, setTimeDraft] = useState('');
  const [startsOn, setStartsOn] = useState(formatSpanishDate(todayLocalISO()));
  const [endsOn, setEndsOn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addTime = (value: string) => {
    const time = value.trim();
    if (!TIME_RE.test(time)) {
      setError('La hora debe tener formato HH:MM (ej. 09:30)');
      return;
    }
    const normalized = time.padStart(5, '0');
    setError(null);
    setTimeDraft('');
    setTimes((prev) => (prev.includes(normalized) ? prev : [...prev, normalized].sort()));
  };

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const save = async () => {
    if (!petId) return;
    if (!name.trim() || !dose.trim()) {
      setError('El nombre y la dosis son obligatorios');
      return;
    }
    if (times.length === 0) {
      setError('Añade al menos una hora de toma');
      return;
    }

    // la vigencia sí puede mirar al futuro: una pauta puede empezar mañana
    const parsedStart = parseSpanishDate(startsOn, { allowFuture: true });
    const parsedEnd = parseSpanishDate(endsOn, { allowFuture: true });
    const nextErrors: Record<string, string> = {};
    if (parsedStart === undefined || parsedStart === null) {
      nextErrors.startsOn = 'Fecha no válida (DD/MM/AAAA).';
    }
    if (parsedEnd === undefined) nextErrors.endsOn = 'Fecha no válida (DD/MM/AAAA).';
    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      nextErrors.endsOn = 'No puede terminar antes de empezar.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setError(null);
    setSaving(true);

    const { data: med, error: medErr } = await supabase
      .from('medications')
      .insert({
        pet_id: petId,
        name: name.trim(),
        dose: dose.trim(),
        instructions: instructions.trim() || null,
        starts_on: parsedStart as string,
        ends_on: parsedEnd,
      })
      .select('id')
      .single();

    if (medErr || !med) {
      setSaving(false);
      setError(medErr?.message ?? 'No se pudo guardar');
      return;
    }

    const { error: schedErr } = await supabase
      .from('schedules')
      .insert(times.map((time) => ({ medication_id: med.id, time })));

    setSaving(false);
    if (schedErr) {
      setError(schedErr.message);
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
          <Title>Nueva medicina</Title>
          <Subtitle>Apunta la pauta y no volveréis a dudar de si tocaba.</Subtitle>
        </View>

        <Field label="Nombre" placeholder="Ej. Vetriliga" autoFocus value={name} onChangeText={setName} />
        <Field
          label="Dosis"
          placeholder="Ej. media pastilla de 50 mg"
          value={dose}
          onChangeText={setDose}
        />
        <Field
          label="Instrucciones (opcional)"
          placeholder="Ej. con comida"
          value={instructions}
          onChangeText={setInstructions}
        />

        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Field
              label="Empieza"
              value={startsOn}
              onChangeText={setStartsOn}
              placeholder="DD/MM/AAAA"
              keyboardType="numbers-and-punctuation"
              error={errors.startsOn}
            />
          </View>
          <View style={styles.pairItem}>
            <Field
              label="Termina"
              value={endsOn}
              onChangeText={setEndsOn}
              placeholder="Sin fin"
              keyboardType="numbers-and-punctuation"
              error={errors.endsOn}
            />
          </View>
        </View>

        <View style={styles.timesWrap}>
          <Text style={styles.timesLabel}>Horas de toma</Text>

          {times.length > 0 ? (
            <View style={styles.timesRow}>
              {times.map((time) => (
                <Pressable
                  key={time}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar la toma de las ${time}`}
                  onPress={() => removeTime(time)}
                  style={styles.timeChip}
                >
                  <Text style={styles.timeChipText}>{time}h</Text>
                  <Text style={styles.timeChipRemove}>×</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.timeInputRow}>
            <Field
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              value={timeDraft}
              onChangeText={setTimeDraft}
              onSubmitEditing={() => addTime(timeDraft)}
              returnKeyType="done"
              style={styles.timeInput}
            />
            <Button
              label="Añadir hora"
              variant="outline"
              onPress={() => addTime(timeDraft)}
              style={styles.timeAddBtn}
            />
          </View>

          <View style={styles.timesRow}>
            {QUICK_TIMES.filter((t) => !times.includes(t)).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                onPress={() => addTime(t)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>+ {t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Guardar medicina" loading={saving} onPress={save} />
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
  timesWrap: {
    gap: Spacing.m,
  },
  timesLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  timeChipText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },
  timeChipRemove: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: Spacing.s,
    alignItems: 'flex-start',
  },
  timeInput: {
    width: 110,
  },
  timeAddBtn: {
    flex: 1,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  quickChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.danger,
  },
  footer: {
    paddingHorizontal: Spacing.m,
  },
});
