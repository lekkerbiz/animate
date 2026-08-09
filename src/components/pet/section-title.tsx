import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

/**
 * El componente `title-medium` del Figma: icono + título y, opcionalmente,
 * un enlace de acción a la derecha. Se repite en la ficha (Características,
 * Comportamiento) y en las secciones nuevas de Home.
 */
type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionTitle({ icon, title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkLabel}>{actionLabel}</Text>
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    minHeight: 40,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.ink,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 24,
  },
  linkPressed: {
    opacity: 0.6,
  },
  linkLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
