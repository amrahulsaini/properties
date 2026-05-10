import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { Colors, shadow } from '@/lib/theme';
import { apiGet, apiPost, logout } from '@/lib/api';
import { useRouter } from 'expo-router';

interface Branding {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tagline?: string;
  website?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [branding, setBranding] = useState<Branding>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Branding>('/api/v1/branding')
      .then(data => setBranding(data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      await apiPost('/api/v1/branding', branding);
      Alert.alert('Saved', 'Branding updated successfully.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  function BrandingField({ label, fieldKey, placeholder, multiline }: {
    label: string; fieldKey: keyof Branding; placeholder?: string; multiline?: boolean;
  }) {
    return (
      <View style={st.field}>
        <Text style={st.label}>{label}</Text>
        <TextInput
          style={[st.input, multiline && st.textarea]}
          value={branding[fieldKey] ?? ''}
          onChangeText={v => setBranding(prev => ({ ...prev, [fieldKey]: v }))}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.muted}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <AppHeader title="Settings" subtitle="Branding & account" />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        {/* Branding */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Company Branding</Text>
          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <BrandingField label="Company Name" fieldKey="company_name" placeholder="Samarth Realty" />
              <BrandingField label="Tagline" fieldKey="tagline" placeholder="Your trusted real estate partner" />
              <BrandingField label="Address" fieldKey="address" multiline />
              <BrandingField label="Phone" fieldKey="phone" placeholder="+91 XXXXX XXXXX" />
              <BrandingField label="Email" fieldKey="email" placeholder="info@company.com" />
              <BrandingField label="Website" fieldKey="website" placeholder="https://company.com" />
              <TouchableOpacity
                style={[st.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={st.saveTxt}>Save Changes</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Info */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>App Information</Text>
          {[
            { label: 'App Name', value: 'Samarth Properties' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Platform', value: 'Android' },
            { label: 'Backend', value: 'samarthrealty.properties' },
          ].map(item => (
            <View key={item.label} style={st.infoRow}>
              <Text style={st.infoLabel}>{item.label}</Text>
              <Text style={st.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>Account</Text>
          <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={st.logoutTxt}>🚪  Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 16, ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.ink, backgroundColor: Colors.bg,
  },
  textarea: { height: 80 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 4,
  },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  infoLabel: { fontSize: 14, color: Colors.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  logoutBtn: {
    backgroundColor: Colors.errorLight, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.error,
  },
  logoutTxt: { fontSize: 14, fontWeight: '700', color: Colors.error },
});
