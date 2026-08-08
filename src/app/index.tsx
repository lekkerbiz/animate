import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

/**
 * Puerta de entrada: decide a dónde va el usuario según su estado.
 * Sin sesión → onboarding · sin perfil → crear perfil · sin hogar → alta de hogar · resto → home.
 */
export default function Gate() {
  const { session, caregiver, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    // Prolonga visualmente el splash nativo mientras se resuelve la sesión
    return <View style={styles.splash} />;
  }

  if (!session) return <Redirect href="/onboarding" />;
  if (!caregiver) {
    return session.user.user_metadata?.profile_completed ? (
      <Redirect href="/household" />
    ) : (
      <Redirect href="/profile" />
    );
  }
  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});
