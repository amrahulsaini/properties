import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

export default function AppHeader({ title, subtitle, rightAction }: AppHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={s.header}>
      <TouchableOpacity
        style={s.menuBtn}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={22} color={Colors.ink} />
      </TouchableOpacity>

      <View style={s.titleWrap}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      {rightAction ? (
        <TouchableOpacity style={s.menuBtn} onPress={rightAction.onPress} activeOpacity={0.7}>
          <Ionicons name={rightAction.icon} size={22} color={Colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={s.menuBtn} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.line,
  },
  titleWrap: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  subtitle: { fontSize: 12, color: Colors.muted, marginTop: 1 },
});
