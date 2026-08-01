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
const MIN_PASSWORD = 6;

type Props = {
  mode: 'register' | 'login';
};

/** Auth con email + contraseña (registro e inicio de sesión). */
export function AuthEmailScreen({ mode }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const isRegister = mode === 'register';

  const submit = async () => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      setError('Escribe un correo válido');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    setError(null);
    setSending(true);

    if (isRegister) {
      const { data, error: err } = await supabase.auth.signUp({
        email: normalized,
        password,
      });
      setSending(false);
      if (err) {
        if (err.message.toLowerCase().includes('already registered')) {
          setError('Este correo ya tiene cuenta. Inicia sesión.');
        } else {
          setError(err.message);
        }
        return;
      }
      if (!data.session) {
        // El proyecto tiene activada la confirmación por email
        setPendingConfirm(true);
        return;
      }
      router.replace('/');
      return;
    }

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
          <Title>{isRegister ? 'Crea tu cuenta' : 'Hola de nuevo'}</Title>
          <Subtitle>
            {isRegister
              ? 'Solo necesitas un correo y una contraseña.'
              : 'Inicia sesión para volver con los tuyos.'}
          </Subtitle>
        </View>

        {pendingConfirm ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirma tu correo 📬</Text>
            <Text style={styles.confirmBody}>
              Te hemos enviado un enlace de confirmación a {email.trim().toLowerCase()}. Ábrelo
              y después inicia sesión.
            </Text>
          </View>
        ) : (
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
              placeholder={isRegister ? `Mínimo ${MIN_PASSWORD} caracteres` : 'Tu contraseña'}
              secureTextEntry
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              returnKeyType="go"
              error={error}
            />
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        {pendingConfirm ? (
          <Button label="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
        ) : (
          <Button
            label={isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            loading={sending}
            onPress={submit}
          />
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(isRegister ? '/login' : '/register')}
          hitSlop={8}
        >
          <Text style={styles.switchMode}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Aún no tienes cuenta? Regístrate'}
          </Text>
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
  confirmBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.l,
    gap: Spacing.s,
  },
  confirmTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.ink,
  },
  confirmBody: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkSecondary,
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
