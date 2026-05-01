import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadow } from './tokens';

// Base component styles
export const buttonStyles = {
  primary: {
    container: {
      backgroundColor: '#111827',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadow.md,
    } as ViewStyle,
    text: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
  secondary: {
    container: {
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    } as ViewStyle,
    text: {
      color: '#111827',
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    } as ViewStyle,
    text: {
      color: colors.primary,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    } as ViewStyle,
    text: {
      color: colors.primary,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
  destructive: {
    container: {
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    } as ViewStyle,
    text: {
      color: '#EF4444',
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
  complete: {
    container: {
      backgroundColor: '#22C55E',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadow.md,
    } as ViewStyle,
    text: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    } as TextStyle,
    disabled: {
      opacity: 0.45,
    } as ViewStyle,
  },
};

export const inputStyles = {
  default: {
    container: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: borderRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    } as ViewStyle,
    text: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
    } as TextStyle,
  },
  error: {
    container: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: borderRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    } as ViewStyle,
    text: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
    } as TextStyle,
  },
  focused: {
    container: {
      backgroundColor: '#F9FAFB',
      borderWidth: 2,
      borderColor: '#111827',
      borderRadius: borderRadius.md,
      paddingHorizontal: 13,
      paddingVertical: 11,
    } as ViewStyle,
    text: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
    } as TextStyle,
  },
};

export const cardStyles = {
  default: {
    container: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.07)',
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    } as ViewStyle,
    title: {
      color: colors.text,
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fonts.semibold,
      marginBottom: spacing.xs,
    } as TextStyle,
    body: {
      color: colors.textLight,
      fontSize: typography.fontSizes.base,
      lineHeight: typography.lineHeight.relaxed,
    } as TextStyle,
  },
  hero: {
    container: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.07)',
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 5,
    } as ViewStyle,
    title: {
      color: colors.text,
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fonts.semibold,
      marginBottom: spacing.xs,
    } as TextStyle,
    body: {
      color: colors.textLight,
      fontSize: typography.fontSizes.base,
      lineHeight: typography.lineHeight.relaxed,
    } as TextStyle,
  },
};

export const badgeStyles = {
  success: {
    container: {
      backgroundColor: '#F0FDF4',
      color: '#16A34A',
      borderWidth: 1,
      borderColor: '#BBF7D0',
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 9,
      fontSize: 11,
      fontWeight: '500',
    } as TextStyle,
  },
  warning: {
    container: {
      backgroundColor: '#FFFBEB',
      color: '#D97706',
      borderWidth: 1,
      borderColor: '#FDE68A',
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 9,
      fontSize: 11,
      fontWeight: '500',
    } as TextStyle,
  },
  error: {
    container: {
      backgroundColor: '#FEF2F2',
      color: '#DC2626',
      borderWidth: 1,
      borderColor: '#FECACA',
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 9,
      fontSize: 11,
      fontWeight: '500',
    } as TextStyle,
  },
  neutral: {
    container: {
      backgroundColor: '#F9FAFB',
      color: '#6B7280',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 9,
      fontSize: 11,
      fontWeight: '500',
    } as TextStyle,
  },
  blue: {
    container: {
      backgroundColor: '#EFF6FF',
      color: '#0369A1',
      borderWidth: 1,
      borderColor: '#BAE6FD',
      borderRadius: 20,
      paddingVertical: 3,
      paddingHorizontal: 9,
      fontSize: 11,
      fontWeight: '500',
    } as TextStyle,
  },
};

export const screenStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
};

export const loaderStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  } as ViewStyle,
  spinner: {
    color: colors.primary,
  } as ImageStyle,
};
