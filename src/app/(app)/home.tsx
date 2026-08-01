import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dock } from '@/components/home/dock';
import { HeroCard } from '@/components/home/hero-card';
import { MedsCard } from '@/components/home/meds-card';
import { PetStories } from '@/components/home/pet-stories';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTodayMeds } from '@/hooks/use-today-meds';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Caregiver, Pet } from '@/types/database';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { caregiver, signOut } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const householdId = caregiver?.household_id ?? null;
  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null;

  const { doses, medications, refresh, toggleDose } = useTodayMeds(
    selectedPet?.id ?? null,
    householdId
  );

  const loadHousehold = useCallback(async () => {
    if (!householdId) return;
    const [{ data: petRows }, { data: caregiverRows }] = await Promise.all([
      supabase.from('pets').select('*').eq('household_id', householdId).order('created_at'),
      supabase.from('caregivers').select('*').eq('household_id', householdId).order('created_at'),
    ]);
    setPets(petRows ?? []);
    setCaregivers(caregiverRows ?? []);
  }, [householdId]);

  // Carga inicial y recarga al volver de las pantallas de alta (nueva mascota / nueva medicina)
  useFocusEffect(
    useCallback(() => {
      loadHousehold();
      refresh();
    }, [loadHousehold, refresh])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHousehold(), refresh()]);
    setRefreshing(false);
  }, [loadHousehold, refresh]);

  const metrics = useMemo(() => {
    const given = doses.filter((d) => d.log).length;
    return [
      { label: 'Tomas hoy', value: doses.length ? `${given}/${doses.length}` : '—' },
      { label: 'Medicinas', value: String(medications.length) },
      { label: 'Cuidadores', value: String(caregivers.length) },
    ];
  }, [doses, medications, caregivers]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Mancha rosa de fondo de la cabecera, como en el Figma */}
      <View style={styles.blob} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.m, paddingBottom: 120 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola {caregiver?.name}!</Text>
          <View style={styles.headerIcons}>
            <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8}>
              <Ionicons name="log-out-outline" size={24} color={Colors.ink} />
            </Pressable>
          </View>
        </View>

        <PetStories
          pets={pets}
          selectedId={selectedPet?.id ?? null}
          onSelect={(pet) => setSelectedPetId(pet.id)}
          onAdd={() => router.push('/pet-new')}
        />

        {selectedPet ? (
          <View style={styles.cards}>
            <HeroCard pet={selectedPet} metrics={metrics} />
            <MedsCard
              doses={doses}
              onToggle={(dose) => caregiver && toggleDose(dose, caregiver.id)}
              onAdd={() =>
                router.push({ pathname: '/medication-new', params: { petId: selectedPet.id } })
              }
            />
          </View>
        ) : null}
      </ScrollView>

      <Dock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  blob: {
    position: 'absolute',
    top: -140,
    left: -60,
    right: -60,
    height: 480,
    backgroundColor: '#FBE7F6',
    borderBottomLeftRadius: 260,
    borderBottomRightRadius: 320,
  },
  content: {
    gap: Spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
  },
  greeting: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: Colors.ink,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  cards: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },
});
