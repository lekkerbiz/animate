import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TodayDose } from '@/hooks/use-today-meds';
import { formatTime, isPastTime } from '@/lib/dates';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = {
  doses: TodayDose[];
  onToggle: (dose: TodayDose) => void;
  onAdd: () => void;
};

export function MedsCard({ doses, onToggle, onAdd }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Medicación de hoy</Text>

      {doses.length === 0 ? (
        <Text style={styles.empty}>
          Sin medicinas activas. Añade la primera y te avisaremos de cada toma. 🐾
        </Text>
      ) : (
        <View style={styles.list}>
          {doses.map((dose) => {
            const given = dose.log != null;
            const overdue = !given && isPastTime(dose.schedule.time);
            return (
              <Pressable
                key={dose.schedule.id}
                accessibilityRole="button"
                accessibilityState={{ checked: given }}
                accessibilityLabel={`${dose.medication.name}, ${dose.medication.dose}, ${formatTime(dose.schedule.time)}${given ? ', dada' : overdue ? ', pendiente' : ''}`}
                onPress={() => onToggle(dose)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={[styles.check, given && styles.checkGiven]}>
                  {given ? <Text style={styles.checkPaw}>🐾</Text> : null}
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.medName, given && styles.medNameGiven]}>
                    {dose.medication.name} · {dose.medication.dose}
                  </Text>
                  {dose.medication.instructions ? (
                    <Text style={styles.instructions} numberOfLines={1}>
                      {dose.medication.instructions}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.timeWrap}>
                  <Text style={[styles.time, overdue && styles.timeOverdue]}>
                    {formatTime(dose.schedule.time)}h
                  </Text>
                  {overdue ? <Text style={styles.overdueLabel}>pendiente</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => [styles.addBtn, pressed && styles.rowPressed]}
      >
        <Text style={styles.addLabel}>Añadir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.l,
    padding: Spacing.l,
    gap: Spacing.m,
    shadowColor: '#2B478D',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.ink,
  },
  empty: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.inkSecondary,
  },
  list: {
    gap: Spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 44,
  },
  rowPressed: {
    opacity: 0.7,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGiven: {
    backgroundColor: '#FCE9F1',
    borderColor: Colors.primary,
  },
  checkPaw: {
    fontSize: 14,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  medName: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  medNameGiven: {
    color: Colors.inkSecondary,
    textDecorationLine: 'line-through',
  },
  instructions: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  timeWrap: {
    alignItems: 'flex-end',
  },
  time: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  timeOverdue: {
    color: Colors.primary,
  },
  overdueLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.primary,
  },
  addBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.s,
  },
  addLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.primary,
  },
});
