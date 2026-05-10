import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '@/lib/api';
import { Colors } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (e: unknown) {
      Alert.alert('Login Failed', e instanceof Error ? e.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logoWrap}>
            <Image
              source={require('@/assets/samarth-logo.webp')}
              style={s.logoImg}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.heading}>Welcome back</Text>
            <Text style={s.sub}>Sign in to your account</Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <View style={s.passRow}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPass}
                  placeholderTextColor={Colors.muted}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Text style={s.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>Samarth Realty · v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoImg: { width: 200, height: 80 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.line,
  },
  heading: { fontSize: 20, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.muted, marginBottom: 24 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.ink, backgroundColor: Colors.bg,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  eyeText: { fontSize: 16 },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnLoading: { opacity: 0.75 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: Colors.muted, fontSize: 12, marginTop: 32 },
});
