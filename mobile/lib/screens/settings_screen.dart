import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/app_drawer.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Map<String, dynamic> _branding = {};
  bool _loading = true, _saving = false;
  final Map<String, TextEditingController> _ctrl = {};

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await apiGet('/api/v1/branding') as Map<String, dynamic>;
      setState(() { _branding = res; });
      _initControllers();
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _initControllers() {
    for (final key in ['company_name', 'tagline', 'phone', 'email', 'address', 'website']) {
      _ctrl[key] = TextEditingController(text: _branding[key]?.toString() ?? '');
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final body = {for (final e in _ctrl.entries) e.key: e.value.text};
      await apiPut('/api/v1/branding', body);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Settings saved.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      drawer: const AppDrawer(currentRoute: '/settings'),
      appBar: AppBar(title: const Text('Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kAccent))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Branding card
                Container(
                  decoration: kCardDecoration,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(children: [
                        Icon(LucideIcons.building2, size: 16, color: kAccent),
                        SizedBox(width: 8),
                        Text('Company Branding', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kInk)),
                      ]),
                      const SizedBox(height: 16),
                      ..._ctrl.entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: TextField(
                          controller: e.value,
                          decoration: InputDecoration(labelText: _label(e.key)),
                        ),
                      )),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _saving ? null : _save,
                          icon: _saving
                              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(LucideIcons.save, size: 16),
                          label: const Text('Save Changes'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // App info
                Container(
                  decoration: kCardDecoration,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _InfoRow(icon: LucideIcons.info, label: 'Version', value: '1.0.0'),
                      const Divider(height: 1, color: kLine),
                      _InfoRow(icon: LucideIcons.globe, label: 'Website', value: 'samarthrealty.properties'),
                      const Divider(height: 1, color: kLine),
                      _InfoRow(icon: LucideIcons.smartphone, label: 'Platform', value: 'Flutter'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Logout
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text('Sign Out'),
                          content: const Text('Are you sure?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sign Out', style: TextStyle(color: kError))),
                          ],
                        ),
                      );
                      if (ok == true) {
                        await logout();
                        if (context.mounted) Navigator.pushReplacementNamed(context, '/login');
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kError,
                      side: const BorderSide(color: kError),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(LucideIcons.logOut, size: 16),
                    label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
    );
  }

  String _label(String key) => switch (key) {
    'company_name' => 'Company Name',
    'tagline' => 'Tagline',
    'phone' => 'Phone',
    'email' => 'Email',
    'address' => 'Address',
    'website' => 'Website',
    _ => key,
  };
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Row(
      children: [
        Icon(icon, size: 16, color: kMuted),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontSize: 14, color: kMuted)),
        const Spacer(),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: kInk)),
      ],
    ),
  );
}
