import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/**
 * Los tres bloques del frame «iPhone 17 - 7»: Identidad, Medicación y Vacunas.
 * Vacunas todavía no tiene pantalla ni tabla, así que se pinta deshabilitado
 * en lugar de llevar a ningún sitio.
 */
type Shortcut = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
  onPress?: () => void;
};

type Props = {
  microchip: string | null;
  onMedication: () => void;
  onIdentity?: () => void;
};

export function PetShortcuts({ microchip, onMedication, onIdentity }: Props) {
  const shortcuts: Shortcut[] = [
    {
      key: 'identidad',
      label: 'Identidad',
      icon: 'card-outline',
      hint: microchip ? 'Chip registrado' : 'Sin chip',
      onPress: onIdentity,
    },
    {
      key: 'medicacion',
      label: 'Medicación',
      icon: 'medkit-outline',
      hint: 'Añadir pauta',
      onPress: onMedication,
    },
    {
      key: 'vacunas',
      label: 'Vacunas',
      icon: 'shield-checkmark-outline',
      hint: 'Próximamente',
    },
  ];

  return (
    <View style={styles.row}>
      {shortcuts.map((item) => {
        const disabled = !item.onPress;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.tile,
              disabled && styles.tileDisabled,
              pressed && styles.tilePressed,
            ]}
          >
            <Ionicons name={item.icon} size={24} color={Colors.primary} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.hint} numberOfLines={1}>
              {item.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tilePressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  hint: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
});
