import 'package:flutter/material.dart';

import '../../core/api_client.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key, required this.apiClient});

  final ApiClient apiClient;

  Future<Map<String, dynamic>> _load() => apiClient.getJson('/api/v1/dashboard');

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _load(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }

        final payload = snapshot.data ?? {};
        final totals = payload['totals'] as Map<String, dynamic>? ?? {};
        final highlights = payload['highlights'] as Map<String, dynamic>? ?? {};

        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Analytics & Dashboard',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _MetricCard(
                    label: 'Sales',
                    value: '₹${totals['sales'] ?? 0}',
                  ),
                  _MetricCard(
                    label: 'Expenses',
                    value: '₹${totals['expenses'] ?? 0}',
                  ),
                  _MetricCard(
                    label: 'Profit',
                    value: '₹${totals['profit'] ?? 0}',
                  ),
                  _MetricCard(
                    label: 'Bookings',
                    value: '${totals['bookings'] ?? 0}',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Highlights',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 14),
                      Text('Top agent: ${highlights['topAgent'] ?? '-'}'),
                      const SizedBox(height: 8),
                      Text('Top project: ${highlights['topProject'] ?? '-'}'),
                      const SizedBox(height: 8),
                      Text('Top location: ${highlights['topLocation'] ?? '-'}'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 2.2,
                      color: const Color(0xFF5C5246),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
