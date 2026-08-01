import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Subtitle, Title } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const SPECIES = [
  { key: 'perro', label: 'Perro', emoji: '🐶' },
  { key: 'gato', label: 'Gato', emoji: '🐱' },
  { key: 'otro', label: 'Otro', emoji: '🐾' },
];

export default function PetNew() {
  const insets = useSafeAreaInsets();
  const { caregiver } = useAuth();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(SPECIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!caregiver) return;
    if (!name.trim()) {
      setError('Ponle nombre 🙂');
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await supabase.from('pets').insert({
      household_id: caregiver.household_id,
      name: name.trim(),
      species: species.key,
      emoji: species.emoji,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
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
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Volver</Text>
        </Pressable>

        <View style={styles.header}>
          <Title>Nueva mascota</Title>
          <Subtitle>Otro miembro más de la familia.</Subtitle>
        </View>

        <Field
          label="Nombre"
          placeholder="Ej. Odin"
          autoFocus
          value={name}
          onChangeText={setName}
          error={error}
        />

        <View style={styles.speciesWrap}>
          <Text style={styles.speciesLabel}>Especie</Text>
          <View style={styles.speciesRow}>
            {SPECIES.map((s) => (
              <Pressable
                key={s.key}
                accessibilityRole="button"
                onPress={() => setSpecies(s)}
                style={[styles.chip, species.key === s.key && styles.chipActive]}
              >
                <Text style={styles.chipEmoji}>{s.emoji}</Text>
                <Text style={[styles.chipLabel, species.key === s.key && styles.chipLabelActive]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Añadir mascota" loading={saving} onPress={save} />
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
    flex: 1,
    paddingHorizontal: Spacing.l,
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
  speciesWrap: {
    gap: Spacing.s,
  },
  speciesLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE9F1',
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  chipLabelActive: {
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: Spacing.m,
  },
});
