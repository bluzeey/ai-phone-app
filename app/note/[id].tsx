import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loading } from '../../components/ui/Loading';
import { useAppStore } from '../../store/appStore';
import { useNotes } from '../../hooks/useNotes';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const notes = useAppStore((state) => state.notes);
  const folders = useAppStore((state) => state.folders);
  const { remove, toggleFavorite } = useNotes();

  const note = useMemo(() => notes.find((n) => n.id === id), [notes, id]);
  const folder = useMemo(
    () => folders.find((f) => f.id === note?.folderId),
    [folders, note]
  );

  if (!note) {
    return <Loading message="Loading note..." />;
  }

  if (!note.imageUri) {
    return (
      <EmptyState
        title="Note not found"
        subtitle="The note you are looking for does not exist."
        icon={<MaterialIcons name="error-outline" size={64} color={Colors.textTertiary} />}
      />
    );
  }

  const handleEdit = () => {
    router.push({
      pathname: '/note/edit',
      params: { noteId: note.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(note);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Could not delete note.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: note.title,
        message: `${note.title}\n\n${note.body}`,
      });
    } catch (error) {
      // User cancelled share
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => toggleFavorite(note)} style={styles.iconButton}>
            <MaterialIcons
              name={note.isFavorite ? 'star' : 'star-border'}
              size={24}
              color={note.isFavorite ? Colors.warning : Colors.text}
            />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <MaterialIcons name="share" size={24} color={Colors.text} />
          </Pressable>
          <Pressable onPress={handleEdit} style={styles.iconButton}>
            <MaterialIcons name="edit" size={24} color={Colors.text} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconButton}>
            <MaterialIcons name="delete-outline" size={24} color={Colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {note.imageUri && (
          <Pressable onPress={handleEdit}>
            <Image
              source={{ uri: note.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
          </Pressable>
        )}

        <View style={styles.metaRow}>
          {folder && (
            <View style={[styles.folderBadge, { backgroundColor: `${folder.color}20` }]}>
              <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
              <Text style={[styles.folderName, { color: folder.color }]}>
                {folder.name}
              </Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
        </View>

        <Text style={styles.title}>{note.title}</Text>

        {note.body ? (
          <Text style={styles.body}>{note.body}</Text>
        ) : (
          <Text style={styles.emptyBody}>No additional notes</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  folderDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  folderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  emptyBody: {
    fontSize: 16,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
