import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { formatAge } from '@/lib/dates';
import type { Pet } from '@/types/database';

const EMPTY = '—';

type Props = {
  pet: Pet;
};

export function PetCharacteristics({ pet }: Props) {
  const rows = [
    { label: 'Especie', value: capitalize(pet.species) },
    { label: 'Raza', value: pet.breed || EMPTY },
    { label: 'Edad', value: formatAge(pet.birth_date) ?? EMPTY },
  ];

  const tiles = [
    { label: 'Peso', value: formatNumber(pet.weight_kg, 'kg') },
    { label: 'Altura', value: formatNumber(pet.height_cm, 'cm') },
    { label: 'Color', value: pet.color || EMPTY },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.tiles}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tile}>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Text style={styles.tileValue} numberOfLines={1}>
              {tile.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 5.5 → "5,5 kg"; 5 → "5 kg". Coma decimal, como en el diseño. */
function formatNumber(value: number | null, unit: string) {
  if (value == null) return EMPTY;
  const fixed = Number(value)
    .toFixed(2)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
  return `${fixed} ${unit}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.m,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.m,
    paddingVertical: Spacing.s + 2,
  },
  rowLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  rowValue: {
    flexShrink: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  tile: {
    flex: 1,
    gap: 2,
    backgroundColor: Colors.pinkSoft,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  tileLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  tileValue: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.ink,
  },
});
