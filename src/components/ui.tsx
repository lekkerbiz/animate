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
