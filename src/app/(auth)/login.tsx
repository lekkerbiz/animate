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
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      setError('Escribe un correo válido');
      return;
    }
    if (!password) {
      setError('Escribe tu contraseña');
      return;
    }
    setError(null);
    setSending(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    setSending(false);
    if (err) {
      if (err.message.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos');
      } else if (err.message.toLowerCase().includes('not confirmed')) {
        setError('Tu correo aún no está confirmado. Revisa tu bandeja de entrada.');
      } else {
        setError(err.message);
      }
      return;
    }
    router.replace('/');
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
          <Title>Hola de nuevo</Title>
          <Subtitle>Inicia sesión para volver con los tuyos.</Subtitle>
        </View>

        <View style={styles.form}>
          <Field
            label="Correo electrónico"
            placeholder="tu@correo.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            autoFocus
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          <Field
            label="Contraseña"
            placeholder="Tu contraseña"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            returnKeyType="go"
            error={error}
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Iniciar sesión" loading={sending} onPress={submit} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/register')}
          hitSlop={8}
        >
          <Text style={styles.switchMode}>¿Aún no tienes cuenta? Regístrate</Text>
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
    flex: 1,
    paddingHorizontal: Spacing.l,
    gap: Spacing.xl,
  },
  back: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.primary,
  },
  header: {
    gap: Spacing.m,
  },
  form: {
    gap: Spacing.l,
  },
  footer: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.m,
    alignItems: 'center',
  },
  switchMode: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
});
