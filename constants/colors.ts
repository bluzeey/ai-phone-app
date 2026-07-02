export const Colors = {
  primary: '#0A84FF',
  primaryDark: '#0056D3',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  textTertiary: '#A1A1AA',
  border: '#E5E5EA',
  divider: '#C6C6C8',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',
} as const;

export const FolderColors = [
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#5856D6',
  '#007AFF',
  '#34C759',
  '#5AC8FA',
  '#FFCC00',
  '#A2845E',
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
