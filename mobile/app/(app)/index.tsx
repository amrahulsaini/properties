import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import AppHeader from '@/components/AppHeader';
import StatCard from '@/components/StatCard';
import { Colors, shadow } from '@/lib/theme';
import { apiGet } from '@/lib/api';
import { formatCurrency, shortCurrency } from '@/lib/format';
import { useRouter } from 'expo-router';

interface DashboardData {
  totals: { sales: number; expenses: number; profit: number; bookings: number };
  monthly: Array<{ month: string; sales: number; expenses: number; profit: number }>;
  recentBookings: Array<{ id: number; customer_name: string; village: string; advance_amount: number; remaining_amount: number }>;
  reminders: Array<{ title: string; due_date: string }>;
}

const SCREEN_W = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiGet<DashboardData>('/api/v1/dashboard');
      setData(res);
    } catch {
      // keep stale data
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  const monthly = data?.monthly ?? [];
  const chartLabels = monthly.map(m => m.month);
  const chartSales = monthly.map(m => Math.max(0, m.sales));
  const hasChart = chartLabels.length > 0 && chartSales.some(v => v > 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader title="Dashboard" subtitle="Samarth Properties" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <Text style={s.sectionTitle}>Overview</Text>
        <View style={s.statsRow}>
          <StatCard
            label="Total Sales"
            value={shortCurrency(data?.totals.sales ?? 0)}
            tone="accent"
            icon="📈"
          />
          <StatCard
            label="Expenses"
            value={shortCurrency(data?.totals.expenses ?? 0)}
            tone="warning"
            icon="📉"
          />
        </View>
        <View style={[s.statsRow, { marginTop: 10 }]}>
          <StatCard
            label="Net Profit"
            value={shortCurrency(data?.totals.profit ?? 0)}
            tone="success"
            icon="💰"
          />
          <StatCard
            label="Bookings"
            value={String(data?.totals.bookings ?? 0)}
            tone="default"
            icon="🤝"
          />
        </View>

        {/* Chart */}
        {hasChart && (
          <>
            <Text style={s.sectionTitle}>Monthly Sales</Text>
            <View style={s.chartCard}>
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartSales, color: () => Colors.accent, strokeWidth: 2.5 }],
                }}
                width={SCREEN_W - 32}
                height={180}
                chartConfig={{
                  backgroundColor: Colors.surface,
                  backgroundGradientFrom: Colors.surface,
                  backgroundGradientTo: Colors.surface,
                  decimalPlaces: 0,
                  color: () => Colors.accent,
                  labelColor: () => Colors.muted,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.accent },
                  propsForBackgroundLines: { stroke: Colors.line, strokeDasharray: '' },
                  formatYLabel: (v) => shortCurrency(Number(v)).replace('₹', ''),
                }}
                bezier
                style={{ borderRadius: 12, marginHorizontal: -8 }}
                withInnerLines
                withOuterLines={false}
                withShadow={false}
              />
            </View>
          </>
        )}

        {/* Recent Bookings */}
        {(data?.recentBookings?.length ?? 0) > 0 && (
          <>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/advance-bookings' as never)}>
                <Text style={s.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>
            {data!.recentBookings.map(b => (
              <View key={b.id} style={s.bookingCard}>
                <View style={s.bookingLeft}>
                  <Text style={s.bookingName}>{b.customer_name}</Text>
                  {b.village ? <Text style={s.bookingVillage}>{b.village}</Text> : null}
                </View>
                <View style={s.bookingRight}>
                  <Text style={s.bookingAdvance}>{formatCurrency(b.advance_amount)}</Text>
                  {b.remaining_amount > 0 && (
                    <Text style={s.bookingRemaining}>Rem: {formatCurrency(b.remaining_amount)}</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Quick Links */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            { label: 'Projects', path: '/(app)/projects', emoji: '🏗️' },
            { label: 'Plots', path: '/(app)/plots', emoji: '🗺️' },
            { label: 'Transactions', path: '/(app)/transactions', emoji: '💳' },
            { label: 'Agents', path: '/(app)/agents', emoji: '👤' },
            { label: 'Employees', path: '/(app)/employees', emoji: '👥' },
            { label: 'Documents', path: '/(app)/documents', emoji: '📁' },
          ].map(q => (
            <TouchableOpacity
              key={q.path}
              style={s.quickItem}
              onPress={() => router.push(q.path as never)}
              activeOpacity={0.7}
            >
              <Text style={s.quickEmoji}>{q.emoji}</Text>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 10, marginTop: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 6 },
  sectionLink: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 12,
    marginBottom: 16, ...shadow, borderWidth: 1, borderColor: Colors.line,
    overflow: 'hidden',
  },
  bookingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  bookingLeft: { flex: 1 },
  bookingName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  bookingVillage: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end' },
  bookingAdvance: { fontSize: 14, fontWeight: '700', color: Colors.success },
  bookingRemaining: { fontSize: 12, color: Colors.warning, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: {
    width: (SCREEN_W - 32 - 20) / 3,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6,
    ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: Colors.ink, textAlign: 'center' },
});
