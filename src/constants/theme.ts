// Currency Configuration
export const Currency = {
  symbol: '₹',
  code: 'INR',
  locale: 'en-IN',
  format: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
  formatDecimal: (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
};

// Base theme type
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceLighter: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  financial: string;
  financialLight: string;
  health: string;
  healthLight: string;
  mindfulness: string;
  mindfulnessLight: string;
  xp: string;
  xpLight: string;
  streak: string;
  streakLight: string;
  levelUp: string;
  bronze: string;
  silver: string;
  gold: string;
  diamond: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  overlay: string;
  overlayLight: string;
}

// Dark theme colors
export const DarkTheme: ThemeColors = {
  background: '#0A0A0F',
  surface: '#12141A',
  surfaceLight: '#1A1D24',
  surfaceLighter: '#252A33',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  financial: '#10B981',
  financialLight: '#34D399',
  health: '#F97316',
  healthLight: '#FB923C',
  mindfulness: '#06B6D4',
  mindfulnessLight: '#22D3EE',
  xp: '#FBBF24',
  xpLight: '#FCD34D',
  streak: '#F97316',
  streakLight: '#FB923C',
  levelUp: '#3B82F6',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#2E2E3E',
  borderLight: '#3E3E4E',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// Light theme colors
export const LightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceLighter: '#E2E8F0',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  financial: '#059669',
  financialLight: '#10B981',
  health: '#EA580C',
  healthLight: '#F97316',
  mindfulness: '#0891B2',
  mindfulnessLight: '#06B6D4',
  xp: '#D97706',
  xpLight: '#F59E0B',
  streak: '#F97316',
  streakLight: '#FB923C',
  levelUp: '#2563EB',
  bronze: '#CD7F32',
  silver: '#9CA3AF',
  gold: '#EAB308',
  diamond: '#67E8F9',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
};

// Premium — pure black & white, zero chromatic color
export const PremiumDarkTheme: ThemeColors = {
    background: '#000000',
    surface: '#1C1C1C',
    surfaceLight: '#282828',
    surfaceLighter: '#333333',
    primary: '#FFFFFF',
    primaryLight: '#E0E0E0',
    primaryDark: '#B0B0B0',
    financial: '#FFFFFF',
    financialLight: '#E0E0E0',
    health: '#FFFFFF',
    healthLight: '#E0E0E0',
    mindfulness: '#FFFFFF',
    mindfulnessLight: '#E0E0E0',
    xp: '#FFFFFF',
    xpLight: '#E0E0E0',
    streak: '#FFFFFF',
    streakLight: '#E0E0E0',
    levelUp: '#FFFFFF',
    bronze: '#999999',
    silver: '#CCCCCC',
    gold: '#FFFFFF',
    diamond: '#FFFFFF',
    success: '#FFFFFF',
    warning: '#999999',
    error: '#777777',
    info: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#777777',
    border: '#2A2A2A',
    borderLight: '#3A3A3A',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
};

// Premium — pure black & white, zero chromatic color
export const PremiumLightTheme: ThemeColors = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceLight: '#EEEEEE',
    surfaceLighter: '#E0E0E0',
    primary: '#000000',
    primaryLight: '#333333',
    primaryDark: '#666666',
    financial: '#000000',
    financialLight: '#333333',
    health: '#000000',
    healthLight: '#333333',
    mindfulness: '#000000',
    mindfulnessLight: '#333333',
    xp: '#000000',
    xpLight: '#333333',
    streak: '#000000',
    streakLight: '#333333',
    levelUp: '#000000',
    bronze: '#666666',
    silver: '#999999',
    gold: '#000000',
    diamond: '#000000',
    success: '#000000',
    warning: '#666666',
    error: '#999999',
    info: '#000000',
    textPrimary: '#000000',
    textSecondary: '#555555',
    textMuted: '#999999',
    border: '#E0E0E0',
    borderLight: '#D0D0D0',
    overlay: 'rgba(0, 0, 0, 0.4)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
};

// Default export for backward compatibility (will be overridden by ThemeContext)
export const Colors = DarkTheme;

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

// Font sizes - smaller for professional look
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

// Font weights
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows (for iOS, elevation for Android)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: (_color: string) => ({
    elevation: 4,
  }),
};
