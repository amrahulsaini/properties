import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/api.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/module_screen.dart';
import 'screens/documents_screen.dart';
import 'screens/settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  final token = await getToken();
  runApp(SamarthApp(initialRoute: token != null ? '/home' : '/login'));
}

class SamarthApp extends StatelessWidget {
  final String initialRoute;
  const SamarthApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Samarth Properties',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      initialRoute: initialRoute,
      onGenerateRoute: (settings) {
        final name = settings.name ?? '/login';
        if (name == '/login') return MaterialPageRoute(builder: (_) => const LoginScreen());
        if (name == '/home') return MaterialPageRoute(builder: (_) => const DashboardScreen());
        if (name == '/documents') return MaterialPageRoute(builder: (_) => const DocumentsScreen());
        if (name == '/settings') return MaterialPageRoute(builder: (_) => const SettingsScreen());
        if (name.startsWith('/module/')) {
          final slug = name.replaceFirst('/module/', '');
          return MaterialPageRoute(builder: (_) => ModuleScreen(slug: slug));
        }
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      },
    );
  }
}
