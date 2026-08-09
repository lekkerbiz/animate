import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { eachDay, monthBounds, type DaySummary } from '@/lib/timeline';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  anchor: string;
  today: string;
  selected: string;
  summary: Map<string, DaySummary>;
  onSelect: (date: string) => void;
};

export function MonthGrid({ anchor, today, selected, summary, onSelect }: Props) {
  const { from, to } = monthBounds(anchor);
  const days = eachDay(from, to);
  // lunes primero, como el calendario español; getUTCDay() da 0 en domingo
  const leading = (new Date(`${from}T00:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <View>
      <View style={styles.week}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leading }, (_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}

        {days.map((date) => {
          const day = summary.get(date);
          const isToday = date === today;
          const isSelected = date === selected;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={dayLabel(date, day)}
              onPress={() => onSelect(date)}
              style={styles.cell}
            >
              <View style={[styles.dayBox, isSelected && styles.dayBoxSelected]}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {Number(date.slice(8, 10))}
                </Text>
                <View style={styles.dots}>
                  {day?.dadas ? <View style={[styles.dot, styles.dotDada]} /> : null}
                  {day?.falladas ? <View style={[styles.dot, styles.dotFallada]} /> : null}
                  {day?.pendientes ? <View style={[styles.dot, styles.dotPendiente]} /> : null}
                  {day?.eventos ? <View style={[styles.dot, styles.dotEvento]} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function dayLabel(date: string, day?: DaySummary): string {
  const n = Number(date.slice(8, 10));
  if (!day) return `Día ${n}, sin nada anotado`;
  const parts = [
    day.dadas ? `${day.dadas} dadas` : null,
    day.falladas ? `${day.falladas} falladas` : null,
    day.pendientes ? `${day.pendientes} pendientes` : null,
    day.eventos ? `${day.eventos} eventos` : null,
  ].filter(Boolean);
  return `Día ${n}, ${parts.join(', ')}`;
}

const styles = StyleSheet.create({
  week: {
    flexDirection: 'row',
    paddingBottom: Spacing.s,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    paddingVertical: 2,
    alignItems: 'center',
  },
  dayBox: {
    width: 40,
    height: 46,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayBoxSelected: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.ink,
  },
  dayNumberToday: {
    fontFamily: Fonts.extraBold,
    color: Colors.primary,
  },
  dayNumberSelected: {
    color: Colors.white,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotDada: {
    backgroundColor: Colors.success,
  },
  dotFallada: {
    backgroundColor: Colors.danger,
  },
  dotPendiente: {
    backgroundColor: Colors.inkSecondary,
  },
  dotEvento: {
    backgroundColor: Colors.purple,
  },
});
