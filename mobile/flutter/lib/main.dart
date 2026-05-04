import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/api_client.dart';
import 'core/app_theme.dart';
import 'features/auth/login_page.dart';
import 'features/dashboard/dashboard_page.dart';
import 'features/modules/modules_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  runApp(PropertySuiteMobile(preferences: preferences));
}

class PropertySuiteMobile extends StatefulWidget {
  const PropertySuiteMobile({super.key, required this.preferences});

  final SharedPreferences preferences;

  @override
  State<PropertySuiteMobile> createState() => _PropertySuiteMobileState();
}

class _PropertySuiteMobileState extends State<PropertySuiteMobile> {
  late final ApiClient _apiClient;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient(preferences: widget.preferences);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'PropertySuite Mobile',
      theme: buildAppTheme(),
      home: ValueListenableBuilder<String?>(
        valueListenable: _apiClient.tokenNotifier,
        builder: (context, token, _) {
          if (token == null || token.isEmpty) {
            return LoginPage(apiClient: _apiClient);
          }

          return Scaffold(
            body: IndexedStack(
              index: _tabIndex,
              children: [
                DashboardPage(apiClient: _apiClient),
                ModulesPage(apiClient: _apiClient),
              ],
            ),
            bottomNavigationBar: NavigationBar(
              selectedIndex: _tabIndex,
              onDestinationSelected: (index) {
                setState(() {
                  _tabIndex = index;
                });
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: 'Dashboard',
                ),
                NavigationDestination(
                  icon: Icon(Icons.grid_view_outlined),
                  selectedIcon: Icon(Icons.grid_view),
                  label: 'Modules',
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
