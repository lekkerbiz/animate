import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { Colors, Fonts, Gradients, Spacing } from '@/constants/theme';

const SLIDES = [
  {
    key: 'mundo',
    image: require('../../../assets/onboarding/slide-1.png'),
    title: 'Todo su mundo en tus manos',
    body: 'Organiza su salud, rutinas y bienestar desde un solo lugar.',
  },
  {
    key: 'importante',
    image: require('../../../assets/onboarding/slide-2.png'),
    title: 'No te pierdas nada importante',
    body: 'Recordatorios, citas, vacunas y más. Siempre al día.',
  },
  {
    key: 'facil',
    image: require('../../../assets/onboarding/slide-3.png'),
    title: 'Cuídalos fácil. Disfrútalos más.',
    body: 'Bienestar, cuidados y mucho amor. Así de simple.',
  },
];

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} resizeMode="cover" style={{ width, height }}>
            {/* Degradado inferior para la legibilidad del texto y los botones */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']}
              locations={[0.35, 0.65, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.slideContent, { top: height * 0.5 }]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </ImageBackground>
        )}
      />

      {/* Barras de progreso tipo story */}
      <View style={[styles.bars, { top: insets.top + Spacing.s }]}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={styles.barTrack}>
            {i <= index && (
              <LinearGradient
                colors={Gradients.progress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.barFill, i === index && styles.barFillActive]}
              />
            )}
          </View>
        ))}
      </View>

      {/* CTAs fijos */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.l }]}>
        <Button label="Regístrame" variant="glass" onPress={() => router.push('/register')} />
        <Button label="Iniciar sesión" variant="glassOutline" onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  bars: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.s,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
  },
  barFillActive: {
    width: '67%',
  },
  slideContent: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    gap: Spacing.l,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.white,
    maxWidth: 311,
  },
  body: {
    fontFamily: Fonts.medium,
    fontSize: 21,
    lineHeight: 31,
    color: Colors.white,
    maxWidth: 311,
  },
  actions: {
    position: 'absolute',
    left: Spacing.m,
    right: Spacing.m,
    bottom: 0,
    gap: Spacing.m,
  },
});
