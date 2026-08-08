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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Subtitle, Title } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9,12}$/;

// Checklist de contraseña del Figma (RE 10.3, nodo 2096:1125)
const PASSWORD_RULES = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'Al menos una mayúscula', test: (v: string) => /[A-ZÁÉÍÓÚÜÑ]/.test(v) },
  { key: 'digit', label: 'Al menos un número', test: (v: string) => /\d/.test(v) },
  {
    key: 'special',
    label: 'Al menos un carácter especial',
    test: (v: string) => /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/.test(v),
  },
];

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password', string>>;

/** Registro (Figma RE 10–10.6): nombre, correo, teléfono y contraseña con checklist. */
export default function Register() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\s/g, '');
    const next: Errors = {};

    if (!name.trim()) next.name = 'Cuéntanos tu nombre';
    if (!EMAIL_RE.test(normalizedEmail)) next.email = 'Escribe un correo válido';
    if (normalizedPhone && !PHONE_RE.test(normalizedPhone)) {
      next.phone = 'Escribe un teléfono válido (solo números)';
    }
    if (PASSWORD_RULES.some((rule) => !rule.test(password))) {
      next.password = 'La contraseña aún no cumple todos los requisitos';
      setPasswordTouched(true);
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name.trim(),
          // Sin verificación por SMS en esta fase: el teléfono es solo dato de perfil
          phone: normalizedPhone ? `+34${normalizedPhone}` : null,
        },
      },
    });
    setSending(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        setErrors({ email: 'Este correo ya tiene cuenta. Inicia sesión.' });
      } else {
        setErrors({ password: error.message });
      }
      return;
    }
    if (!data.session) {
      // El proyecto tiene activada la confirmación por email
      setPendingConfirm(true);
      return;
    }
    router.replace('/profile');
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
          <Title>Su salud y sus rutinas, sin dramas.</Title>
          <Subtitle>Únete y descubre todo lo que puedes hacer por tu compañero.</Subtitle>
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
              label="Nombre"
              placeholder="¿Cómo te llamas?"
              autoComplete="name"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              error={errors.name}
            />
            <Field
              label="Correo electrónico"
              placeholder="tu@correo.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              error={errors.email}
            />

            {/* Teléfono con prefijo (Figma: flag + prefix). Prefijo fijo +34 por ahora. */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Teléfono (opcional)</Text>
              <View style={styles.phoneRow}>
                <View style={[styles.prefix, errors.phone ? styles.inputError : null]}>
                  <Text style={styles.prefixFlag}>🇪🇸</Text>
                  <Text style={styles.prefixText}>+34</Text>
                </View>
                <TextInput
                  placeholder="600 000 000"
                  placeholderTextColor={Colors.inkSecondary}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={phone}
                  onChangeText={setPhone}
                  style={[styles.phoneInput, errors.phone ? styles.inputError : null]}
                />
              </View>
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Field
                label="Contraseña"
                placeholder="Crea tu contraseña"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordTouched(true)}
                onSubmitEditing={submit}
                returnKeyType="go"
                error={errors.password}
              />
              {passwordTouched ? (
                <View style={styles.rules}>
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <Text key={rule.key} style={[styles.rule, ok && styles.ruleOk]}>
                        {ok ? '✓' : '✗'} {rule.label}
                      </Text>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        {pendingConfirm ? (
          <Button label="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
        ) : (
          <Button label="Crear cuenta" loading={sending} onPress={submit} />
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/login')}
          hitSlop={8}
        >
          <Text style={styles.switchMode}>¿Ya tienes cuenta? Inicia sesión</Text>
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
    paddingBottom: Spacing.xl,
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
  fieldWrap: {
    gap: Spacing.s,
  },
  fieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 53,
    borderRadius: Radius.m,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.m,
  },
  prefixFlag: {
    fontSize: 16,
  },
  prefixText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.ink,
  },
  phoneInput: {
    flex: 1,
    minHeight: 53,
    borderRadius: Radius.m,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.m,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.ink,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldError: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.danger,
  },
  rules: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  rule: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  ruleOk: {
    color: '#1A832E',
  },
  confirmBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.m,
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
