import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/module_config.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/app_drawer.dart';

class ModuleScreen extends StatefulWidget {
  final String slug;
  const ModuleScreen({super.key, required this.slug});
  @override
  State<ModuleScreen> createState() => _ModuleScreenState();
}

class _ModuleScreenState extends State<ModuleScreen> {
  ModuleConfig? _config;
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _config = getModuleConfig(widget.slug);
    _fetch();
  }

  Future<void> _fetch() async {
    if (_config == null) return;
    setState(() => _loading = true);
    try {
      final res = await apiGet('/api/v1/${_config!.resource}');
      final list = res is List ? res : (res as Map)['data'] ?? [];
      setState(() { _records = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(); });
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _records;
    final q = _search.toLowerCase();
    return _records.where((r) => r.values.any((v) => v?.toString().toLowerCase().contains(q) == true)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final cfg = _config;
    if (cfg == null) return const Scaffold(body: Center(child: Text('Module not found')));

    return Scaffold(
      backgroundColor: kBg,
      drawer: AppDrawer(currentRoute: '/module/${widget.slug}'),
      appBar: AppBar(title: Text(cfg.title)),
      body: Column(
        children: [
          // Summaries
          if (cfg.summaries.isNotEmpty) _SummaryBar(config: cfg, records: _records),
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search ${cfg.title.toLowerCase()}...',
                prefixIcon: const Icon(LucideIcons.search, size: 18, color: kMuted),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(icon: const Icon(LucideIcons.x, size: 16), onPressed: () => setState(() => _search = ''))
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
          ),
          // List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: kAccent))
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(LucideIcons.inbox, size: 48, color: kLine),
                            const SizedBox(height: 12),
                            Text(cfg.emptyState, style: const TextStyle(color: kMuted, fontSize: 14)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: kAccent,
                        onRefresh: _fetch,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: _filtered.length,
                          itemBuilder: (_, i) => _RecordTile(
                            record: _filtered[i],
                            config: cfg,
                            onTap: () => _showForm(record: _filtered[i]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(),
        backgroundColor: kAccent,
        foregroundColor: Colors.white,
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text('Add', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showForm({Map<String, dynamic>? record}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FormSheet(
        config: _config!,
        record: record,
        onSaved: _fetch,
      ),
    );
  }
}

// ── Summary bar ───────────────────────────────────────────────────────────────
class _SummaryBar extends StatelessWidget {
  final ModuleConfig config;
  final List<Map<String, dynamic>> records;
  const _SummaryBar({required this.config, required this.records});

  String _compute(ModuleSummary s) {
    if (s.type == 'count') return '${records.length}';
    final filtered = s.filter == null
        ? records
        : records.where((r) => s.filter!.entries.every((e) => r[e.key]?.toString() == e.value?.toString())).toList();
    if (s.type == 'sum') {
      final total = filtered.fold<double>(0, (acc, r) => acc + ((r[s.field] as num?)?.toDouble() ?? 0));
      if (total >= 10000000) return '${s.prefix ?? ''}${(total / 10000000).toStringAsFixed(1)}Cr';
      if (total >= 100000) return '${s.prefix ?? ''}${(total / 100000).toStringAsFixed(1)}L';
      return '${s.prefix ?? ''}${total.toStringAsFixed(0)}';
    }
    if (s.type == 'computed') {
      final income = records.where((r) => r['transaction_type'] == 'income' || r['entry_type'] == 'income')
          .fold<double>(0, (a, r) => a + ((r['amount'] as num?)?.toDouble() ?? 0));
      final expense = records.where((r) => r['transaction_type'] == 'expense' || r['entry_type'] == 'expense')
          .fold<double>(0, (a, r) => a + ((r['amount'] as num?)?.toDouble() ?? 0));
      final bal = income - expense;
      return '₹${bal.abs().toStringAsFixed(0)}${bal < 0 ? ' (-)' : ''}';
    }
    return '-';
  }

  Color _bg(String tone) => tone == 'success' ? kSuccessLight : tone == 'warning' ? kWarningLight : kAccentLight;
  Color _fg(String tone) => tone == 'success' ? kSuccess : tone == 'warning' ? kWarning : kAccent;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: kSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: config.summaries.map((s) => Container(
            margin: const EdgeInsets.only(right: 10),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _bg(s.tone),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_compute(s), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _fg(s.tone))),
                Text(s.label, style: TextStyle(fontSize: 10, color: _fg(s.tone).withOpacity(0.8))),
              ],
            ),
          )).toList(),
        ),
      ),
    );
  }
}

// ── Record tile ───────────────────────────────────────────────────────────────
class _RecordTile extends StatelessWidget {
  final Map<String, dynamic> record;
  final ModuleConfig config;
  final VoidCallback onTap;
  const _RecordTile({required this.record, required this.config, required this.onTap});

  String _format(dynamic v, String? type) {
    if (v == null || v.toString().isEmpty) return '—';
    if (type == 'currency') {
      final n = (v as num).toDouble();
      if (n >= 100000) return '₹${(n / 100000).toStringAsFixed(1)}L';
      return '₹${n.toStringAsFixed(0)}';
    }
    if (type == 'date') {
      try { return DateFormat('dd MMM yy').format(DateTime.parse(v.toString())); }
      catch (_) { return v.toString(); }
    }
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final primary = config.columns.isNotEmpty ? record[config.columns[0].key] : null;
    final secondary = config.columns.length > 1 ? record[config.columns[1].key] : null;
    final secondaryType = config.columns.length > 1 ? config.columns[1].type : null;
    final badge = config.columns.firstWhere((c) => c.type == 'badge', orElse: () => const ModuleColumn(key: '', label: '')).key;
    final badgeVal = badge.isNotEmpty ? record[badge]?.toString() : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: kCardDecoration,
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(primary?.toString() ?? '—',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kInk),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (secondary != null) ...[
                    const SizedBox(height: 3),
                    Text(_format(secondary, secondaryType),
                        style: const TextStyle(fontSize: 12, color: kMuted)),
                  ],
                ],
              ),
            ),
            if (badgeVal != null && badgeVal.isNotEmpty) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeBg(badgeVal),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(badgeVal, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: badgeFg(badgeVal))),
              ),
            ] else ...[
              const Icon(LucideIcons.chevronRight, size: 16, color: kMuted),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Form bottom sheet ─────────────────────────────────────────────────────────
class _FormSheet extends StatefulWidget {
  final ModuleConfig config;
  final Map<String, dynamic>? record;
  final VoidCallback onSaved;
  const _FormSheet({required this.config, this.record, required this.onSaved});
  @override
  State<_FormSheet> createState() => _FormSheetState();
}

class _FormSheetState extends State<_FormSheet> {
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, dynamic> _values = {};
  List<Map<String, dynamic>> _projects = [];
  bool _saving = false;

  bool get _isEdit => widget.record != null;

  @override
  void initState() {
    super.initState();
    for (final f in widget.config.fields) {
      _values[f.key] = widget.record?[f.key];
      if (f.type == 'text' || f.type == 'number' || f.type == 'textarea' || f.type == 'date') {
        _controllers[f.key] = TextEditingController(text: widget.record?[f.key]?.toString() ?? '');
      }
    }
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    if (!widget.config.fields.any((f) => f.type == 'project_select')) return;
    try {
      final res = await apiGet('/api/v1/projects');
      final list = res is List ? res : (res as Map)['data'] ?? [];
      setState(() { _projects = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(); });
    } catch (_) {}
  }

  Future<void> _save() async {
    for (final f in widget.config.fields) {
      if (f.required && (_values[f.key] == null || _values[f.key].toString().isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${f.label} is required.')));
        return;
      }
    }
    setState(() => _saving = true);
    try {
      final body = Map<String, dynamic>.from(_values);
      for (final c in _controllers.entries) {
        body[c.key] = c.value.text.isEmpty ? null : c.value.text;
      }
      if (_isEdit) {
        await apiPut('/api/v1/${widget.config.resource}/${widget.record!['id']}', body);
      } else {
        await apiPost('/api/v1/${widget.config.resource}', body);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Record'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: kError))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await apiDelete('/api/v1/${widget.config.resource}/${widget.record!['id']}');
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.97,
      minChildSize: 0.5,
      builder: (_, scroll) => Container(
        decoration: const BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle + header
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: kLine, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
              child: Row(
                children: [
                  Expanded(child: Text(
                    _isEdit ? 'Edit ${widget.config.title}' : 'Add ${widget.config.title}',
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: kInk),
                  )),
                  if (_isEdit) IconButton(
                    icon: const Icon(LucideIcons.trash2, size: 18, color: kError),
                    onPressed: _delete,
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 20, color: kMuted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: kLine),
            // Fields
            Expanded(
              child: ListView(
                controller: scroll,
                padding: const EdgeInsets.all(20),
                children: [
                  ...widget.config.fields.map((f) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _buildField(f),
                  )),
                  // Save button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(_isEdit ? 'Save Changes' : 'Add ${widget.config.title}'),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(ModuleField f) {
    Widget field;
    switch (f.type) {
      case 'select':
        field = DropdownButtonFormField<String>(
          value: _values[f.key]?.toString(),
          items: (f.options ?? []).map((o) => DropdownMenuItem(value: o.value, child: Text(o.label))).toList(),
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(labelText: f.label),
        );
        break;
      case 'project_select':
        field = DropdownButtonFormField<String>(
          value: _values[f.key]?.toString(),
          items: _projects.map((p) => DropdownMenuItem(
            value: p['id']?.toString(),
            child: Text('${p['code'] ?? ''} – ${p['name'] ?? ''}'),
          )).toList(),
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(labelText: f.label),
        );
        break;
      case 'checkbox':
        field = Row(
          children: [
            Switch(
              value: _values[f.key] == true || _values[f.key] == 'true' || _values[f.key] == 1,
              onChanged: (v) => setState(() => _values[f.key] = v),
              activeColor: kAccent,
            ),
            const SizedBox(width: 8),
            Text(f.label, style: const TextStyle(fontSize: 14, color: kInk)),
          ],
        );
        return field;
      case 'date':
        field = TextField(
          controller: _controllers[f.key],
          readOnly: true,
          decoration: InputDecoration(
            labelText: f.label,
            suffixIcon: const Icon(LucideIcons.calendar, size: 18, color: kMuted),
          ),
          onTap: () async {
            final d = await showDatePicker(
              context: context,
              initialDate: DateTime.tryParse(_controllers[f.key]!.text) ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: kAccent)),
                child: child!,
              ),
            );
            if (d != null) {
              _controllers[f.key]!.text = DateFormat('yyyy-MM-dd').format(d);
              _values[f.key] = _controllers[f.key]!.text;
            }
          },
        );
        break;
      case 'textarea':
        field = TextField(
          controller: _controllers[f.key],
          maxLines: 3,
          onChanged: (v) => _values[f.key] = v,
          decoration: InputDecoration(labelText: f.label, hintText: f.placeholder, alignLabelWithHint: true),
        );
        break;
      default:
        field = TextField(
          controller: _controllers[f.key],
          keyboardType: f.type == 'number' ? TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
          onChanged: (v) => _values[f.key] = v,
          decoration: InputDecoration(labelText: f.label, hintText: f.placeholder),
        );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (f.type != 'checkbox' && f.type != 'select' && f.type != 'project_select' && f.type != 'date' && f.type != 'textarea') ...[
          Row(children: [
            Text(f.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kInk)),
            if (f.required) const Text(' *', style: TextStyle(color: kError, fontSize: 13)),
          ]),
          const SizedBox(height: 6),
        ],
        field,
      ],
    );
  }
}
