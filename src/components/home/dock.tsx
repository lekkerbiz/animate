import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/**
 * Dock inferior del Figma. De momento solo "Mascotas" está activo;
 * el resto de pestañas (agenda, salud, cuidadores) llegarán con sus pantallas.
 */
export function Dock() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + Spacing.s }]}>
      <View style={styles.dock}>
        <View style={styles.activeTab}>
          <Ionicons name="paw" size={18} color={Colors.white} />
          <Text style={styles.activeLabel}>Mascotas</Text>
        </View>
        <Ionicons name="calendar-outline" size={22} color={Colors.inkSecondary} style={styles.mutedIcon} />
        <Ionicons name="medkit-outline" size={22} color={Colors.inkSecondary} style={styles.mutedIcon} />
        <Ionicons name="people-outline" size={22} color={Colors.inkSecondary} style={styles.mutedIcon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.l,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    shadowColor: '#2B478D',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.s + 2,
    paddingHorizontal: Spacing.m,
  },
  activeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  mutedIcon: {
    opacity: 0.55,
    padding: Spacing.s,
  },
});
