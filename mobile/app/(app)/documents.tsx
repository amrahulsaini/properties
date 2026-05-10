import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import { Colors, shadow } from '@/lib/theme';
import { apiGet, apiDelete, BASE_URL, getToken } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface DocFolder {
  id: number;
  name: string;
  project_name?: string;
  created_at: string;
  document_count?: number;
}

interface Document {
  id: number;
  folder_id: number;
  name: string;
  file_url: string;
  mime_type?: string;
  created_at: string;
}

type Tab = 'folders' | 'documents';

export default function DocumentsScreen() {
  const [tab, setTab] = useState<Tab>('folders');
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<DocFolder | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await apiGet<{ data: DocFolder[] }>('/api/v1/document-folders');
      setFolders(res.data ?? []);
    } catch {}
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const path = selectedFolder
        ? `/api/v1/documents?folder_id=${selectedFolder.id}`
        : '/api/v1/documents';
      const res = await apiGet<{ data: Document[] }>(path);
      setDocuments(res.data ?? []);
    } catch {}
  }, [selectedFolder]);

  const loadData = useCallback(async () => {
    await Promise.all([fetchFolders(), fetchDocuments()]);
  }, [fetchFolders, fetchDocuments]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleUpload() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    const filename = asset.fileName ?? `upload_${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? 'image/jpeg';

    try {
      setUploading(true);
      setUploadPct(0);
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, type: mimeType, name: filename } as unknown as Blob);
      if (selectedFolder) {
        formData.append('folder_id', String(selectedFolder.id));
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', `${BASE_URL}/api/v1/documents/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      await fetchDocuments();
      Alert.alert('Uploaded', 'Document uploaded successfully.');
    } catch (e: unknown) {
      Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  async function handleDeleteDoc(doc: Document) {
    Alert.alert('Delete Document', `Delete "${doc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/v1/documents/${doc.id}`);
            await fetchDocuments();
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
          }
        },
      },
    ]);
  }

  function renderFolder({ item }: { item: DocFolder }) {
    return (
      <TouchableOpacity
        style={dc.folderCard}
        onPress={() => { setSelectedFolder(item); setTab('documents'); }}
        activeOpacity={0.75}
      >
        <View style={dc.folderIcon}>
          <Text style={dc.folderEmoji}>📁</Text>
        </View>
        <View style={dc.folderInfo}>
          <Text style={dc.folderName} numberOfLines={1}>{item.name}</Text>
          {item.project_name && (
            <Text style={dc.folderSub} numberOfLines={1}>{item.project_name}</Text>
          )}
          <Text style={dc.folderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>
    );
  }

  function renderDocument({ item }: { item: Document }) {
    const isImage = item.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name);
    return (
      <View style={dc.docCard}>
        <View style={dc.docIcon}>
          <Text style={dc.docEmoji}>{isImage ? '🖼️' : '📄'}</Text>
        </View>
        <View style={dc.docInfo}>
          <Text style={dc.docName} numberOfLines={2}>{item.name}</Text>
          <Text style={dc.docDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={dc.docActions}>
          <TouchableOpacity
            style={dc.docBtn}
            onPress={() => Linking.openURL(item.file_url)}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={16} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[dc.docBtn, { backgroundColor: Colors.errorLight }]}
            onPress={() => handleDeleteDoc(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={dc.safe} edges={['top']}>
      <AppHeader
        title={selectedFolder ? selectedFolder.name : 'Documents'}
        subtitle={selectedFolder ? 'Document vault' : 'All folders'}
        rightAction={selectedFolder
          ? { icon: 'arrow-back', onPress: () => { setSelectedFolder(null); setTab('folders'); } }
          : undefined
        }
      />

      {/* Tabs */}
      <View style={dc.tabs}>
        {(['folders', 'documents'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[dc.tab, tab === t && dc.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[dc.tabText, tab === t && dc.tabTextActive]}>
              {t === 'folders' ? 'Folders' : 'Files'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload progress */}
      {uploading && (
        <View style={dc.progressBar}>
          <View style={[dc.progressFill, { width: `${uploadPct}%` }]} />
          <Text style={dc.progressTxt}>{uploadPct}%</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : tab === 'folders' ? (
        <FlatList
          data={folders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFolder}
          contentContainerStyle={folders.length === 0 ? { flex: 1 } : { padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<EmptyState message="No folders yet." icon="📂" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderDocument}
          contentContainerStyle={documents.length === 0 ? { flex: 1 } : { padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<EmptyState message="No documents yet." icon="📄" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Upload FAB */}
      <TouchableOpacity style={dc.fab} onPress={handleUpload} disabled={uploading} activeOpacity={0.85}>
        {uploading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        }
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const dc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    backgroundColor: Colors.surface, borderRadius: 10, padding: 3,
    borderWidth: 1, borderColor: Colors.line,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  tabTextActive: { color: '#fff' },
  progressBar: {
    marginHorizontal: 16, marginTop: 8, height: 20, backgroundColor: Colors.line,
    borderRadius: 10, overflow: 'hidden', justifyContent: 'center',
  },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.accent },
  progressTxt: { textAlign: 'center', fontSize: 11, fontWeight: '600', color: Colors.ink },
  folderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  folderIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  folderEmoji: { fontSize: 22 },
  folderInfo: { flex: 1 },
  folderName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  folderSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  folderDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, ...shadow, borderWidth: 1, borderColor: Colors.line,
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  docEmoji: { fontSize: 22 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  docDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 6 },
  docBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
