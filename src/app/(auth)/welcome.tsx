import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { Colors, Fonts, Spacing } from '@/constants/theme';

/** Éxito de alta (Figma ON 25, nodo 2096:1753). */
export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.body}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Te damos la bienvenida</Text>
        <Text style={styles.subtitle}>
          Tu cuenta está creada y ya está todo listo para que empieces a cuidar de tus
          mascotas.
        </Text>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Empezar" variant="glass" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.m,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 17,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.m,
  },
});
