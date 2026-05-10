import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import RecordCard from '@/components/RecordCard';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import ModuleFormModal from '@/components/ModuleFormModal';
import { Colors, shadow } from '@/lib/theme';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import { getModuleConfig } from '@/lib/modules';
import type { ModuleConfig, ModuleSummary } from '@/lib/modules';

interface ComputedSummary extends ModuleSummary {
  value: string;
}

function matchesFilter(record: Record<string, unknown>, filter?: Record<string, unknown>): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => record[k] === v);
}

function computeSummaries(records: Record<string, unknown>[], summaries: ModuleSummary[]): ComputedSummary[] {
  return summaries.map(s => {
    if (s.type === 'count') {
      const filtered = records.filter(r => matchesFilter(r, s.filter));
      return { ...s, value: String(filtered.length) };
    }
    if (s.type === 'sum' && s.field) {
      const filtered = records.filter(r => matchesFilter(r, s.filter));
      const total = filtered.reduce((acc, r) => acc + (Number(r[s.field!]) || 0), 0);
      return { ...s, value: `${s.prefix ?? ''}${total.toLocaleString('en-IN')}` };
    }
    if (s.type === 'unique' && s.field) {
      const vals = new Set(records.map(r => r[s.field!]));
      return { ...s, value: String(vals.size) };
    }
    if (s.type === 'computed') {
      const income = records
        .filter(r => r.transaction_type === 'income' || r.entry_type === 'income')
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const expense = records
        .filter(r => r.transaction_type === 'expense' || r.entry_type === 'expense')
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      return { ...s, value: formatCurrency(income - expense) };
    }
    return { ...s, value: '—' };
  });
}

function toneFromSummary(s: ModuleSummary): 'accent' | 'success' | 'warning' | 'default' {
  return (s.tone as 'accent' | 'success' | 'warning') ?? 'default';
}

export default function ModuleScreen() {
  const { module: slug } = useLocalSearchParams<{ module: string }>();
  const config: ModuleConfig | undefined = getModuleConfig(slug);

  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);

  const resource = config?.resource ?? slug;

  const fetchRecords = useCallback(async () => {
    try {
      const res = await apiGet<{ data: Record<string, unknown>[] }>(`/api/v1/${resource}`);
      setRecords(res.data ?? []);
    } catch {
      // keep stale
    }
  }, [resource]);

  useEffect(() => {
    setLoading(true);
    fetchRecords().finally(() => setLoading(false));
  }, [fetchRecords]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }

  if (!config) {
    return (
      <SafeAreaView style={s.safe}>
        <AppHeader title="Not Found" />
        <EmptyState message="Module not found." icon="❓" />
      </SafeAreaView>
    );
  }

  const filtered = search.trim()
    ? records.filter(r => {
        const q = search.toLowerCase();
        return config.columns.some(col => String(r[col.key] ?? '').toLowerCase().includes(q));
      })
    : records;

  const summaries = computeSummaries(records, config.summaries);

  function openAdd() {
    setEditRecord(null);
    setModalVisible(true);
  }

  function openEdit(record: Record<string, unknown>) {
    setEditRecord(record);
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader title={config.title} subtitle={config.badge} />

      {/* Summaries */}
      {summaries.length > 0 && (
        <View style={s.summaries}>
          {summaries.map((sum, i) => (
            <StatCard
              key={i}
              label={sum.label}
              value={sum.value}
              tone={toneFromSummary(sum)}
            />
          ))}
        </View>
      )}

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.muted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${config.title.toLowerCase()}…`}
          placeholderTextColor={Colors.muted}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={s.clearBtn}>
            <Ionicons name="close-circle" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          {search ? ` matching "${search}"` : ''}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <RecordCard
              record={item}
              columns={config.columns}
              onPress={() => openEdit(item)}
            />
          )}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 100, paddingTop: 4 }}
          ListEmptyComponent={<EmptyState message={config.emptyState} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Form Modal */}
      <ModuleFormModal
        visible={modalVisible}
        module={config}
        record={editRecord}
        onClose={() => setModalVisible(false)}
        onSaved={fetchRecords}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  summaries: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 12,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.line,
    paddingHorizontal: 12, paddingVertical: 2,
    ...shadow,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.ink, paddingVertical: 10 },
  clearBtn: { padding: 4 },
  countRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  countText: { fontSize: 12, color: Colors.muted },
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
