import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadow } from './tokens';

// Base component styles
export const buttonStyles = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadow.md,
    } as ViewStyle,
    text: {
      color: colors.textInverse,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.semibold,
    } as TextStyle,
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      ...shadow.md,
    } as ViewStyle,
    text: {
      color: colors.textInverse,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.semibold,
    } as TextStyle,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    } as ViewStyle,
    text: {
      color: colors.primary,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: spacing.base,
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
  },
};

export const inputStyles = {
  default: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    } as ViewStyle,
    text: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
    } as TextStyle,
  },
  error: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    } as ViewStyle,
    text: {
      color: colors.text,
      fontSize: typography.fontSizes.base,
    } as TextStyle,
  },
  focused: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
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
      borderRadius: borderRadius.lg,
      padding: spacing.base,
      ...shadow.sm,
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
      backgroundColor: colors.successLight,
      color: colors.successDark,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
  },
  warning: {
    container: {
      backgroundColor: colors.warningLight,
      color: colors.warningDark,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
  },
  error: {
    container: {
      backgroundColor: colors.errorLight,
      color: colors.errorDark,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fonts.medium,
    } as TextStyle,
  },
  info: {
    container: {
      backgroundColor: colors.infoLight,
      color: colors.infoDark,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fonts.medium,
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
