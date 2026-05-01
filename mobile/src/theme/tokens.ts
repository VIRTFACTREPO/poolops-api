// Design tokens based on PoolOps Design System §2.2
// Light mode palette only

export const colors = {
  // Primary / ink — near-black. Pool Blue is accent only, see poolBlue.
  primary: '#111827',
  ink: '#111827',
  primaryLight: '#38BDF8',
  primaryDark: '#0284C7',

  // Pool Blue — accent colour for icons, progress, sparklines
  poolBlue: '#0EA5E9',

  // Background colors
  background: '#F5F5F3',
  backgroundLight: '#FFFFFF',
  backgroundDark: '#E5E7EB',

  // Surface colors
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceDark: '#CBD5E1',

  // Text colors
  text: '#111827',
  textLight: '#475569',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  // Border colors
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',

  // Status — success
  success: '#22C55E',
  successLight: '#F0FDF4',
  successDark: '#15803D',
  successBorder: '#BBF7D0',

  // Status — warning
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningDark: '#D97706',
  warningBorder: '#FDE68A',

  // Status — error
  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorDark: '#DC2626',
  errorBorder: '#FECACA',

  // Blue tints — progress bars, info contexts
  blueTint: '#EFF6FF',
  blueText: '#0369A1',
  blueBorder: '#BAE6FD',

  // Placeholder
  placeholder: '#9CA3AF',

  // Role-specific colors
  technician: '#0EA5E9',
  poolOwner: '#8B5CF6', // avatar background only — not for UI components
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  screen: 16,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  standard: 14,
  hero: 18,
  xxxl: 20,
  full: 9999,
};

export const typography = {
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    h1: -0.3,
    h2: -0.2,
    h3: -0.1,
    body: 0,
    small: 0,
    label: 0.5,
  },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
