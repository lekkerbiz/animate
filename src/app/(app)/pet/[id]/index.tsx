import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetCharacteristics } from '@/components/pet/pet-characteristics';
import { PetHero } from '@/components/pet/pet-hero';
import { PetShortcuts } from '@/components/pet/pet-shortcuts';
import { SectionTitle } from '@/components/pet/section-title';
import { Button } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePet } from '@/hooks/use-pet';

export default function PetProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { pet, photoUrl, loading, error, refresh } = usePet(id ?? null);

  // al volver de la edición hay que releer: los datos y la foto han cambiado
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const goEdit = () => router.push(`/pet/${id}/edit`);

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Text style={styles.emptyTitle}>No encontramos esa mascota</Text>
        <Text style={styles.emptyBody}>
          {error ?? 'Puede que la hayan eliminado o que pertenezca a otro hogar.'}
        </Text>
        <Button label="Volver" variant="outline" onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <PetHero pet={pet} photoUrl={photoUrl} onBack={goBack} onEdit={goEdit} />

        <View style={styles.body}>
          <View style={styles.section}>
            <SectionTitle
              icon="paw-outline"
              title="Características"
              actionLabel="Editar"
              onAction={goEdit}
            />
            <PetCharacteristics pet={pet} />
          </View>

          {pet.bio ? <Text style={styles.bio}>{pet.bio}</Text> : null}

          <View style={styles.section}>
            <SectionTitle
              icon="happy-outline"
              title="Comportamiento"
              actionLabel="Editar"
              onAction={goEdit}
            />
            {pet.behavior.length ? (
              <View style={styles.behaviorList}>
                {pet.behavior.map((trait) => (
                  <View key={trait} style={styles.behaviorRow}>
                    <Ionicons name="ellipse" size={8} color={Colors.primary} />
                    <Text style={styles.behaviorText}>{trait}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>
                Aún no habéis anotado cómo se comporta. Es lo primero que agradece quien lo cuida
                por primera vez. 🐾
              </Text>
            )}
          </View>

          <PetShortcuts
            microchip={pet.microchip}
            onMedication={() =>
              router.push({ pathname: '/medication-new', params: { petId: pet.id } })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    backgroundColor: Colors.background,
  },
  content: {
    gap: Spacing.l,
  },
  body: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },
  section: {
    gap: Spacing.s,
  },
  bio: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.inkSecondary,
  },
  behaviorList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.m,
  },
  behaviorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    minHeight: 38,
    paddingVertical: Spacing.s,
  },
  behaviorText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.ink,
  },
  empty: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.inkSecondary,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },
});
