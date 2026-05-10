import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch, Modal,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors } from '@/lib/theme';
import { apiGet } from '@/lib/api';
import type { ModuleField, SelectOption } from '@/lib/modules';

interface FormFieldProps {
  field: ModuleField;
  value: unknown;
  onChange: (val: unknown) => void;
}

function SelectModal({
  options, value, onChange, placeholder,
}: { options: SelectOption[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity style={fs.selectBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[fs.selectText, !selected && { color: Colors.muted }]}>
          {selected?.label ?? placeholder ?? 'Select…'}
        </Text>
        <Text style={fs.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={fs.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={fs.pickerCard}>
            <Text style={fs.pickerTitle}>{placeholder ?? 'Select option'}</Text>
            <FlatList
              data={options}
              keyExtractor={o => o.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[fs.optRow, item.value === value && fs.optRowActive]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={[fs.optText, item.value === value && fs.optTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Text style={{ color: Colors.accent }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={fs.cancelBtn} onPress={() => setOpen(false)}>
              <Text style={fs.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function ProjectSelectField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [projects, setProjects] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<{ data: Array<{ id: number; name: string; code: string }> }>('/api/v1/projects')
      .then(res => setProjects(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: 8 }} />;

  const options: SelectOption[] = projects.map(p => ({
    value: String(p.id),
    label: `${p.code} – ${p.name}`,
  }));

  return (
    <SelectModal
      options={options}
      value={String(value ?? '')}
      onChange={onChange}
      placeholder="Select project…"
    />
  );
}

function GpsLocationField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const [locating, setLocating] = useState(false);

  async function detectLocation() {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'SamarthProperties/1.0' } }
      );
      const data = await res.json();
      const address = data.display_name ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      onChange(address);
    } catch {
      // fallback: skip silently
    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={fs.gpsRow}>
      <TextInput
        style={[fs.input, { flex: 1, marginBottom: 0 }]}
        value={String(value ?? '')}
        onChangeText={onChange}
        placeholder="Enter or detect location"
        placeholderTextColor={Colors.muted}
        multiline
      />
      <TouchableOpacity style={fs.gpsBtn} onPress={detectLocation} disabled={locating}>
        {locating
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={fs.gpsBtnText}>📍</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function ImageField({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      onChange(res.assets[0].uri);
    }
  }

  return (
    <TouchableOpacity style={fs.imageBtn} onPress={pick} activeOpacity={0.7}>
      {value
        ? <Text style={fs.imageBtnText}>✓ Image selected</Text>
        : <Text style={fs.imageBtnText}>📷  Choose photo</Text>
      }
    </TouchableOpacity>
  );
}

export default function FormField({ field, value, onChange }: FormFieldProps) {
  const commonInputProps = {
    style: fs.input,
    placeholderTextColor: Colors.muted,
    value: String(value ?? ''),
    onChangeText: (v: string) => onChange(v),
    placeholder: field.placeholder ?? `Enter ${field.label.toLowerCase()}`,
  };

  const label = (
    <View style={fs.labelRow}>
      <Text style={fs.label}>{field.label}</Text>
      {field.required && <Text style={fs.required}> *</Text>}
    </View>
  );

  let input: React.ReactNode;

  switch (field.type) {
    case 'number':
      input = <TextInput {...commonInputProps} keyboardType="numeric" />;
      break;

    case 'textarea':
      input = (
        <TextInput
          {...commonInputProps}
          multiline
          numberOfLines={3}
          style={[fs.input, fs.textarea]}
          textAlignVertical="top"
        />
      );
      break;

    case 'select':
      input = (
        <SelectModal
          options={field.options ?? []}
          value={String(value ?? '')}
          onChange={v => onChange(v)}
          placeholder={`Select ${field.label.toLowerCase()}…`}
        />
      );
      break;

    case 'project_select':
      input = <ProjectSelectField value={String(value ?? '')} onChange={v => onChange(v)} />;
      break;

    case 'checkbox':
      input = (
        <View style={fs.switchRow}>
          <Switch
            value={!!value}
            onValueChange={v => onChange(v)}
            trackColor={{ false: Colors.line, true: Colors.accent }}
            thumbColor="#fff"
          />
          <Text style={fs.switchLabel}>{value ? 'Yes' : 'No'}</Text>
        </View>
      );
      break;

    case 'image':
      input = <ImageField value={value} onChange={onChange} />;
      break;

    case 'gps_location':
      input = <GpsLocationField value={value} onChange={onChange} />;
      break;

    case 'date':
      input = (
        <TextInput
          {...commonInputProps}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      );
      break;

    default:
      input = <TextInput {...commonInputProps} />;
  }

  return (
    <View style={fs.wrap}>
      {label}
      {input}
    </View>
  );
}

const fs = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  required: { fontSize: 13, color: Colors.error },
  input: {
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: Colors.ink, backgroundColor: Colors.bg,
  },
  textarea: { height: 80 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.line, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: Colors.bg,
  },
  selectText: { fontSize: 14, color: Colors.ink, flex: 1 },
  chevron: { color: Colors.muted, fontSize: 14 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '70%',
  },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 12 },
  optRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  optRowActive: { backgroundColor: Colors.accentLight, borderRadius: 8 },
  optText: { fontSize: 15, color: Colors.ink },
  optTextActive: { color: Colors.accent, fontWeight: '600' },
  cancelBtn: {
    marginTop: 12, paddingVertical: 12,
    alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 10,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.muted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 14, color: Colors.muted },
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  gpsBtnText: { fontSize: 18 },
  imageBtn: {
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 10, borderStyle: 'dashed',
    paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.accentLight,
  },
  imageBtnText: { fontSize: 14, color: Colors.accent, fontWeight: '500' },
});
