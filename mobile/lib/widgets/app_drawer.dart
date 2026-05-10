import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/module_config.dart';
import '../services/api.dart';
import '../theme.dart';

const _sectionIcons = <String, IconData>{
  'Finance': LucideIcons.indianRupee,
  'Legal': LucideIcons.fileText,
  'Buyer Management': LucideIcons.users,
  'Communication': LucideIcons.messageSquare,
  'Sites': LucideIcons.hardHat,
  'Access': LucideIcons.shieldCheck,
};

class AppDrawer extends StatelessWidget {
  final String currentRoute;
  const AppDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final sections = getModuleSections();

    return Drawer(
      backgroundColor: kBg,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: kLine)),
              ),
              child: Image.asset('assets/samarth-logo.webp', height: 44, fit: BoxFit.fitHeight, alignment: Alignment.centerLeft),
            ),
            // Nav items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _NavItem(
                    icon: LucideIcons.layoutDashboard,
                    label: 'Dashboard',
                    route: '/home',
                    currentRoute: currentRoute,
                  ),
                  ...sections.entries.map((entry) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SectionHeader(label: entry.key, icon: _sectionIcons[entry.key] ?? LucideIcons.folder),
                      ...entry.value.map((m) => _NavItem(
                        icon: _moduleIcon(m.slug),
                        label: m.title,
                        route: '/module/${m.slug}',
                        currentRoute: currentRoute,
                      )),
                    ],
                  )),
                  _SectionHeader(label: 'Vault', icon: LucideIcons.folderOpen),
                  _NavItem(
                    icon: LucideIcons.files,
                    label: 'Documents',
                    route: '/documents',
                    currentRoute: currentRoute,
                  ),
                  _SectionHeader(label: 'Account', icon: LucideIcons.settings),
                  _NavItem(
                    icon: LucideIcons.settings2,
                    label: 'Settings',
                    route: '/settings',
                    currentRoute: currentRoute,
                  ),
                ],
              ),
            ),
            // Logout
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
              child: ListTile(
                leading: const Icon(LucideIcons.logOut, size: 18, color: kError),
                title: const Text('Sign Out', style: TextStyle(color: kError, fontWeight: FontWeight.w600, fontSize: 14)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                tileColor: kErrorLight,
                onTap: () async {
                  Navigator.pop(context);
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Sign Out', style: TextStyle(color: kError)),
                        ),
                      ],
                    ),
                  );
                  if (ok == true) {
                    await logout();
                    if (context.mounted) Navigator.pushReplacementNamed(context, '/login');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  const _SectionHeader({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: Row(
        children: [
          Icon(icon, size: 12, color: kMuted),
          const SizedBox(width: 6),
          Text(label.toUpperCase(),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: kMuted, letterSpacing: 0.8)),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label, route, currentRoute;
  const _NavItem({required this.icon, required this.label, required this.route, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final active = currentRoute == route || (route != '/home' && currentRoute.startsWith(route));
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
      child: ListTile(
        leading: Icon(icon, size: 18, color: active ? kAccent : kInk),
        title: Text(label,
            style: TextStyle(
              fontSize: 14, fontWeight: active ? FontWeight.w600 : FontWeight.w400,
              color: active ? kAccent : kInk,
            )),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        tileColor: active ? kAccentLight : Colors.transparent,
        onTap: () {
          Navigator.pop(context);
          if (currentRoute != route) Navigator.pushNamed(context, route);
        },
        dense: true,
        visualDensity: const VisualDensity(vertical: -1),
      ),
    );
  }
}

IconData _moduleIcon(String slug) {
  switch (slug) {
    case 'projects': return LucideIcons.building2;
    case 'plots': return LucideIcons.map;
    case 'transactions': return LucideIcons.heartHandshake;
    case 'money-transactions': return LucideIcons.coins;
    case 'advance-bookings': return LucideIcons.fileText;
    case 'advance-agreements': return LucideIcons.fileSignature;
    case 'agents': return LucideIcons.users;
    case 'employees': return LucideIcons.briefcase;
    case 'attendance': return LucideIcons.calendarCheck;
    case 'salary-tracker': return LucideIcons.wallet;
    case 'performance': return LucideIcons.trendingUp;
    case 'communications': return LucideIcons.messagesSquare;
    case 'finance': return LucideIcons.indianRupee;
    case 'construction': return LucideIcons.hammer;
    case 'development-sites': return LucideIcons.shovel;
    case 'documents': return LucideIcons.folderOpen;
    case 'settings': return LucideIcons.settings2;
    case 'users': return LucideIcons.shield;
    default: return LucideIcons.layoutGrid;
  }
}
