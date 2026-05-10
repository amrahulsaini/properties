import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:open_file/open_file.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/module_config.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/app_drawer.dart';

// ── showWhen helpers ──────────────────────────────────────────────────────────
bool _matchesCond(Map<String, dynamic> cond, Map<String, dynamic> values) {
  return cond.entries.every((e) {
    final v = values[e.key]?.toString();
    if (e.value is List) return (e.value as List).any((o) => o.toString() == v);
    return v == e.value.toString();
  });
}

bool shouldShowField(ModuleField f, Map<String, dynamic> values) {
  final sw = f.showWhen;
  if (sw == null) return true;
  if (sw is Map) return _matchesCond(Map<String, dynamic>.from(sw), values);
  if (sw is List) {
    return sw.any((c) => _matchesCond(Map<String, dynamic>.from(c as Map), values));
  }
  return true;
}

// ── Module screen ─────────────────────────────────────────────────────────────
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
      setState(() {
        _records = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _records;
    final q = _search.toLowerCase();
    return _records.where((r) => r.values.any((v) => v?.toString().toLowerCase().contains(q) == true)).toList();
  }

  void _openExportUrl(String suffix) async {
    final cfg = _config;
    if (cfg == null) return;
    final url = Uri.parse('https://samarthrealty.properties/api/v1/reports/$suffix?resource=${cfg.resource}');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final cfg = _config;
    if (cfg == null) return const Scaffold(body: Center(child: Text('Module not found')));

    return Scaffold(
      backgroundColor: kBg,
      drawer: AppDrawer(currentRoute: '/module/${widget.slug}'),
      appBar: AppBar(
        title: Text(cfg.title),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(LucideIcons.download, size: 18),
            onSelected: _openExportUrl,
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'export', child: Row(children: [
                Icon(LucideIcons.fileSpreadsheet, size: 16), SizedBox(width: 8), Text('Export Excel'),
              ])),
              PopupMenuItem(value: 'export-pdf', child: Row(children: [
                Icon(LucideIcons.fileText, size: 16), SizedBox(width: 8), Text('Export PDF'),
              ])),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          if (cfg.summaries.isNotEmpty) _SummaryBar(config: cfg, records: _records),
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
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: kAccent))
                : _filtered.isEmpty
                    ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(LucideIcons.inbox, size: 48, color: kLine),
                        const SizedBox(height: 12),
                        Text(cfg.emptyState, style: const TextStyle(color: kMuted, fontSize: 14),
                            textAlign: TextAlign.center),
                      ]))
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
      builder: (_) => _FormSheet(config: _config!, record: record, onSaved: _fetch),
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
      if (bal.abs() >= 100000) return '₹${(bal.abs() / 100000).toStringAsFixed(1)}L${bal < 0 ? ' (-)' : ''}';
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
            decoration: BoxDecoration(color: _bg(s.tone), borderRadius: BorderRadius.circular(10)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text(_compute(s), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _fg(s.tone))),
              Text(s.label, style: TextStyle(fontSize: 10, color: _fg(s.tone).withValues(alpha: 0.8))),
            ]),
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

  String _fmt(dynamic v, String? type) {
    if (v == null || v.toString().isEmpty) return '—';
    if (type == 'currency') {
      final n = (v as num).toDouble();
      if (n >= 10000000) return '₹${(n / 10000000).toStringAsFixed(1)}Cr';
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
    final badgeCol = config.columns.firstWhere((c) => c.type == 'badge', orElse: () => const ModuleColumn(key: '', label: ''));
    final badgeVal = badgeCol.key.isNotEmpty ? record[badgeCol.key]?.toString() : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: kCardDecoration,
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(primary?.toString() ?? '—',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kInk),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            if (secondary != null) ...[
              const SizedBox(height: 3),
              Text(_fmt(secondary, secondaryType),
                  style: const TextStyle(fontSize: 12, color: kMuted)),
            ],
          ])),
          if (badgeVal != null && badgeVal.isNotEmpty) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: badgeBg(badgeVal), borderRadius: BorderRadius.circular(6)),
              child: Text(badgeVal, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: badgeFg(badgeVal))),
            ),
          ] else ...[
            const Icon(LucideIcons.chevronRight, size: 16, color: kMuted),
          ],
        ]),
      ),
    );
  }
}

// ── Form sheet ────────────────────────────────────────────────────────────────
class _FormSheet extends StatefulWidget {
  final ModuleConfig config;
  final Map<String, dynamic>? record;
  final VoidCallback onSaved;
  const _FormSheet({required this.config, this.record, required this.onSaved});
  @override
  State<_FormSheet> createState() => _FormSheetState();
}

class _FormSheetState extends State<_FormSheet> {
  final Map<String, TextEditingController> _ctrl = {};
  final Map<String, dynamic> _values = {};
  List<Map<String, dynamic>> _projects = [];
  bool _saving = false;
  bool _pdfLoading = false;

  bool get _isEdit => widget.record != null;

  List<ModuleField> get _visibleFields =>
      widget.config.fields.where((f) => shouldShowField(f, _values)).toList();

  @override
  void initState() {
    super.initState();
    for (final f in widget.config.fields) {
      _values[f.key] = widget.record?[f.key];
      if (['text', 'number', 'textarea', 'date', 'datetime-local', 'time',
           'tel', 'email', 'password'].contains(f.type)) {
        _ctrl[f.key] = TextEditingController(text: widget.record?[f.key]?.toString() ?? '');
      }
    }
    _loadProjects();
  }

  @override
  void dispose() {
    for (final c in _ctrl.values) c.dispose();
    super.dispose();
  }

  Future<void> _loadProjects() async {
    if (!widget.config.fields.any((f) => f.type == 'project_select')) return;
    try {
      final res = await apiGet('/api/v1/projects');
      final list = res is List ? res : (res as Map)['data'] ?? [];
      setState(() {
        _projects = (list as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {}
  }

  Future<void> _save() async {
    for (final f in _visibleFields) {
      if (f.required && (_values[f.key] == null || _values[f.key].toString().isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${f.label} is required.')));
        return;
      }
    }
    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{};
      for (final f in widget.config.fields) {
        if (_ctrl.containsKey(f.key)) {
          body[f.key] = _ctrl[f.key]!.text.isEmpty ? null : _ctrl[f.key]!.text;
        } else {
          body[f.key] = _values[f.key];
        }
      }
      if (_isEdit) {
        await apiPut('/api/v1/${widget.config.resource}/${widget.record!['id']}', body);
      } else {
        await apiPost('/api/v1/${widget.config.resource}', body);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
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
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: kError))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await apiDelete('/api/v1/${widget.config.resource}/${widget.record!['id']}');
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
  }

  Future<void> _printPdf() async {
    final route = widget.config.pdfRoute;
    final id = widget.record?['id'];
    if (route == null || id == null) return;
    setState(() => _pdfLoading = true);
    try {
      final path = await downloadPdf('/api/v1/$route/$id/pdf');
      await OpenFile.open(path);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
    if (mounted) setState(() => _pdfLoading = false);
  }

  Future<void> _shareWhatsApp() async {
    final route = widget.config.pdfRoute;
    final id = widget.record?['id'];
    if (route == null || id == null) return;
    final pdfUrl = 'https://samarthrealty.properties/api/v1/$route/$id/pdf';
    final titles = {
      'advance-bookings': 'Advance Booking Memo',
      'advance-agreements': 'Advance Agreement Memo',
      'development-entries': 'Development Work Slip',
    };
    final title = titles[route] ?? 'Document';
    final phoneField = {
      'advance-bookings': 'customer_phone',
      'advance-agreements': 'owner_phone',
      'development-entries': 'mobile_number',
    }[route];
    String rawPhone = '';
    if (phoneField != null && widget.record != null) {
      rawPhone = widget.record![phoneField]?.toString() ?? '';
    }
    final phone = rawPhone.replaceAll(RegExp(r'\D'), '');
    final msg = Uri.encodeComponent('Your $title PDF:\n$pdfUrl');
    final waUrl = phone.isNotEmpty
        ? Uri.parse('https://wa.me/$phone?text=$msg')
        : Uri.parse('https://wa.me/?text=$msg');
    if (await canLaunchUrl(waUrl)) await launchUrl(waUrl, mode: LaunchMode.externalApplication);
  }

  Future<void> _pickImage(String key) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked == null) return;
    try {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading image...')));
      final url = await uploadFile(picked.path, picked.mimeType ?? 'image/jpeg', picked.name);
      setState(() => _values[key] = url);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Image uploaded.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
  }

  Future<void> _captureGps(String key) async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permission denied.')));
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      final val = '${pos.latitude.toStringAsFixed(6)}, ${pos.longitude.toStringAsFixed(6)}';
      setState(() {
        _values[key] = val;
        _ctrl[key] ??= TextEditingController();
        _ctrl[key]!.text = val;
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.97,
      minChildSize: 0.5,
      builder: (_, scroll) => Container(
        decoration: const BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: kLine, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 8, 0),
            child: Row(children: [
              Expanded(child: Text(
                _isEdit ? 'Edit ${widget.config.title}' : 'Add ${widget.config.title}',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: kInk),
              )),
              if (_isEdit && widget.config.pdfRoute != null) ...[
                _pdfLoading
                    ? const Padding(padding: EdgeInsets.all(12),
                        child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: kAccent, strokeWidth: 2)))
                    : IconButton(
                        icon: const Icon(LucideIcons.fileDown, size: 18, color: kAccent),
                        tooltip: 'Download PDF',
                        onPressed: _printPdf,
                      ),
                IconButton(
                  icon: const Icon(LucideIcons.messageCircle, size: 18, color: Color(0xFF25D366)),
                  tooltip: 'Send on WhatsApp',
                  onPressed: _shareWhatsApp,
                ),
              ],
              if (_isEdit) IconButton(
                icon: const Icon(LucideIcons.trash2, size: 18, color: kError),
                onPressed: _delete,
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20, color: kMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ]),
          ),
          const Divider(height: 1, color: kLine),
          Expanded(
            child: ListView(
              controller: scroll,
              padding: const EdgeInsets.all(20),
              children: [
                ...widget.config.fields.where((f) => shouldShowField(f, _values)).map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _buildField(f),
                )),
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
        ]),
      ),
    );
  }

  Widget _buildField(ModuleField f) {
    switch (f.type) {
      case 'select':
        return DropdownButtonFormField<String>(
          value: _values[f.key]?.toString(),
          items: (f.options ?? []).map((o) => DropdownMenuItem(value: o.value, child: Text(o.label))).toList(),
          onChanged: f.readOnly ? null : (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(labelText: _reqLabel(f)),
        );

      case 'project_select':
        return DropdownButtonFormField<String>(
          value: _values[f.key]?.toString(),
          items: _projects.map((p) => DropdownMenuItem(
            value: p['id']?.toString(),
            child: Text('${p['code'] ?? ''} – ${p['name'] ?? ''}'),
          )).toList(),
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(labelText: _reqLabel(f)),
        );

      case 'checkbox':
        return Row(children: [
          Switch(
            value: _values[f.key] == true || _values[f.key] == 'true' || _values[f.key] == 1,
            onChanged: (v) => setState(() => _values[f.key] = v),
            activeColor: kAccent,
          ),
          const SizedBox(width: 8),
          Text(f.label, style: const TextStyle(fontSize: 14, color: kInk)),
        ]);

      case 'date':
        _ctrl.putIfAbsent(f.key, () => TextEditingController(text: _values[f.key]?.toString() ?? ''));
        return TextField(
          controller: _ctrl[f.key],
          readOnly: true,
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            suffixIcon: const Icon(LucideIcons.calendar, size: 18, color: kMuted),
          ),
          onTap: f.readOnly ? null : () async {
            final d = await showDatePicker(
              context: context,
              initialDate: DateTime.tryParse(_ctrl[f.key]!.text) ?? DateTime.now(),
              firstDate: DateTime(2000), lastDate: DateTime(2100),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: kAccent)),
                child: child!,
              ),
            );
            if (d != null) {
              final val = DateFormat('yyyy-MM-dd').format(d);
              _ctrl[f.key]!.text = val;
              setState(() => _values[f.key] = val);
            }
          },
        );

      case 'datetime-local':
        _ctrl.putIfAbsent(f.key, () => TextEditingController(text: _values[f.key]?.toString() ?? ''));
        return TextField(
          controller: _ctrl[f.key],
          readOnly: true,
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            suffixIcon: const Icon(LucideIcons.calendarClock, size: 18, color: kMuted),
          ),
          onTap: f.readOnly ? null : () async {
            final now = DateTime.now();
            final d = await showDatePicker(
              context: context,
              initialDate: now, firstDate: DateTime(2000), lastDate: DateTime(2100),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: kAccent)),
                child: child!,
              ),
            );
            if (d == null || !mounted) return;
            final t = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: kAccent)),
                child: child!,
              ),
            );
            if (t == null) return;
            final dt = DateTime(d.year, d.month, d.day, t.hour, t.minute);
            final val = dt.toIso8601String();
            _ctrl[f.key]!.text = DateFormat('dd MMM yyyy, hh:mm a').format(dt);
            setState(() => _values[f.key] = val);
          },
        );

      case 'time':
        _ctrl.putIfAbsent(f.key, () => TextEditingController(text: _values[f.key]?.toString() ?? ''));
        return TextField(
          controller: _ctrl[f.key],
          readOnly: true,
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            suffixIcon: const Icon(LucideIcons.clock, size: 18, color: kMuted),
          ),
          onTap: f.readOnly ? null : () async {
            final t = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: kAccent)),
                child: child!,
              ),
            );
            if (t != null) {
              final val = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
              _ctrl[f.key]!.text = val;
              setState(() => _values[f.key] = val);
            }
          },
        );

      case 'image':
        final imgUrl = _values[f.key]?.toString();
        final hasImage = imgUrl != null && imgUrl.isNotEmpty;
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_reqLabel(f), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: kMuted)),
          const SizedBox(height: 8),
          Row(children: [
            if (hasImage) ...[
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  border: Border.all(color: kLine),
                  borderRadius: BorderRadius.circular(8),
                  color: kAccentLight,
                ),
                child: const Icon(LucideIcons.checkCircle, size: 24, color: kAccent),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(child: OutlinedButton.icon(
              onPressed: () => _pickImage(f.key),
              icon: Icon(hasImage ? LucideIcons.image : LucideIcons.upload, size: 16),
              label: Text(hasImage ? 'Replace Image' : 'Upload Image'),
              style: OutlinedButton.styleFrom(
                foregroundColor: kAccent,
                side: const BorderSide(color: kAccent),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            )),
          ]),
        ]);

      case 'gps_location':
        _ctrl.putIfAbsent(f.key, () => TextEditingController(text: _values[f.key]?.toString() ?? ''));
        return TextField(
          controller: _ctrl[f.key],
          readOnly: true,
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            suffixIcon: IconButton(
              icon: const Icon(LucideIcons.mapPin, size: 18, color: kAccent),
              onPressed: () => _captureGps(f.key),
              tooltip: 'Get GPS location',
            ),
          ),
        );

      case 'textarea':
        return TextField(
          controller: _ctrl[f.key],
          maxLines: 3,
          readOnly: f.readOnly,
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(labelText: _reqLabel(f), hintText: f.placeholder, alignLabelWithHint: true),
        );

      case 'password':
        return TextField(
          controller: _ctrl[f.key],
          obscureText: true,
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            suffixIcon: const Icon(LucideIcons.lock, size: 16, color: kMuted),
          ),
        );

      default:
        return TextField(
          controller: _ctrl[f.key],
          readOnly: f.readOnly,
          keyboardType: f.type == 'number'
              ? const TextInputType.numberWithOptions(decimal: true)
              : f.type == 'tel'
                  ? TextInputType.phone
                  : f.type == 'email'
                      ? TextInputType.emailAddress
                      : TextInputType.text,
          onChanged: (v) => setState(() => _values[f.key] = v),
          decoration: InputDecoration(
            labelText: _reqLabel(f),
            hintText: f.placeholder,
            filled: f.readOnly,
            fillColor: f.readOnly ? kLine.withValues(alpha: 0.3) : null,
          ),
        );
    }
  }

  String _reqLabel(ModuleField f) => f.required ? '${f.label} *' : f.label;
}
