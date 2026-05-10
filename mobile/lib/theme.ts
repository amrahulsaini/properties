export const Colors = {
  bg: '#fffaf5',
  surface: '#ffffff',
  accent: '#f97316',
  accentLight: '#fff7ed',
  accentDark: '#c2410c',
  ink: '#1c1917',
  muted: '#78716c',
  line: '#e7e5e4',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fee2e2',
};

export function badgeColor(value: string): { bg: string; text: string } {
  const v = (value ?? '').toLowerCase();
  if (['active', 'present', 'paid', 'completed', 'sold', 'income', 'available'].includes(v))
    return { bg: Colors.successLight, text: Colors.success };
  if (['inactive', 'absent', 'expense', 'pending', 'failed'].includes(v))
    return { bg: Colors.errorLight, text: Colors.error };
  if (['partial', 'half', 'in_progress', 'booked', 'planned'].includes(v))
    return { bg: Colors.warningLight, text: Colors.warning };
  return { bg: Colors.accentLight, text: Colors.accent };
}

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07,
  shadowRadius: 4,
  elevation: 2,
};
