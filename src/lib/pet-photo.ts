import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const BUCKET = 'pet-photos';

// Debe coincidir con allowed_mime_types del bucket: si subimos otra cosa,
// storage rechaza el fichero con un error poco explicativo.
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

export type PickedPhoto = {
  uri: string;
  mimeType: string;
  extension: string;
};

export class UnsupportedPhotoError extends Error {
  constructor(mimeType: string) {
    super(`Ese formato de imagen no vale (${mimeType}). Usa JPG, PNG, WEBP o HEIC.`);
  }
}

/** Abre la galería. Devuelve null si se cancela o si se deniega el permiso. */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = ALLOWED[mimeType];
  if (!extension) throw new UnsupportedPhotoError(mimeType);

  return { uri: asset.uri, mimeType, extension };
}

/**
 * Sube la foto y devuelve su ruta dentro del bucket.
 * La convención {household_id}/{pet_id}/... no es cosmética: las políticas de
 * storage leen la primera carpeta para decidir si eres del hogar.
 */
export async function uploadPetPhoto(
  photo: PickedPhoto,
  householdId: string,
  petId: string
): Promise<string> {
  const bytes = await new File(photo.uri).bytes();
  const path = `${householdId}/${petId}/foto.${photo.extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: photo.mimeType,
    upsert: true,
  });
  if (error) throw error;

  return path;
}

/** Borra un fichero huérfano (p. ej. al cambiar de jpg a png). */
export async function removePetPhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
