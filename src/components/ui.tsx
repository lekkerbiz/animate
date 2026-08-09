import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'glass' | 'glassOutline' | 'outline';
  style?: ViewStyle;
};

export function Button({ label, loading, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const variantStyle = {
    primary: styles.btnPrimary,
    glass: styles.btnGlass,
    glassOutline: styles.btnGlassOutline,
    outline: styles.btnOutline,
  }[variant];
  const labelStyle: TextStyle =
    variant === 'primary' || variant === 'glass' || variant === 'glassOutline'
      ? styles.btnLabelLight
      : styles.btnLabelPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        pressed && styles.btnPressed,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelStyle.color as string} />
      ) : (
        <Text style={[styles.btnLabel, labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
};

export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.inkSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type ChipOption<T extends string> = {
  key: T;
  label: string;
  emoji?: string;
};

type ChipGroupProps<T extends string> = {
  label?: string;
  options: readonly ChipOption<T>[];
  // string, no T: el valor guardado puede no estar entre las opciones
  // (p. ej. una especie antigua), y entonces no se marca ninguna.
  value: string | null;
  onChange: (key: T) => void;
};

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = option.key === value;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.btnPressed,
              ]}
            >
              {option.emoji ? <Text style={styles.chipEmoji}>{option.emoji}</Text> : null}
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 53,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnGlass: {
    backgroundColor: Colors.glass,
  },
  btnGlassOutline: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 17.5,
    lineHeight: 23,
  },
  btnLabelLight: {
    color: Colors.white,
  },
  btnLabelPrimary: {
    color: Colors.primary,
  },
  fieldWrap: {
    gap: Spacing.s,
  },
  fieldLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  input: {
    minHeight: 53,
    borderRadius: Radius.m,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.m,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.ink,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldError: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.danger,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.m,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.pinkSoft,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  chipLabelActive: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 17,
    lineHeight: 25,
    color: Colors.inkSecondary,
  },
});
