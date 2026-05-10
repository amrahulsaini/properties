import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/theme';
import { getModuleSections } from '@/lib/modules';
import { logout } from '@/lib/api';

const SECTION_ICONS: Record<string, string> = {
  Finance: '💰',
  Legal: '📜',
  'Buyer Management': '👥',
  Communication: '💬',
  Sites: '🏗️',
  Access: '🔐',
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sections = getModuleSections();

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

  function NavItem({ label, path, emoji }: { label: string; path: string; emoji?: string }) {
    const active = pathname === path || (path !== '/(app)' && pathname.startsWith(path));
    return (
      <TouchableOpacity
        style={[d.item, active && d.itemActive]}
        onPress={() => { props.navigation.closeDrawer(); router.push(path as never); }}
        activeOpacity={0.7}
      >
        {emoji ? <Text style={d.itemEmoji}>{emoji}</Text> : null}
        <Text style={[d.itemText, active && d.itemTextActive]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={d.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={d.header}>
        <View style={d.logoBadge}>
          <Text style={d.logoTxt}>SP</Text>
        </View>
        <View>
          <Text style={d.appName}>Samarth</Text>
          <Text style={d.appSub}>Properties</Text>
        </View>
      </View>

      {/* Dashboard */}
      <NavItem label="Dashboard" path="/(app)" emoji="🏠" />

      {/* Modules by section */}
      {Object.entries(sections).map(([section, mods]) => (
        <View key={section}>
          <View style={d.sectionHead}>
            <Text style={d.sectionEmoji}>{SECTION_ICONS[section] ?? '📁'}</Text>
            <Text style={d.sectionLabel}>{section}</Text>
          </View>
          {mods.map(m => (
            <NavItem
              key={m.slug}
              label={m.title}
              path={`/(app)/${m.slug}` as never}
            />
          ))}
        </View>
      ))}

      {/* Vault */}
      <View style={d.sectionHead}>
        <Text style={d.sectionEmoji}>📁</Text>
        <Text style={d.sectionLabel}>Vault</Text>
      </View>
      <NavItem label="Documents" path="/(app)/documents" emoji="📄" />

      {/* Settings */}
      <View style={d.sectionHead}>
        <Text style={d.sectionEmoji}>⚙️</Text>
        <Text style={d.sectionLabel}>Account</Text>
      </View>
      <NavItem label="Settings" path="/(app)/settings" emoji="⚙️" />

      <TouchableOpacity style={d.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={16} color={Colors.error} />
        <Text style={d.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...(props as DrawerContentComponentProps)} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 285, backgroundColor: Colors.bg },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 50,
      }}
    />
  );
}

const d = StyleSheet.create({
  scroll: { paddingBottom: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
    marginBottom: 8,
  },
  logoBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  logoTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  appName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  appSub: { fontSize: 12, color: Colors.muted },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  sectionEmoji: { fontSize: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: Colors.accentLight },
  itemEmoji: { fontSize: 14, width: 20, textAlign: 'center' },
  itemText: { fontSize: 14, color: Colors.ink, flex: 1 },
  itemTextActive: { color: Colors.accent, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 8, marginTop: 16,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, backgroundColor: Colors.errorLight,
  },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: Colors.error },
});
