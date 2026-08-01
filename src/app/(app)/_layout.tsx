import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
