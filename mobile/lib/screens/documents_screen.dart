import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import 'package:open_file/open_file.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/app_drawer.dart';
import 'document_folder_screen.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});
  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _folders = [], _files = [];
  bool _loading = true;
  final Set<dynamic> _pdfLoading = {};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await apiGet('/api/v1/documents') as Map<String, dynamic>;
      setState(() {
        _folders = (res['folders'] as List? ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _files = (res['files'] as List? ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _createFolder() async {
    final ctrl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('New Folder'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Folder name'), autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, ctrl.text), child: const Text('Create')),
        ],
      ),
    );
    if (name == null || name.trim().isEmpty) return;
    try {
      await apiPost('/api/v1/documents/folders', {'name': name.trim()});
      _fetch();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _upload() async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if (file.path == null) return;
    try {
      await uploadFile(file.path!, file.extension != null ? 'application/${file.extension}' : 'application/octet-stream', file.name);
      _fetch();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File uploaded.')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _downloadFolderPdf(Map<String, dynamic> folder) async {
    final id = folder['id'];
    setState(() => _pdfLoading.add(id));
    try {
      final path = await downloadPdf('/api/v1/document-folders/$id/pdf');
      await OpenFile.open(path);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    }
    if (mounted) setState(() => _pdfLoading.remove(id));
  }

  Future<void> _deleteFile(Map<String, dynamic> file) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete File'),
        content: Text('Delete "${file['name'] ?? file['original_name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: kError))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await apiDelete('/api/v1/documents/${file['id']}');
      _fetch();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  String _size(dynamic bytes) {
    if (bytes == null) return '';
    final n = (bytes as num).toDouble();
    if (n >= 1024 * 1024) return '${(n / (1024 * 1024)).toStringAsFixed(1)} MB';
    if (n >= 1024) return '${(n / 1024).toStringAsFixed(0)} KB';
    return '${n.toInt()} B';
  }

  IconData _fileIcon(String? ext) {
    switch ((ext ?? '').toLowerCase()) {
      case 'pdf': return LucideIcons.fileText;
      case 'jpg': case 'jpeg': case 'png': case 'webp': return LucideIcons.image;
      case 'xlsx': case 'xls': case 'csv': return LucideIcons.fileSpreadsheet;
      case 'doc': case 'docx': return LucideIcons.fileText;
      default: return LucideIcons.file;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      drawer: const AppDrawer(currentRoute: '/documents'),
      appBar: AppBar(
        title: const Text('Documents'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: kAccent,
          unselectedLabelColor: kMuted,
          indicatorColor: kAccent,
          tabs: const [Tab(text: 'Folders'), Tab(text: 'Files')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kAccent))
          : RefreshIndicator(
              color: kAccent,
              onRefresh: _fetch,
              child: TabBarView(
                controller: _tabs,
                children: [
                  // Folders tab
                  _folders.isEmpty
                      ? _emptyState('No folders yet.', LucideIcons.folderOpen)
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _folders.length,
                          itemBuilder: (_, i) {
                            final f = _folders[i];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: kCardDecoration,
                              child: ListTile(
                                leading: const Icon(LucideIcons.folder, color: kAccent, size: 22),
                                title: Text(f['name'] ?? f['buyer_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Text(
                                  [
                                    if ((f['folder_code'] ?? '').toString().isNotEmpty) 'Dast: ${f['folder_code']}',
                                    if ((f['plot_number'] ?? '').toString().isNotEmpty) 'Plot: ${f['plot_number']}',
                                  ].join('  ·  ').isNotEmpty
                                      ? [
                                          if ((f['folder_code'] ?? '').toString().isNotEmpty) 'Dast: ${f['folder_code']}',
                                          if ((f['plot_number'] ?? '').toString().isNotEmpty) 'Plot: ${f['plot_number']}',
                                        ].join('  ·  ')
                                      : '${f['file_count'] ?? 0} files',
                                  style: const TextStyle(fontSize: 12, color: kMuted),
                                ),
                                trailing: _pdfLoading.contains(f['id'])
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: kAccent, strokeWidth: 2))
                                    : IconButton(
                                        icon: const Icon(LucideIcons.fileDown, size: 18, color: kAccent),
                                        tooltip: 'Download PDF Pack',
                                        onPressed: () => _downloadFolderPdf(f),
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                      ),
                                onTap: () => Navigator.push(context,
                                    MaterialPageRoute(builder: (_) => DocumentFolderScreen(folder: f))),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                            );
                          },
                        ),
                  // Files tab
                  _files.isEmpty
                      ? _emptyState('No files uploaded.', LucideIcons.fileUp)
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _files.length,
                          itemBuilder: (_, i) {
                            final f = _files[i];
                            final ext = (f['original_name'] as String?)?.split('.').last;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: kCardDecoration,
                              child: ListTile(
                                leading: Icon(_fileIcon(ext), color: kAccent, size: 22),
                                title: Text(f['original_name'] ?? f['name'] ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                subtitle: Text(_size(f['size']), style: const TextStyle(fontSize: 12, color: kMuted)),
                                trailing: IconButton(
                                  icon: const Icon(LucideIcons.trash2, size: 16, color: kError),
                                  onPressed: () => _deleteFile(f),
                                ),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.small(
            heroTag: 'folder',
            onPressed: _createFolder,
            backgroundColor: kSurface,
            foregroundColor: kAccent,
            child: const Icon(LucideIcons.folderPlus, size: 18),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.extended(
            heroTag: 'upload',
            onPressed: _upload,
            backgroundColor: kAccent,
            foregroundColor: Colors.white,
            icon: const Icon(LucideIcons.upload, size: 18),
            label: const Text('Upload', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _emptyState(String msg, IconData icon) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 48, color: kLine),
      const SizedBox(height: 12),
      Text(msg, style: const TextStyle(color: kMuted, fontSize: 14)),
    ]),
  );
}
