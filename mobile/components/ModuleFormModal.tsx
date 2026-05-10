import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, shadow } from '@/lib/theme';
import { apiPost, apiPut, apiDelete } from '@/lib/api';
import FormField from './FormField';
import type { ModuleConfig } from '@/lib/modules';

interface ModuleFormModalProps {
  visible: boolean;
  module: ModuleConfig;
  record?: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ModuleFormModal({ visible, module, record, onClose, onSaved }: ModuleFormModalProps) {
  const isEdit = !!record?.id;
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      const init: Record<string, unknown> = {};
      for (const f of module.fields) {
        init[f.key] = record?.[f.key] ?? '';
      }
      setValues(init);
    }
  }, [visible, record, module]);

  function setValue(key: string, val: unknown) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    const missing = module.fields
      .filter(f => f.required && !values[f.key])
      .map(f => f.label);
    if (missing.length > 0) {
      Alert.alert('Required fields', `Please fill: ${missing.join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      const resource = module.resource ?? module.slug;
      if (isEdit) {
        await apiPut(`/api/v1/${resource}/${record!.id}`, values);
      } else {
        await apiPost(`/api/v1/${resource}`, values);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const resource = module.resource ?? module.slug;
              await apiDelete(`/api/v1/${resource}/${record!.id}`);
              onSaved();
              onClose();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>{isEdit ? `Edit ${module.title}` : `Add ${module.title}`}</Text>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          {module.fields.map(field => (
            <FormField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={val => setValue(field.key, val)}
            />
          ))}

          {isEdit && (
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              {deleting
                ? <ActivityIndicator size="small" color={Colors.error} />
                : <Text style={s.deleteTxt}>🗑  Delete this record</Text>
              }
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  closeTxt: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.ink },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 60, alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  form: { padding: 20 },
  deleteBtn: {
    borderWidth: 1.5, borderColor: Colors.error, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 8,
    backgroundColor: Colors.errorLight,
  },
  deleteTxt: { fontSize: 14, fontWeight: '600', color: Colors.error },
});
