// src/components/clients/ClientForm.tsx
// Formulaire client réutilisé en CRÉATION et en ÉDITION.
// - Composant contrôlé : le state du formulaire vit ici (source de vérité).
// - Validation Zod (Module 5) au submit, erreurs affichées par champ.
// - Réutilise AppInput, AppSelect, AppButton du Design System (Jour 2).
// Aligné sur le schéma réel : first_name, last_name, city, postal_code.

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppInput } from '../ui/AppInput';
import { AppSelect } from '../ui/AppSelect';
import { AppButton } from '../ui/AppButton';
import { clientSchema, type ClientFormData } from '../../validations/client.schema';
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  type ClientStatus,
} from '../../models/client';
import { spacing } from '../../constants/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ClientFormProps {
  initialValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
}

const STATUS_OPTIONS = CLIENT_STATUSES.map((s) => ({
  value: s,
  label: CLIENT_STATUS_LABELS[s],
}));

export function ClientForm({
  initialValues,
  onSubmit,
  submitLabel = 'Enregistrer',
  loading = false,
}: ClientFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.first_name ?? '');
  const [lastName, setLastName] = useState(initialValues?.last_name ?? '');
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [phone, setPhone] = useState(initialValues?.phone ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [city, setCity] = useState(initialValues?.city ?? '');
  const [postalCode, setPostalCode] = useState(initialValues?.postal_code ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [status, setStatus] = useState<ClientStatus>(
    (initialValues?.status as ClientStatus) ?? 'lead'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const result = clientSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      city,
      postal_code: postalCode,
      notes,
      status,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  return (
     <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      
    >
      <AppInput
        label="Prénom *"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Prénom"
        error={errors.first_name}
      />

      <AppInput
        label="Nom *"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Nom"
        error={errors.last_name}
      />

      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="email@exemple.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <AppInput
        label="Téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+32 ..."
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <AppInput
        label="Adresse"
        value={address}
        onChangeText={setAddress}
        placeholder="Rue, numéro..."
        error={errors.address}
      />

      <AppInput
        label="Ville"
        value={city}
        onChangeText={setCity}
        placeholder="Ville"
        error={errors.city}
      />

      <AppInput
        label="Code postal"
        value={postalCode}
        onChangeText={setPostalCode}
        placeholder="6000"
        keyboardType="number-pad"
        error={errors.postal_code}
      />

      <AppSelect
        label="Statut"
        value={status}
        options={STATUS_OPTIONS}
        onSelect={(v) => setStatus(v as ClientStatus)}
      />

      <AppInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes internes..."
        multiline
        error={errors.notes}
      />

      
    </ScrollView>
    <View style={styles.footer}>
        <AppButton title={submitLabel} onPress={handleSubmit} loading={loading} />
      </View>
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',   
  },
});
