// src/components/ui/AppModal.tsx
// Fenêtre modale contrôlée : le parent décide si elle est visible (visible)
// et fournit la fonction pour la fermer (onClose).
// Le contenu est libre (children) — confirmation, formulaire, liste…

import { Modal, Pressable, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

type AppModalProps = {
  visible: boolean;              // contrôlé par le parent
  onClose: () => void;           // appelé pour fermer (fond, bouton système)
  title?: string;                // titre optionnel en haut de la modale
  children: ReactNode;           // contenu libre
};

export function AppModal({ visible, onClose, title, children }: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title && (
            <AppText variant="h2" style={styles.title}>
              {title}
            </AppText>
          )}

          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
});