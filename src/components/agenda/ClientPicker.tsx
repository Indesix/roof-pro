// src/components/agenda/ClientPicker.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export type PickableClient = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
};

type Props = {
  value: PickableClient | null;
  onChange: (client: PickableClient | null) => void;
  /** Si true, le bouton "✕" n'apparaît pas (client obligatoire). */
  required?: boolean;
  placeholder?: string;
};

function fullName(c: { first_name: string; last_name: string }): string {
  return `${c.first_name} ${c.last_name}`.trim();
}

/**
 * Picker de client : bouton qui ouvre un modal listant les clients
 * actifs avec recherche.
 */
export function ClientPicker({
  value,
  onChange,
  required = false,
  placeholder = 'Choisir un client',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ? fullName(value) : placeholder}
        </Text>
        {value && !required && (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </Pressable>

      <ClientPickerModal
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={c => {
          onChange(c);
          setOpen(false);
        }}
      />
    </>
  );
}

function ClientPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (c: PickableClient) => void;
}) {
  const db = useSQLiteContext();
  const [clients, setClients] = useState<PickableClient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await db.getAllAsync<PickableClient>(
          `SELECT id, first_name, last_name, phone, address, city, postal_code
             FROM clients
            WHERE status IN ('active', 'lead')
            ORDER BY last_name COLLATE NOCASE ASC,
                     first_name COLLATE NOCASE ASC`
        );
        if (alive) setClients(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, db]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => fullName(c).toLowerCase().includes(q));
  }, [clients, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choisir un client</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.modalClose}>Annuler</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Rechercher un client…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? (
          <Text style={styles.muted}>Chargement…</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.muted}>
            {query ? 'Aucun résultat.' : 'Aucun client disponible.'}
          </Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={c => String(c.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: '#F3F4F6' },
                ]}
              >
                <Text style={styles.itemName}>{fullName(item)}</Text>
                {item.phone && (
                  <Text style={styles.itemMeta}>{item.phone}</Text>
                )}
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  fieldPressed: { backgroundColor: '#F3F4F6' },
  fieldValue: { flex: 1, fontSize: 15, color: '#111827' },
  fieldPlaceholder: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  clearBtn: { paddingHorizontal: 6 },
  clearText: { fontSize: 16, color: '#6B7280' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  modalClose: { fontSize: 15, color: '#2563EB' },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 15,
  },
  muted: { padding: 16, color: '#6B7280' },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  itemName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  itemMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
