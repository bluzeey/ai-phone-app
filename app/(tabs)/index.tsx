import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderCard } from '../../components/FolderCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { useAppStore } from '../../store/appStore';
import { useFolders } from '../../hooks/useFolders';
import { BorderRadius, Colors, FolderColors, Spacing } from '../../constants/colors';
import { Folder } from '../../types';

export default function Dashboard() {
  const router = useRouter();
  const notes = useAppStore((state) => state.notes);
  const folders = useAppStore((state) => state.folders);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const { add, remove } = useFolders();

  const [modalVisible, setModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderTopic, setFolderTopic] = useState('');
  const [folderColor, setFolderColor] = useState<string>(FolderColors[0]);
  const [isCreating, setIsCreating] = useState(false);

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const lower = searchQuery.toLowerCase();
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        (f.topic && f.topic.toLowerCase().includes(lower))
    );
  }, [folders, searchQuery]);

  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      counts[note.folderId] = (counts[note.folderId] || 0) + 1;
    });
    return counts;
  }, [notes]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
    },
    [setSearchQuery]
  );

  const handleCreateFolder = useCallback(async () => {
    const name = folderName.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      await add({ name, topic: folderTopic, color: folderColor });
      setFolderName('');
      setFolderTopic('');
      setFolderColor(FolderColors[0]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Could not create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [folderName, folderTopic, folderColor, add]);

  const handleFolderPress = useCallback(
    (folder: Folder) => {
      router.push(`/folder/${folder.id}`);
    },
    [router]
  );

  const handleFolderLongPress = useCallback(
    (folder: Folder) => {
      Alert.alert(
        folder.name,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await remove(folder);
              } catch (error) {
                Alert.alert('Error', 'Could not delete folder.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [remove]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Notes</Text>
          <Text style={styles.subtitle}>
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'} ·{' '}
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/note/edit')}
            style={styles.addFolderButton}
          >
            <MaterialIcons name="note-add" size={24} color={Colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={styles.addFolderButton}
          >
            <MaterialIcons name="create-new-folder" size={24} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search folders and notes..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch('')}>
            <MaterialIcons name="close" size={20} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredFolders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FolderCard
            folder={item}
            noteCount={noteCounts[item.id] || 0}
            onPress={handleFolderPress}
            onLongPress={handleFolderLongPress}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={searchQuery ? 'No matches' : 'No folders yet'}
            subtitle={
              searchQuery
                ? 'Try a different search term'
                : 'Create a folder or tap the camera to digitize a note'
            }
            icon={<MaterialIcons name="folder-open" size={64} color={Colors.textTertiary} />}
          />
        }
      />

      <Pressable
        onPress={() => router.push('/camera')}
        style={styles.cameraButton}
      >
        <MaterialIcons name="photo-camera" size={28} color={Colors.surface} />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Input
              label="Folder name"
              placeholder="e.g., Work, Receipts, Ideas"
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
            />

            <Input
              label="Topic (optional)"
              placeholder="e.g., Productivity"
              value={folderTopic}
              onChangeText={setFolderTopic}
            />

            <Text style={styles.colorLabel}>Color</Text>
            <ColorPicker selected={folderColor} onSelect={setFolderColor} />

            <Button
              title="Create Folder"
              onPress={handleCreateFolder}
              loading={isCreating}
              disabled={!folderName.trim()}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addFolderButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 48,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  list: {
    paddingHorizontal: Spacing.lg,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
