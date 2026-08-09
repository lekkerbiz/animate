import { Tabs } from 'expo-router/js-tabs';

import { Dock } from '@/components/navigation/dock';
import { Colors } from '@/constants/theme';

/**
 * Home y Calendario son pestañas, no pantallas apiladas. Antes eran dos rutas
 * de un Stack y cada una pintaba su propio dock, así que al cambiar de una a
 * otra se deslizaba todo, dock incluido. Aquí el dock lo dibuja el navegador y
 * solo se funde el contenido.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <Dock {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Mascotas' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendario' }} />
    </Tabs>
  );
}
