// src/components/chantier/PhotoGrid.tsx
import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type ChantierPhoto } from '../../models/chantier';

type Props = {
  photos: ChantierPhoto[];
  onDelete: (photoId: number) => Promise<void>;
};

export function PhotoGrid({ photos, onDelete }: Props) {
  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune photo pour l'instant.</Text>
      </View>
    );
  }

  function confirmDelete(photoId: number) {
    Alert.alert(
      'Supprimer cette photo ?',
      'Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDelete(photoId).catch(e => {
              Alert.alert(
                'Erreur',
                e instanceof Error ? e.message : 'Suppression impossible.'
              );
            });
          },
        },
      ]
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map(photo => (
        <View key={photo.id} style={styles.tile}>
          <Image source={{ uri: photo.uri }} style={styles.image} />
          {photo.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {photo.caption}
            </Text>
          )}
          <Pressable
            onPress={() => confirmDelete(photo.id)}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#fff',
  },
  emptyText: { color: '#6B7280', fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  caption: {
    fontSize: 12,
    color: '#374151',
    padding: 6,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
