import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Gradients, Spacing } from '@/constants/theme';
import type { Pet } from '@/types/database';

type Props = {
  pets: Pet[];
  selectedId: string | null;
  onSelect: (pet: Pet) => void;
  onAdd: () => void;
};

const AVATAR = 62;

export function PetStories({ pets, selectedId, onSelect, onAdd }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {pets.map((pet) => {
        const selected = pet.id === selectedId;
        return (
          <Pressable
            key={pet.id}
            accessibilityRole="button"
            onPress={() => onSelect(pet)}
            style={styles.item}
          >
            <LinearGradient
              colors={selected ? Gradients.progress : ([Colors.border, Colors.border] as const)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ring}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{pet.emoji}</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
              {pet.name}
            </Text>
          </Pressable>
        );
      })}

      <Pressable accessibilityRole="button" onPress={onAdd} style={styles.item}>
        <View style={styles.addCircle}>
          <Text style={styles.addPlus}>+</Text>
        </View>
        <Text style={styles.name}>Añadir</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.s,
    width: AVATAR + 8,
  },
  ring: {
    width: AVATAR + 6,
    height: AVATAR + 6,
    borderRadius: (AVATAR + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  name: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
    maxWidth: AVATAR + 8,
  },
  nameSelected: {
    fontFamily: Fonts.bold,
    color: Colors.ink,
  },
  addCircle: {
    width: AVATAR + 6,
    height: AVATAR + 6,
    borderRadius: (AVATAR + 6) / 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 26,
    color: Colors.inkSecondary,
    lineHeight: 30,
  },
});
