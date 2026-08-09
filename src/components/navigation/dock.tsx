import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/**
 * Dock inferior del Figma, montado como tabBar del navegador.
 *
 * Vive fuera de las pantallas a propósito: cuando cada pantalla pintaba el
 * suyo, el dock viajaba con la transición y parecía que se movía todo. Aquí lo
 * dibuja el navegador una sola vez y solo cambia el contenido.
 *
 * El ancho del dock y el de las pestañas inactivas son fijos, y la activa
 * ocupa el resto: así la barra mide siempre igual aunque las etiquetas tengan
 * distinta longitud ("Mascotas" y "Calendario" no miden lo mismo).
 */
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  home: { on: 'paw', off: 'paw-outline' },
  calendar: { on: 'calendar', off: 'calendar-outline' },
};

// Pestañas del diseño que aún no tienen pantalla: se pintan apagadas en lugar
// de llevar a ningún sitio.
const PLACEHOLDERS: (keyof typeof Ionicons.glyphMap)[] = ['medkit-outline', 'people-outline'];

export function Dock({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + Spacing.s }]} pointerEvents="box-none">
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const icon = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={focused ? styles.tabActive : styles.tab}
            >
              <Ionicons
                name={focused ? icon.on : icon.off}
                size={focused ? 18 : 22}
                color={focused ? Colors.white : Colors.inkSecondary}
              />
              {focused ? (
                <Text style={styles.activeLabel} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        {PLACEHOLDERS.map((name) => (
          <View key={name} style={styles.tab} accessibilityElementsHidden>
            <Ionicons name={name} size={22} color={Colors.inkSecondary} style={styles.muted} />
          </View>
        ))}
      </View>
    </View>
  );
}

const TAB_WIDTH = 46;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    width: 348,
    maxWidth: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
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
  tab: {
    width: TAB_WIDTH,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    minHeight: 44,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.m,
  },
  activeLabel: {
    flexShrink: 1,
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  muted: {
    opacity: 0.55,
  },
});
