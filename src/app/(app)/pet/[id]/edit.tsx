import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ChipGroup, Field } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePet } from '@/hooks/use-pet';
import { formatSpanishDate, parseSpanishDate } from '@/lib/dates';
import {
  pickPhoto,
  removePetPhoto,
  UnsupportedPhotoError,
  uploadPetPhoto,
  type PickedPhoto,
} from '@/lib/pet-photo';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Pet, PetSex } from '@/types/database';

const SPECIES = [
  { key: 'perro', label: 'Perro', emoji: '🐶' },
  { key: 'gato', label: 'Gato', emoji: '🐱' },
  { key: 'otro', label: 'Otro', emoji: '🐾' },
] as const;

const SEXES = [
  { key: 'macho', label: 'Macho' },
  { key: 'hembra', label: 'Hembra' },
  { key: 'desconocido', label: 'Sin determinar' },
] as const;

export default function PetEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pet, photoUrl, loading } = usePet(id ?? null);

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <Text style={styles.errorTitle}>No encontramos esa mascota</Text>
        <Button label="Volver" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  // El formulario se monta con la mascota ya cargada, así que puede inicializar
  // su estado desde las props sin sincronizarlo después con un efecto.
  return <PetEditForm pet={pet} photoUrl={photoUrl} />;
}

function PetEditForm({ pet, photoUrl }: { pet: Pet; photoUrl: string | null }) {
  const insets = useSafeAreaInsets();
  const { caregiver } = useAuth();

  const [name, setName] = useState(pet.name);
  const [species, setSpecies] = useState<string>(pet.species);
  const [breed, setBreed] = useState(pet.breed ?? '');
  const [sex, setSex] = useState<PetSex | null>(pet.sex);
  const [birthDate, setBirthDate] = useState(formatSpanishDate(pet.birth_date));
  const [weight, setWeight] = useState(pet.weight_kg != null ? String(pet.weight_kg) : '');
  const [height, setHeight] = useState(pet.height_cm != null ? String(pet.height_cm) : '');
  const [color, setColor] = useState(pet.color ?? '');
  const [bio, setBio] = useState(pet.bio ?? '');
  const [behavior, setBehavior] = useState<string[]>(pet.behavior);
  const [trait, setTrait] = useState('');
  const [microchip, setMicrochip] = useState(pet.microchip ?? '');
  const [picked, setPicked] = useState<PickedPhoto | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addTrait = () => {
    const value = trait.trim();
    if (!value || behavior.includes(value)) {
      setTrait('');
      return;
    }
    setBehavior((prev) => [...prev, value]);
    setTrait('');
  };

  const choosePhoto = async () => {
    setFormError(null);
    try {
      const photo = await pickPhoto();
      if (photo) setPicked(photo);
    } catch (e) {
      setFormError(
        e instanceof UnsupportedPhotoError ? e.message : 'No pudimos abrir la galería.'
      );
    }
  };

  const save = async () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = 'El nombre no puede quedar vacío.';

    const parsedBirth = parseSpanishDate(birthDate);
    if (parsedBirth === undefined) nextErrors.birthDate = 'Usa el formato DD/MM/AAAA y una fecha pasada.';

    const parsedWeight = parseDecimal(weight);
    if (parsedWeight === undefined) nextErrors.weight = 'Escribe un número mayor que cero.';

    const parsedHeight = parseDecimal(height);
    if (parsedHeight === undefined) nextErrors.height = 'Escribe un número mayor que cero.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!caregiver?.household_id) {
      setFormError('No hemos podido identificar tu hogar. Vuelve a entrar e inténtalo de nuevo.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let photoPath = pet.photo_path;
      if (picked) {
        photoPath = await uploadPetPhoto(picked, caregiver.household_id, pet.id);
        // cambiar de formato deja huérfano el fichero anterior
        if (pet.photo_path && pet.photo_path !== photoPath) {
          await removePetPhoto(pet.photo_path);
        }
      }

      const emoji = SPECIES.find((s) => s.key === species)?.emoji ?? pet.emoji;

      const { error } = await supabase
        .from('pets')
        .update({
          name: name.trim(),
          species,
          emoji,
          breed: breed.trim() || null,
          sex,
          birth_date: parsedBirth,
          weight_kg: parsedWeight,
          height_cm: parsedHeight,
          color: color.trim() || null,
          bio: bio.trim() || null,
          behavior,
          microchip: microchip.trim() || null,
          photo_path: photoPath,
        })
        .eq('id', pet.id);

      if (error) throw error;

      router.back();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const preview = picked?.uri ?? photoUrl;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.m, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={Colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Editar ficha</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar la foto de la mascota"
          onPress={choosePhoto}
          style={({ pressed }) => [styles.photoWrap, pressed && styles.pressed]}
        >
          {preview ? (
            <Image source={{ uri: preview }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoEmpty]}>
              <Text style={styles.photoEmoji}>{pet.emoji}</Text>
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={18} color={Colors.white} />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>
          {picked ? 'Se subirá al guardar' : 'Toca la foto para cambiarla'}
        </Text>

        <Field label="Nombre" value={name} onChangeText={setName} error={errors.name} />

        <ChipGroup label="Especie" options={SPECIES} value={species} onChange={setSpecies} />

        <Field
          label="Raza"
          value={breed}
          onChangeText={setBreed}
          placeholder="Ej. Bulldog francés"
        />

        <ChipGroup label="Sexo" options={SEXES} value={sex} onChange={setSex} />

        <Field
          label="Fecha de nacimiento"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="DD/MM/AAAA"
          keyboardType="numbers-and-punctuation"
          error={errors.birthDate}
        />

        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Field
              label="Peso (kg)"
              value={weight}
              onChangeText={setWeight}
              placeholder="5,5"
              keyboardType="decimal-pad"
              error={errors.weight}
            />
          </View>
          <View style={styles.pairItem}>
            <Field
              label="Altura (cm)"
              value={height}
              onChangeText={setHeight}
              placeholder="42"
              keyboardType="decimal-pad"
              error={errors.height}
            />
          </View>
        </View>

        <Field label="Color" value={color} onChangeText={setColor} placeholder="Ej. Negro" />

        <Field
          label="Sobre él o ella"
          value={bio}
          onChangeText={setBio}
          placeholder="Cómo es, qué le gusta, qué conviene saber..."
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />

        <View style={styles.traitsWrap}>
          <Text style={styles.traitsLabel}>Comportamiento</Text>
          {behavior.length ? (
            <View style={styles.traitList}>
              {behavior.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${item}`}
                  onPress={() => setBehavior((prev) => prev.filter((t) => t !== item))}
                  style={({ pressed }) => [styles.trait, pressed && styles.pressed]}
                >
                  <Text style={styles.traitText}>{item}</Text>
                  <Ionicons name="close" size={16} color={Colors.primary} />
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.traitInputRow}>
            <View style={styles.traitInput}>
              <Field
                value={trait}
                onChangeText={setTrait}
                placeholder="Ej. Territorial con otros perros"
                onSubmitEditing={addTrait}
                returnKeyType="done"
              />
            </View>
            <Button label="Añadir" variant="outline" onPress={addTrait} style={styles.traitAdd} />
          </View>
        </View>

        <Field
          label="Nº de microchip"
          value={microchip}
          onChangeText={setMicrochip}
          placeholder="15 dígitos"
          keyboardType="number-pad"
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Button label="Guardar cambios" loading={saving} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** "5,5" → 5.5. undefined si no es un número válido, null si está vacío. */
function parseDecimal(value: string): number | null | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.ink,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.ink,
  },
  headerSpacer: {
    width: 26,
  },
  pressed: {
    opacity: 0.7,
  },
  photoWrap: {
    alignSelf: 'center',
  },
  photo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: Colors.pinkSoft,
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 56,
  },
  photoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    marginTop: -Spacing.s,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  pair: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  pairItem: {
    flex: 1,
  },
  multiline: {
    minHeight: 110,
    paddingTop: Spacing.m,
    textAlignVertical: 'top',
  },
  traitsWrap: {
    gap: Spacing.s,
  },
  traitsLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  traitList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  trait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.pinkSoft,
    paddingHorizontal: Spacing.m,
  },
  traitText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.primary,
  },
  traitInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
  },
  traitInput: {
    flex: 1,
  },
  traitAdd: {
    paddingHorizontal: Spacing.l,
  },
  formError: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.danger,
  },
});
