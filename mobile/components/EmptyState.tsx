import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/lib/theme';

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = 'No records found.', icon = '📭' }: EmptyStateProps) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.msg}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 12 },
  msg: { fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
});
