import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { useAppStore } from '../../store/appStore';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { deletePhoto } from '../../services/storage';
import { FolderColors, BorderRadius, Colors, Spacing } from '../../constants/colors';
import { Folder } from '../../types';

export default function NoteEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    noteId?: string;
    imageUri?: string;
    folderId?: string;
    title?: string;
    body?: string;
    extractedText?: string;
  }>();

  const isTextOnly = params.imageUri === undefined || params.imageUri === '' || params.imageUri === null;

  const folders = useAppStore((state) => state.folders);
  const notes = useAppStore((state) => state.notes);
  const { add, update } = useNotes();
  const { add: addFolder } = useFolders();

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(params.imageUri || null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<string>(FolderColors[0]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const isEditing = Boolean(params.noteId);
  const existingNote = useMemo(
    () => notes.find((n) => n.id === params.noteId),
    [notes, params.noteId]
  );

  useEffect(() => {
    if (isEditing && existingNote) {
      setTitle(existingNote.title);
      setBody(existingNote.body);
      setExtractedText(existingNote.extractedText);
      setImageUri(existingNote.imageUri);
      setSelectedFolderId(existingNote.folderId);
    } else if (!isEditing) {
      setTitle(params.title || '');
      setBody(params.body || '');
      setExtractedText(params.extractedText || '');

      if (params.folderId) {
        setSelectedFolderId(params.folderId);
      } else if (folders.length > 0) {
        setSelectedFolderId(folders[0].id);
      } else {
        setSelectedFolderId(null);
      }
    }
    setIsLoading(false);
  }, [isEditing, existingNote, params, folders]);

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;

    setIsCreatingFolder(true);
    try {
      const folder = await addFolder({ name, color: newFolderColor });
      setSelectedFolderId(folder.id);
      setNewFolderName('');
      setNewFolderColor(FolderColors[0]);
      setNewFolderModalVisible(false);
      setFolderModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Could not create folder.');
    } finally {
      setIsCreatingFolder(false);
    }
  }, [newFolderName, newFolderColor, addFolder]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please add a title for your note.');
      return;
    }
    if (!selectedFolderId) {
      Alert.alert('Folder required', 'Please select or create a folder.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && existingNote) {
        await update(existingNote.id, {
          title,
          body,
          extractedText,
          folderId: selectedFolderId,
          imageUri,
        });
        router.replace(`/note/${existingNote.id}`);
      } else {
        const note = await add({
          folderId: selectedFolderId,
          title,
          body,
          imageUri,
          extractedText,
        });
        router.replace(`/note/${note.id}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [title, body, extractedText, imageUri, selectedFolderId, isEditing, existingNote, add, update, router]);

  const handleCancel = useCallback(async () => {
    if (!isEditing && imageUri) {
      await deletePhoto(imageUri);
    }
    router.back();
  }, [isEditing, imageUri, router]);

  if (isLoading) {
    return <Loading message="Loading note..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.iconButton}>
            <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Note' : 'New Note'}
          </Text>
          <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
            />
          )}

          <Input
            label="Title"
            placeholder="Note title"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Folder</Text>
          <Pressable
            onPress={() => setFolderModalVisible(true)}
            style={styles.folderSelector}
          >
            <View style={[styles.folderDot, { backgroundColor: selectedFolder?.color || Colors.textTertiary }]} />
            <Text style={styles.folderName} numberOfLines={1}>
              {selectedFolder ? selectedFolder.name : 'Select a folder'}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
          </Pressable>

          <Input
            label="Note"
            placeholder="Add your digitized note here..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            style={styles.bodyInput}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Folder picker modal */}
      <Modal
        visible={folderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Folder</Text>
              <Pressable onPress={() => setFolderModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => {
                  setSelectedFolderId(folder.id);
                  setFolderModalVisible(false);
                }}
                style={styles.folderOption}
              >
                <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
                <Text style={styles.folderOptionText}>{folder.name}</Text>
                {selectedFolderId === folder.id && (
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                )}
              </Pressable>
            ))}

            <Pressable
              onPress={() => setNewFolderModalVisible(true)}
              style={styles.newFolderOption}
            >
              <MaterialIcons name="add" size={20} color={Colors.primary} />
              <Text style={styles.newFolderText}>Create new folder</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* New folder modal */}
      <Modal
        visible={newFolderModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNewFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <Pressable onPress={() => setNewFolderModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />

            <Text style={styles.colorLabel}>Color</Text>
            <ColorPicker selected={newFolderColor} onSelect={setNewFolderColor} />

            <Button
              title="Create Folder"
              onPress={handleCreateFolder}
              loading={isCreatingFolder}
              disabled={!newFolderName.trim()}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoiding: {
    flex: 1,
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
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  folderDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  bodyInput: {
    minHeight: 160,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
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
    maxHeight: '80%',
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
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  folderOptionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  newFolderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  newFolderText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
