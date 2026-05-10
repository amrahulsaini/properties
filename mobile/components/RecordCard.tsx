import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, badgeColor, shadow } from '@/lib/theme';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import type { ModuleColumn } from '@/lib/modules';

interface RecordCardProps {
  record: Record<string, unknown>;
  columns: ModuleColumn[];
  onPress: () => void;
}

function renderValue(value: unknown, type?: ModuleColumn['type']): { text: string; badge: boolean } {
  if (value === null || value === undefined || value === '') return { text: '—', badge: false };
  if (type === 'currency') return { text: formatCurrency(value), badge: false };
  if (type === 'number') return { text: formatNumber(value), badge: false };
  if (type === 'date') return { text: formatDate(value), badge: false };
  if (type === 'boolean') return { text: value ? 'Yes' : 'No', badge: false };
  if (type === 'badge') return { text: String(value), badge: true };
  return { text: String(value), badge: false };
}

export default function RecordCard({ record, columns, onPress }: RecordCardProps) {
  const primaryCol = columns[0];
  const secondaryCol = columns[1];
  const badgeCols = columns.filter(c => c.type === 'badge');
  const valueCols = columns.filter(c => c.type === 'currency' || c.type === 'number').slice(0, 2);

  const primary = primaryCol ? renderValue(record[primaryCol.key], primaryCol.type) : null;
  const secondary = secondaryCol ? renderValue(record[secondaryCol.key], secondaryCol.type) : null;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.top}>
        <Text style={s.primary} numberOfLines={1}>
          {primary?.text ?? '—'}
        </Text>
        <View style={s.badges}>
          {badgeCols.slice(0, 1).map(col => {
            const val = record[col.key];
            if (!val) return null;
            const bc = badgeColor(String(val));
            return (
              <View key={col.key} style={[s.badge, { backgroundColor: bc.bg }]}>
                <Text style={[s.badgeText, { color: bc.text }]}>{String(val)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {secondary && secondary.text !== '—' && (
        <Text style={s.secondary} numberOfLines={1}>{secondary.text}</Text>
      )}

      {valueCols.length > 0 && (
        <View style={s.values}>
          {valueCols.map(col => {
            const rv = renderValue(record[col.key], col.type);
            if (rv.text === '—') return null;
            return (
              <View key={col.key} style={s.valueItem}>
                <Text style={s.valueLabel}>{col.label}</Text>
                <Text style={s.valueText}>{rv.text}</Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginBottom: 10,
    ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  primary: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.ink },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  secondary: { fontSize: 13, color: Colors.muted, marginBottom: 8 },
  values: { flexDirection: 'row', gap: 16, marginTop: 4 },
  valueItem: {},
  valueLabel: { fontSize: 11, color: Colors.muted },
  valueText: { fontSize: 13, fontWeight: '600', color: Colors.ink },
});
