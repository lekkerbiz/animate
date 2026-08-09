// Tipos del esquema de Supabase (supabase/migrations/20260801120000_initial_schema.sql).
// TODO: sustituir por tipos generados con `supabase gen types typescript` cuando el CLI esté vinculado.

type HouseholdRow = {
  id: string;
  name: string;
  created_at: string;
};

type CaregiverRow = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  emoji: string;
  created_at: string;
};

type PetSex = 'macho' | 'hembra' | 'desconocido';

type PetRow = {
  id: string;
  household_id: string;
  name: string;
  species: string;
  emoji: string;
  notes: string | null;
  breed: string | null;
  sex: PetSex | null;
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  color: string | null;
  bio: string | null;
  behavior: string[];
  microchip: string | null;
  // ruta en el bucket pet-photos; hay que firmarla para poder mostrarla
  photo_path: string | null;
  created_at: string;
};

type MedicationRow = {
  id: string;
  pet_id: string;
  name: string;
  dose: string;
  instructions: string | null;
  active: boolean;
  // vigencia de la pauta: genera tomas entre estas fechas, sin fin = indefinida
  starts_on: string;
  ends_on: string | null;
  created_at: string;
};

type ScheduleRow = {
  id: string;
  medication_id: string;
  time: string;
};

type DoseStatus = 'dada' | 'omitida' | 'rechazada';

type DoseLogRow = {
  id: string;
  household_id: string;
  schedule_id: string | null;
  pet_id: string | null;
  date: string;
  status: DoseStatus;
  // copia del momento de la toma, para que el historial sobreviva a que se
  // borre la medicina o se cambie la pauta
  medication_name: string | null;
  medication_dose: string | null;
  scheduled_time: string | null;
  given_by: string | null;
  given_at: string;
  notes: string | null;
};

type EventKind = 'sintoma' | 'visita' | 'vacuna' | 'peso' | 'otro';

type EventRow = {
  id: string;
  household_id: string;
  pet_id: string;
  kind: EventKind;
  occurred_on: string;
  occurred_at: string | null;
  title: string;
  notes: string | null;
  value: number | null;
  unit: string | null;
  created_by: string | null;
  created_at: string;
};

type InviteRow = {
  id: string;
  household_id: string;
  code: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      households: Table<HouseholdRow, never>;
      caregivers: Table<CaregiverRow, 'household_id' | 'name'>;
      pets: Table<PetRow, 'household_id' | 'name'>;
      medications: Table<MedicationRow, 'pet_id' | 'name' | 'dose'>;
      schedules: Table<ScheduleRow, 'medication_id' | 'time'>;
      dose_logs: Table<DoseLogRow, 'household_id' | 'date'>;
      events: Table<EventRow, 'household_id' | 'pet_id' | 'kind' | 'occurred_on' | 'title'>;
      invites: Table<InviteRow, 'household_id'>;
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: {
          p_household_name: string;
          p_caregiver_name: string;
          p_caregiver_emoji: string;
          p_pet_name: string;
          p_pet_species: string;
          p_pet_emoji: string;
        };
        Returns: string;
      };
      accept_invite: {
        Args: {
          p_code: string;
          p_name: string;
          p_emoji: string;
        };
        Returns: string;
      };
      is_household_member: {
        Args: { h: string };
        Returns: boolean;
      };
      try_uuid: {
        Args: { value: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Household = HouseholdRow;
export type Caregiver = CaregiverRow;
export type Pet = PetRow;
export type { PetSex };
export type Medication = MedicationRow;
export type Schedule = ScheduleRow;
export type DoseLog = DoseLogRow;
export type Event = EventRow;
export type Invite = InviteRow;
export type { DoseStatus, EventKind };
