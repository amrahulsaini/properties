import 'package:flutter/material.dart';

import '../../core/api_client.dart';

class ModulesPage extends StatelessWidget {
  const ModulesPage({super.key, required this.apiClient});

  final ApiClient apiClient;

  @override
  Widget build(BuildContext context) {
    final modules = [
      'User Management',
      'Plots',
      'Transactions',
      'Advance Bookings',
      'Advance Agreements',
      'Agents',
      'Employees',
      'Finance & GST',
      'Construction',
      'Development Sites',
      'Documents',
      'Settings',
    ];

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Modules',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
              IconButton(
                onPressed: apiClient.logout,
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...modules.map(
            (module) => Card(
              child: ListTile(
                title: Text(module),
                subtitle: const Text('Shared v1 API ready'),
                trailing: const Icon(Icons.chevron_right),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Text(
                'Build this app with: flutter run --dart-define=API_BASE_URL=http://your-server:3000',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
