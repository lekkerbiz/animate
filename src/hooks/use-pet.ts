import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Pet } from '@/types/database';

// El bucket pet-photos es privado, así que la ruta guardada no se puede pintar
// tal cual: hay que firmarla. La firma se renueva en cada carga de la ficha.
const PHOTO_TTL_SECONDS = 60 * 60;

export function usePet(petId: string | null) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  // sin id no hay nada que cargar: la pantalla resuelve directamente a "no encontrada"
  const [loading, setLoading] = useState(petId != null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!petId) return;

    const { data, error: err } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle();

    if (err) {
      setError(err.message);
      setPet(null);
      setPhotoUrl(null);
      setLoading(false);
      return;
    }

    setError(null);
    setPet(data);
    setLoading(false);

    if (!data?.photo_path) {
      setPhotoUrl(null);
      return;
    }

    const { data: signed } = await supabase.storage
      .from('pet-photos')
      .createSignedUrl(data.photo_path, PHOTO_TTL_SECONDS);
    setPhotoUrl(signed?.signedUrl ?? null);
  }, [petId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch asíncrono; el estado se asigna tras el await
    load();
  }, [load]);

  return { pet, photoUrl, loading, error, refresh: load };
}
