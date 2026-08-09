import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Gradients, Hero, Radius, Spacing } from '@/constants/theme';
import type { Pet } from '@/types/database';

type Metric = {
  label: string;
  value: string;
};

type Props = {
  pet: Pet;
  metrics: Metric[];
  onPress: () => void;
};

export function HeroCard({ pet, metrics, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ficha de ${pet.name}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.card}
      >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {pet.name} <Text style={styles.nameEmoji}>{pet.emoji}</Text>
            </Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.75)" />
          </View>
          <Text style={styles.species}>{capitalize(pet.species)}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Feliz y con energía</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.chip}>
            <Text style={styles.chipLabel}>{m.label}</Text>
            <Text style={styles.chipValue}>{m.value}</Text>
          </View>
        ))}
      </View>
      </LinearGradient>
    </Pressable>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.l,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.m,
  },
  titleWrap: {
    gap: 2,
    flexShrink: 1,
  },
  name: {
    flexShrink: 1,
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: Colors.white,
  },
  nameEmoji: {
    fontSize: 20,
  },
  species: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  statusPill: {
    backgroundColor: Hero.statusBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.m,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Hero.statusText,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  chip: {
    flex: 1,
    backgroundColor: Hero.chip,
    borderRadius: 14,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
    gap: 2,
  },
  chipLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  chipValue: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.white,
  },
});
