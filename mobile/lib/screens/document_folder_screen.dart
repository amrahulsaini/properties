import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:open_file/open_file.dart';
import 'package:http/http.dart' as http;
import '../services/api.dart';
import '../theme.dart';

const _sections = [
  {'value': 'buyer', 'label': 'Buyer'},
  {'value': 'seller', 'label': 'Seller'},
  {'value': 'witness_1', 'label': 'Witness 1'},
  {'value': 'witness_2', 'label': 'Witness 2'},
  {'value': 'identifier_1', 'label': 'Identifier 1'},
  {'value': 'identifier_2', 'label': 'Identifier 2'},
  {'value': 'plot', 'label': 'Plot Documents'},
  {'value': 'other', 'label': 'Other'},
];

const _documentTypes = [
  {'value': 'aadhaar_front', 'label': 'Aadhaar Front'},
  {'value': 'aadhaar_back', 'label': 'Aadhaar Back'},
  {'value': 'pan', 'label': 'PAN Card'},
  {'value': 'photo', 'label': 'Photo'},
  {'value': 'signature', 'label': 'Signature'},
  {'value': 'seven_twelve', 'label': '7/12 Extract'},
  {'value': 'mutation', 'label': 'Mutation'},
  {'value': 'map', 'label': 'Map'},
  {'value': 'other', 'label': 'Other Doc'},
];

Future<void> uploadDocument({
  required String filePath,
  required String mimeType,
  required String filename,
  required String folderId,
  required String section,
  required String docType,
}) async {
  final token = await getToken();
  final uri = Uri.parse('https://samarthrealty.properties/api/v1/documents/upload');
  final req = http.MultipartRequest('POST', uri);
  if (token != null) req.headers['Authorization'] = 'Bearer $token';
  req.fields['folder_id'] = folderId;
  req.fields['section'] = section;
  req.fields['party_name'] = section;
  req.fields['title'] = '$section $docType';
  req.fields['document_type'] = docType;
  req.files.add(await http.MultipartFile.fromPath('files', filePath, filename: filename));
  final streamed = await req.send();
  if (streamed.statusCode >= 400) {
    throw Exception('Upload failed (${streamed.statusCode})');
  }
}

// ── Main screen ───────────────────────────────────────────────────────────────
class DocumentFolderScreen extends StatefulWidget {
  final Map<String, dynamic> folder;
  const DocumentFolderScreen({super.key, required this.folder});

  @override
  State<DocumentFolderScreen> createState() => _DocumentFolderScreenState();
}

class _DocumentFolderScreenState extends State<DocumentFolderScreen> {
  List<Map<String, dynamic>> _documents = [];
  bool _loading = true;
  bool _pdfLoading = false;

  String get _folderId => widget.folder['id']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await apiGet('/api/v1/documents?folder_id=$_folderId');
      final raw = res is List ? res : (res as Map)['data'] ?? (res as Map)['documents'] ?? [];
      setState(() {
        _documents = (raw as List).map((e) => Map<String, dynamic>.from(e as Map<String, dynamic>)).toList();
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _downloadFolderPdf() async {
    setState(() => _pdfLoading = true);
    try {
      final path = await downloadPdf('/api/v1/document-folders/$_folderId/pdf');
      await OpenFile.open(path);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
    if (mounted) setState(() => _pdfLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.folder['folder_code']?.toString() ?? '';
    final buyer = widget.folder['buyer_name']?.toString() ?? '';
    final title = code.isNotEmpty ? code : (buyer.isNotEmpty ? buyer : 'Folder');

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: Text(title),
        actions: [
          _pdfLoading
              ? const Padding(padding: EdgeInsets.all(14),
                  child: SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(color: kAccent, strokeWidth: 2)))
              : IconButton(
                  icon: const Icon(LucideIcons.fileDown, size: 20),
                  tooltip: 'Download PDF Pack',
                  onPressed: _downloadFolderPdf,
                ),
          IconButton(icon: const Icon(LucideIcons.refreshCw, size: 18), onPressed: _fetch),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kAccent))
          : RefreshIndicator(
              color: kAccent,
              onRefresh: _fetch,
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  // Folder meta card
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: kCardDecoration,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        const Icon(LucideIcons.folderOpen, size: 16, color: kAccent),
                        const SizedBox(width: 8),
                        Text(code.isNotEmpty ? 'Dast No. $code' : 'No Dast No.',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: kInk)),
                      ]),
                      const SizedBox(height: 6),
                      if (buyer.isNotEmpty) _MetaRow('Buyer', buyer),
                      if ((widget.folder['seller_name']?.toString() ?? '').isNotEmpty)
                        _MetaRow('Seller', widget.folder['seller_name'].toString()),
                      if ((widget.folder['plot_number']?.toString() ?? '').isNotEmpty)
                        _MetaRow('Plot', widget.folder['plot_number'].toString()),
                    ]),
                  ),
                  // Section accordions
                  ..._sections.map((sec) => _SectionAccordion(
                    section: sec,
                    folderId: _folderId,
                    documents: _documents,
                    onUploaded: _fetch,
                  )),
                  const SizedBox(height: 60),
                ],
              ),
            ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final String label, value;
  const _MetaRow(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 3),
    child: Row(children: [
      Text('$label: ', style: const TextStyle(fontSize: 12, color: kMuted)),
      Expanded(child: Text(value,
          style: const TextStyle(fontSize: 12, color: kInk, fontWeight: FontWeight.w500),
          maxLines: 1, overflow: TextOverflow.ellipsis)),
    ]),
  );
}

// ── Section accordion ─────────────────────────────────────────────────────────
class _SectionAccordion extends StatefulWidget {
  final Map<String, String> section;
  final String folderId;
  final List<Map<String, dynamic>> documents;
  final VoidCallback onUploaded;
  const _SectionAccordion({required this.section, required this.folderId,
    required this.documents, required this.onUploaded});

  @override
  State<_SectionAccordion> createState() => _SectionAccordionState();
}

class _SectionAccordionState extends State<_SectionAccordion> {
  bool _open = false;

  @override
  void initState() {
    super.initState();
    _open = widget.section['value'] == 'buyer';
  }

  @override
  Widget build(BuildContext context) {
    final secVal = widget.section['value']!;
    final uploadedCount = widget.documents.where((d) => d['section']?.toString() == secVal).length;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: kCardDecoration,
      child: Column(children: [
        InkWell(
          onTap: () => setState(() => _open = !_open),
          borderRadius: _open
              ? const BorderRadius.vertical(top: Radius.circular(16))
              : BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(children: [
              Expanded(child: Row(children: [
                Text(widget.section['label']!,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: kInk)),
                if (uploadedCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: kAccentLight, borderRadius: BorderRadius.circular(20)),
                    child: Text('$uploadedCount uploaded',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: kAccent)),
                  ),
                ],
              ])),
              Icon(_open ? LucideIcons.chevronUp : LucideIcons.chevronDown, size: 16, color: kMuted),
            ]),
          ),
        ),
        if (_open) ...[
          const Divider(height: 1, color: kLine),
          Padding(
            padding: const EdgeInsets.all(10),
            child: GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 0.85,
              children: _documentTypes.map((dt) => _DocCard(
                folderId: widget.folderId,
                section: secVal,
                docType: dt,
                documents: widget.documents,
                onUploaded: widget.onUploaded,
              )).toList(),
            ),
          ),
        ],
      ]),
    );
  }
}

// ── Document card ─────────────────────────────────────────────────────────────
class _DocCard extends StatefulWidget {
  final String folderId, section;
  final Map<String, String> docType;
  final List<Map<String, dynamic>> documents;
  final VoidCallback onUploaded;
  const _DocCard({required this.folderId, required this.section, required this.docType,
    required this.documents, required this.onUploaded});

  @override
  State<_DocCard> createState() => _DocCardState();
}

class _DocCardState extends State<_DocCard> {
  bool _busy = false;
  String _error = '';

  Map<String, dynamic>? get _doc {
    try {
      return widget.documents.firstWhere((d) =>
          d['section']?.toString() == widget.section &&
          d['document_type']?.toString() == widget.docType['value']);
    } catch (_) {
      return null;
    }
  }

  Future<void> _upload() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked == null) return;
    setState(() { _busy = true; _error = ''; });
    try {
      await uploadDocument(
        filePath: picked.path,
        mimeType: picked.mimeType ?? 'image/jpeg',
        filename: picked.name,
        folderId: widget.folderId,
        section: widget.section,
        docType: widget.docType['value']!,
      );
      widget.onUploaded();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _delete() async {
    final d = _doc;
    if (d == null) return;
    setState(() { _busy = true; _error = ''; });
    try {
      await apiDelete('/api/v1/documents/${d['id']}');
      widget.onUploaded();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _view() async {
    final d = _doc;
    if (d == null) return;
    try {
      final path = await downloadPdf('/api/v1/documents/file/${d['id']}');
      await OpenFile.open(path);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final doc = _doc;
    final has = doc != null;

    return Container(
      decoration: BoxDecoration(
        color: has ? kAccentLight : kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: has ? kAccent.withValues(alpha: 0.35) : kLine),
      ),
      child: Column(children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 10, 8, 4),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(has ? LucideIcons.checkCircle2 : LucideIcons.fileQuestion,
                  size: 24, color: has ? kAccent : kLine),
              const SizedBox(height: 5),
              Text(widget.docType['label']!,
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600,
                      color: has ? kAccent : kMuted),
                  textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
              if (_error.isNotEmpty)
                Text(_error, style: const TextStyle(fontSize: 8, color: kError),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(6, 0, 6, 8),
          child: _busy
              ? const SizedBox(height: 20, width: 20,
                  child: CircularProgressIndicator(color: kAccent, strokeWidth: 2))
              : has
                  ? Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                      _Btn(icon: LucideIcons.eye, onTap: _view),
                      _Btn(icon: LucideIcons.imagePlus, onTap: _upload),
                      _Btn(icon: LucideIcons.trash2, onTap: _delete, color: kError),
                    ])
                  : GestureDetector(
                      onTap: _upload,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        decoration: BoxDecoration(
                          color: kAccent, borderRadius: BorderRadius.circular(8)),
                        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(LucideIcons.upload, size: 11, color: Colors.white),
                          SizedBox(width: 3),
                          Text('Upload', style: TextStyle(
                              fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white)),
                        ]),
                      ),
                    ),
        ),
      ]),
    );
  }
}

class _Btn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;
  const _Btn({required this.icon, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: (color ?? kInk).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(icon, size: 13, color: color ?? kInk),
    ),
  );
}
