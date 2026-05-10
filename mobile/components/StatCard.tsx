import { View, Text, StyleSheet } from 'react-native';
import { Colors, shadow } from '@/lib/theme';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'accent' | 'success' | 'warning' | 'default';
  icon?: string;
}

const toneColors = {
  accent: { bg: Colors.accentLight, text: Colors.accent, dot: Colors.accent },
  success: { bg: Colors.successLight, text: Colors.success, dot: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning, dot: Colors.warning },
  default: { bg: Colors.surface, text: Colors.ink, dot: Colors.muted },
};

export default function StatCard({ label, value, tone = 'default', icon }: StatCardProps) {
  const tc = toneColors[tone];
  return (
    <View style={[s.card, { backgroundColor: tc.bg }]}>
      {icon ? <Text style={s.icon}>{icon}</Text> : null}
      <Text style={[s.value, { color: tc.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 16, padding: 14, minWidth: 140,
    ...shadow,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  icon: { fontSize: 20, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 12, color: Colors.muted, lineHeight: 16 },
});
