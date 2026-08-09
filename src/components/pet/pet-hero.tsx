import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Gradients, Radius, Spacing } from '@/constants/theme';
import { formatAge } from '@/lib/dates';
import type { Pet, PetSex } from '@/types/database';

const HERO_HEIGHT = 360;
const CARD_OVERLAP = 56;

const SEX_ICON: Record<PetSex, keyof typeof Ionicons.glyphMap> = {
  macho: 'male',
  hembra: 'female',
  desconocido: 'help',
};

type Props = {
  pet: Pet;
  photoUrl: string | null;
  onBack: () => void;
  onEdit: () => void;
};

export function PetHero({ pet, photoUrl, onBack, onEdit }: Props) {
  const insets = useSafeAreaInsets();
  const age = formatAge(pet.birth_date);
  // Bajo el nombre, la ficha muestra una línea de contexto. Se compone con lo
  // que haya: raza y edad son opcionales, la especie siempre está.
  const subtitle = [pet.breed || capitalize(pet.species), age].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" transition={200} />
      ) : (
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.photo}
        >
          <Text style={styles.placeholderEmoji}>{pet.emoji}</Text>
        </LinearGradient>
      )}

      {/* La foto va a sangre bajo la barra de estado, así que oscurecemos esa
          franja para que la hora y los botones se lean sobre cualquier foto. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent']}
        style={[styles.scrim, { height: insets.top + 72 }]}
        pointerEvents="none"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [
          styles.circleButton,
          styles.back,
          { top: insets.top + Spacing.s },
          pressed && styles.backPressed,
        ]}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.ink} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar la ficha de ${pet.name}`}
        onPress={onEdit}
        hitSlop={8}
        style={({ pressed }) => [
          styles.circleButton,
          styles.edit,
          { top: insets.top + Spacing.s },
          pressed && styles.backPressed,
        ]}
      >
        <Ionicons name="pencil" size={20} color={Colors.ink} />
      </Pressable>

      <View style={styles.card}>
        <View style={styles.cardText}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {pet.sex ? (
          <View style={styles.sexBadge} accessibilityLabel={`Sexo: ${pet.sex}`}>
            <Ionicons name={SEX_ICON[pet.sex]} size={22} color={Colors.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: CARD_OVERLAP,
  },
  photo: {
    height: HERO_HEIGHT,
    width: '100%',
    borderBottomLeftRadius: Radius.l,
    borderBottomRightRadius: Radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.pinkSoft,
  },
  placeholderEmoji: {
    fontSize: 96,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // base sin lado ni top: cada botón fija su lado, y el top lo pone el
  // componente a partir del inset seguro (si no, cae bajo la barra de estado)
  circleButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    left: Spacing.l,
  },
  edit: {
    right: Spacing.l,
  },
  backPressed: {
    opacity: 0.7,
  },
  card: {
    position: 'absolute',
    left: Spacing.m,
    right: Spacing.m,
    bottom: 0,
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    backgroundColor: Colors.white,
    borderRadius: Radius.l,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    shadowColor: '#2B478D',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  sexBadge: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: Colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
