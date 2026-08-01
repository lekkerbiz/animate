import { router } from 'expo-router';
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const SPECIES = [
  { key: 'perro', label: 'Perro', emoji: '🐶' },
  { key: 'gato', label: 'Gato', emoji: '🐱' },
  { key: 'otro', label: 'Otro', emoji: '🐾' },
];

type Mode = 'create' | 'join';

export default function Household() {
  const insets = useSafeAreaInsets();
  const { refreshCaregiver, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>('create');

  const [name, setName] = useState('');
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState(SPECIES[0]);
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    await refreshCaregiver();
    router.replace('/');
  };

  const createHousehold = async () => {
    if (!name.trim() || !petName.trim()) {
      setError('Cuéntanos tu nombre y el de tu mascota');
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await supabase.rpc('create_household', {
      p_household_name: `Casa de ${petName.trim()}`,
      p_caregiver_name: name.trim(),
      p_caregiver_emoji: '🙂',
      p_pet_name: petName.trim(),
      p_pet_species: species.key,
      p_pet_emoji: species.emoji,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await finish();
  };

  const joinHousehold = async () => {
    if (!name.trim() || inviteCode.trim().length < 6) {
      setError('Necesitamos tu nombre y el código de invitación');
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await supabase.rpc('accept_invite', {
      p_code: inviteCode.trim().toUpperCase(),
      p_name: name.trim(),
      p_emoji: '🙂',
    });
    setSaving(false);
    if (err) {
      // Los mensajes de error del RPC ya vienen en castellano (código usado/caducado/no válido)
      setError(err.message);
      return;
    }
    await finish();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Title>¡Ya casi está!</Title>
          <Subtitle>Crea el espacio de tu mascota o únete al de tu familia.</Subtitle>
        </View>

        {/* Selector crear / unirse */}
        <View style={styles.segment}>
          {(
            [
              { key: 'create', label: 'Crear espacio' },
              { key: 'join', label: 'Tengo un código' },
            ] as const
          ).map((opt) => (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              onPress={() => {
                setMode(opt.key);
                setError(null);
              }}
              style={[styles.segmentItem, mode === opt.key && styles.segmentItemActive]}
            >
              <Text
                style={[styles.segmentLabel, mode === opt.key && styles.segmentLabelActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field
          label="Tu nombre"
          placeholder="¿Cómo te llamas?"
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />

        {mode === 'create' ? (
          <>
            <Field
              label="Nombre de tu mascota"
              placeholder="Ej. Roma"
              value={petName}
              onChangeText={setPetName}
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
                    <Text
                      style={[styles.chipLabel, species.key === s.key && styles.chipLabelActive]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : (
          <Field
            label="Código de invitación"
            placeholder="6 caracteres"
            autoCapitalize="characters"
            maxLength={6}
            value={inviteCode}
            onChangeText={setInviteCode}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button
          label={mode === 'create' ? 'Crear espacio' : 'Unirme'}
          loading={saving}
          onPress={mode === 'create' ? createHousehold : joinHousehold}
        />
        <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8}>
          <Text style={styles.signOut}>Salir de la cuenta</Text>
        </Pressable>
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
    gap: Spacing.l,
  },
  header: {
    gap: Spacing.m,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    padding: Spacing.xs,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing.s + 2,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: Colors.primary,
  },
  segmentLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  segmentLabelActive: {
    color: Colors.white,
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
  error: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.danger,
  },
  footer: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.m,
    alignItems: 'center',
  },
  signOut: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
});
