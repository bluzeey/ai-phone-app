import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoteCard } from '../../components/NoteCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loading } from '../../components/ui/Loading';
import { useAppStore } from '../../store/appStore';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { Note } from '../../types';

export default function FolderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const notes = useAppStore((state) => state.notes);
  const folders = useAppStore((state) => state.folders);
  const { toggleFavorite, remove: removeNote } = useNotes();
  const { remove } = useFolders();

  const folder = useMemo(() => folders.find((f) => f.id === id), [folders, id]);
  const folderNotes = useMemo(
    () => notes.filter((n) => n.folderId === id),
    [notes, id]
  );

  if (!folder) {
    return <Loading message="Loading folder..." />;
  }

  const handleNotePress = (note: Note) => {
    router.push(`/note/${note.id}`);
  };

  const handleNoteLongPress = (note: Note) => {
    Alert.alert(
      note.title,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: note.isFavorite ? 'Unfavorite' : 'Favorite',
          onPress: () => toggleFavorite(note),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeNote(note);
            } catch (error) {
              Alert.alert('Error', 'Could not delete note.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteFolder = () => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folder.name}"? All ${folderNotes.length} notes inside will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(folder);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Could not delete folder.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {folder.name}
          </Text>
          {folder.topic ? (
            <Text style={styles.topic}>{folder.topic}</Text>
          ) : null}
        </View>
        <Pressable onPress={handleDeleteFolder} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color={Colors.danger} />
        </Pressable>
      </View>

      <FlatList
        data={folderNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={handleNotePress}
            onLongPress={handleNoteLongPress}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No notes yet"
            subtitle="Tap the camera button to add your first note to this folder"
            icon={<MaterialIcons name="note-alt" size={64} color={Colors.textTertiary} />}
          />
        }
      />

      <Pressable
        onPress={() => router.push({ pathname: '/camera', params: { folderId: folder.id } })}
        style={styles.cameraButton}
      >
        <MaterialIcons name="photo-camera" size={28} color={Colors.surface} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  topic: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  cameraButton: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
