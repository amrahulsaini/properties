import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final res = await apiGet('/api/v1/dashboard') as Map<String, dynamic>;
      if (mounted) setState(() { _data = res; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _short(num v) {
    if (v >= 10000000) return '₹${(v / 10000000).toStringAsFixed(1)}Cr';
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(0)}K';
    return '₹${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final totals = (_data?['totals'] as Map?)?.cast<String, dynamic>() ?? {};
    final monthly = (_data?['monthly'] as List?)?.cast<Map>() ?? [];
    final bookings = (_data?['recentBookings'] as List?)?.cast<Map>() ?? [];

    return Scaffold(
      backgroundColor: kBg,
      drawer: const AppDrawer(currentRoute: '/home'),
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 20),
            onPressed: () { setState(() => _loading = true); _fetch(); },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kAccent))
          : RefreshIndicator(
              color: kAccent,
              onRefresh: () { setState(() => _loading = true); return _fetch(); },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ── Stats ──────────────────────────────────────────────
                  const _SectionLabel('Overview'),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _StatCard(label: 'Total Sales', value: _short(totals['sales'] ?? 0), icon: LucideIcons.trendingUp, tone: 'accent')),
                    const SizedBox(width: 10),
                    Expanded(child: _StatCard(label: 'Expenses', value: _short(totals['expenses'] ?? 0), icon: LucideIcons.trendingDown, tone: 'warning')),
                  ]),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: _StatCard(label: 'Net Profit', value: _short(totals['profit'] ?? 0), icon: LucideIcons.indianRupee, tone: 'success')),
                    const SizedBox(width: 10),
                    Expanded(child: _StatCard(label: 'Bookings', value: '${totals['bookings'] ?? 0}', icon: LucideIcons.heartHandshake, tone: 'default')),
                  ]),

                  // ── Chart ─────────────────────────────────────────────
                  if (monthly.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    const _SectionLabel('Monthly Sales'),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
                      decoration: kCardDecoration,
                      height: 200,
                      child: _SalesChart(monthly: monthly),
                    ),
                  ],

                  // ── Recent Bookings ───────────────────────────────────
                  if (bookings.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const _SectionLabel('Recent Bookings'),
                        TextButton(
                          onPressed: () => Navigator.pushNamed(context, '/module/advance-bookings'),
                          child: const Text('View all', style: TextStyle(color: kAccent, fontSize: 13, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ...bookings.map((b) => _BookingTile(booking: b)),
                  ],

                  // ── Quick Actions ─────────────────────────────────────
                  const SizedBox(height: 20),
                  const _SectionLabel('Quick Actions'),
                  const SizedBox(height: 10),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 3,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.1,
                    children: const [
                      _QuickItem(label: 'Projects', icon: LucideIcons.building2, route: '/module/projects'),
                      _QuickItem(label: 'Plots', icon: LucideIcons.map, route: '/module/plots'),
                      _QuickItem(label: 'Transactions', icon: LucideIcons.coins, route: '/module/transactions'),
                      _QuickItem(label: 'Agents', icon: LucideIcons.userCheck, route: '/module/agents'),
                      _QuickItem(label: 'Employees', icon: LucideIcons.briefcase, route: '/module/employees'),
                      _QuickItem(label: 'Documents', icon: LucideIcons.folderOpen, route: '/documents'),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) =>
      Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kInk));
}

class _StatCard extends StatelessWidget {
  final String label, value, tone;
  final IconData icon;
  const _StatCard({required this.label, required this.value, required this.icon, required this.tone});

  Color get _bg => tone == 'success' ? kSuccessLight : tone == 'warning' ? kWarningLight : tone == 'accent' ? kAccentLight : const Color(0xFFF5F5F4);
  Color get _fg => tone == 'success' ? kSuccess : tone == 'warning' ? kWarning : tone == 'accent' ? kAccent : kMuted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: kCardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: _bg, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: _fg),
          ),
          const SizedBox(height: 10),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kInk)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: kMuted)),
        ],
      ),
    );
  }
}

class _SalesChart extends StatelessWidget {
  final List<Map> monthly;
  const _SalesChart({required this.monthly});

  @override
  Widget build(BuildContext context) {
    final spots = monthly.asMap().entries.map((e) {
      final v = (e.value['sales'] as num?)?.toDouble() ?? 0;
      return FlSpot(e.key.toDouble(), v);
    }).toList();

    return LineChart(LineChartData(
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        getDrawingHorizontalLine: (_) => const FlLine(color: kLine, strokeWidth: 1),
      ),
      titlesData: FlTitlesData(
        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: 1,
            getTitlesWidget: (v, _) {
              final i = v.toInt();
              if (i < 0 || i >= monthly.length) return const SizedBox();
              final label = (monthly[i]['month'] as String?) ?? '';
              return Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(label.length > 3 ? label.substring(0, 3) : label,
                    style: const TextStyle(fontSize: 10, color: kMuted)),
              );
            },
          ),
        ),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [
        LineChartBarData(
          spots: spots,
          isCurved: true,
          color: kAccent,
          barWidth: 2.5,
          dotData: const FlDotData(show: true),
          belowBarData: BarAreaData(
            show: true,
            color: kAccent.withOpacity(0.08),
          ),
        ),
      ],
    ));
  }
}

class _BookingTile extends StatelessWidget {
  final Map booking;
  const _BookingTile({required this.booking});

  String _cur(dynamic v) {
    final n = (v as num?)?.toDouble() ?? 0;
    if (n >= 100000) return '₹${(n / 100000).toStringAsFixed(1)}L';
    if (n >= 1000) return '₹${(n / 1000).toStringAsFixed(0)}K';
    return '₹${n.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: kCardDecoration,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(booking['customer_name'] ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kInk)),
                if ((booking['village'] ?? '').toString().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(booking['village'], style: const TextStyle(fontSize: 12, color: kMuted)),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(_cur(booking['advance_amount']), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kSuccess)),
              if ((booking['remaining_amount'] as num?)?.toDouble() != null && (booking['remaining_amount'] as num) > 0)
                Text('Rem: ${_cur(booking['remaining_amount'])}', style: const TextStyle(fontSize: 11, color: kWarning)),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickItem extends StatelessWidget {
  final String label, route;
  final IconData icon;
  const _QuickItem({required this.label, required this.icon, required this.route});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, route),
      child: Container(
        decoration: kCardDecoration,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 24, color: kAccent),
            const SizedBox(height: 6),
            Text(label, textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: kInk)),
          ],
        ),
      ),
    );
  }
}
