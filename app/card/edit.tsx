import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useAppStore } from '../../store/appStore';
import { useCards } from '../../hooks/useCards';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { CardType } from '../../types';

export default function CardEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    cardId?: string;
    noteId?: string;
    folderId?: string;
  }>();

  const notes = useAppStore((state) => state.notes);
  const cards = useAppStore((state) => state.cards);
  const { add, update, remove } = useCards();

  const [isLoading, setIsLoading] = useState(true);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [type, setType] = useState<CardType>('basic');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(params.cardId);
  const existingCard = useMemo(
    () => cards.find((c) => c.id === params.cardId),
    [cards, params.cardId]
  );
  const note = useMemo(
    () => notes.find((n) => n.id === params.noteId),
    [notes, params.noteId]
  );
  const folderId = useMemo(() => {
    if (note) return note.folderId;
    if (params.folderId) return params.folderId;
    return existingCard?.folderId ?? null;
  }, [note, params.folderId, existingCard]);

  useEffect(() => {
    if (isEditing && existingCard) {
      setFront(existingCard.front);
      setBack(existingCard.back);
      setType(existingCard.type);
    }
    setIsLoading(false);
  }, [isEditing, existingCard]);

  const handleSave = useCallback(async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Both sides required', 'Please add a front and back for this card.');
      return;
    }
    if (!folderId) {
      Alert.alert('Folder required', 'Cannot create a card without a folder.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && existingCard) {
        await update(existingCard.id, { front, back, type });
        router.back();
      } else {
        await add({
          folderId,
          noteId: params.noteId ?? null,
          front,
          back,
          type,
        });
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [front, back, type, folderId, isEditing, existingCard, params.noteId, add, update, router]);

  const handleDelete = useCallback(() => {
    if (!existingCard) return;
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(existingCard.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Could not delete card.');
            }
          },
        },
      ]
    );
  }, [existingCard, remove, router]);

  if (isLoading) {
    return <Loading message="Loading card..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Card' : 'New Card'}
          </Text>
          <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {note && (
            <View style={styles.noteBadge}>
              <MaterialIcons name="note" size={16} color={Colors.primary} />
              <Text style={styles.noteBadgeText} numberOfLines={1}>
                From: {note.title}
              </Text>
            </View>
          )}

          <Input
            label="Front"
            placeholder="Question or prompt"
            value={front}
            onChangeText={setFront}
            autoFocus
          />

          <Input
            label="Back"
            placeholder="Answer"
            value={back}
            onChangeText={setBack}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.backInput}
          />

          <Text style={styles.label}>Card type</Text>
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setType('basic')}
              style={[styles.typeButton, type === 'basic' && styles.typeButtonActive]}
            >
              <Text style={[styles.typeButtonText, type === 'basic' && styles.typeButtonTextActive]}>
                Basic
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType('cloze')}
              style={[styles.typeButton, type === 'cloze' && styles.typeButtonActive]}
            >
              <Text style={[styles.typeButtonText, type === 'cloze' && styles.typeButtonTextActive]}>
                Cloze
              </Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Cloze cards hide the answer inline (e.g., “The capital of France is {'{{c1::Paris}}'}”).
          </Text>

          {isEditing && (
            <Button
              title="Delete Card"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  noteBadgeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  backInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.danger,
  },
});
