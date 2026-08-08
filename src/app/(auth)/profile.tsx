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

// TODO(figma): ON 18 usa foto de perfil; cambiar a expo-image-picker + Storage
// cuando se decida el bucket. De momento, avatar emoji como en el resto de la app.
const AVATARS = ['🙂', '😄', '😎', '🤓', '🥰', '🦸'];

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

type Errors = Partial<Record<'name' | 'birthDate', string>>;

/** Crea tu perfil (Figma ON 18, nodo 2099:2446). Guarda en metadatos del usuario. */
export default function Profile() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const metadata = session?.user.user_metadata ?? {};

  const [emoji, setEmoji] = useState<string>(metadata.emoji ?? AVATARS[0]);
  const [name, setName] = useState<string>(metadata.full_name ?? '');
  const [lastName, setLastName] = useState<string>(metadata.last_name ?? '');
  const [birthDate, setBirthDate] = useState<string>(metadata.birth_date ?? '');
  const [city, setCity] = useState<string>(metadata.city ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Cuéntanos tu nombre';
    if (birthDate.trim() && !DATE_RE.test(birthDate.trim())) {
      next.birthDate = 'Usa el formato DD/MM/AAAA';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        emoji,
        full_name: name.trim(),
        last_name: lastName.trim() || null,
        birth_date: birthDate.trim() || null,
        city: city.trim() || null,
        profile_completed: true,
      },
    });
    setSaving(false);
    if (error) {
      setErrors({ name: error.message });
      return;
    }
    router.replace('/welcome');
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
        <Text style={styles.step}>Paso 1 de 2</Text>

        <View style={styles.header}>
          <Title>Crea tu perfil</Title>
          <Subtitle>Queremos conocerte un poco mejor para personalizar tu experiencia.</Subtitle>
        </View>

        <View style={styles.avatarWrap}>
          <Text style={styles.fieldLabel}>Tu avatar</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setEmoji(option)}
                style={[styles.avatar, emoji === option && styles.avatarActive]}
              >
                <Text style={styles.avatarEmoji}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label="Nombre"
          placeholder="¿Cómo te llamas?"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <Field
          label="Apellidos (opcional)"
          placeholder="Tus apellidos"
          autoComplete="family-name"
          value={lastName}
          onChangeText={setLastName}
        />
        <Field
          label="Fecha de nacimiento (opcional)"
          placeholder="DD/MM/AAAA"
          keyboardType="numbers-and-punctuation"
          value={birthDate}
          onChangeText={setBirthDate}
          error={errors.birthDate}
        />
        <Field
          label="Ciudad (opcional)"
          placeholder="¿Dónde vives?"
          value={city}
          onChangeText={setCity}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Continuar" loading={saving} onPress={submit} />
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
  step: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  header: {
    gap: Spacing.m,
  },
  avatarWrap: {
    gap: Spacing.s,
  },
  fieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  avatar: {
    width: 53,
    height: 53,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE9F1',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  footer: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.m,
    alignItems: 'center',
  },
});
