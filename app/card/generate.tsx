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
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppStore } from '../../store/appStore';
import { useCards } from '../../hooks/useCards';
import { generateCardsFromNote, AICardProposal } from '../../services/aiCards';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';

interface ProposalState extends AICardProposal {
  id: string;
  approved: boolean;
}

export default function GenerateCards() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const notes = useAppStore((state) => state.notes);
  const folders = useAppStore((state) => state.folders);
  const { add } = useCards();

  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);
  const folder = useMemo(
    () => folders.find((f) => f.id === note?.folderId),
    [folders, note]
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [proposals, setProposals] = useState<ProposalState[]>([]);

  const apiKey = process.env.EXPO_PUBLIC_UMANS_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey.startsWith('sk-'));

  const approvedCount = useMemo(
    () => proposals.filter((p) => p.approved).length,
    [proposals]
  );

  useEffect(() => {
    if (!note || !hasApiKey) return;

    let cancelled = false;
    setIsGenerating(true);

    generateCardsFromNote(note.title, note.body, note.extractedText)
      .then((items) => {
        if (cancelled) return;
        setProposals(
          items.map((item, index) => ({
            ...item,
            id: `${Date.now()}-${index}`,
            approved: true,
          }))
        );
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not generate cards.';
        Alert.alert('AI Generation Failed', message);
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [note, hasApiKey]);

  const toggleApproval = useCallback((id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, approved: !p.approved } : p))
    );
  }, []);

  const setAll = useCallback((approved: boolean) => {
    setProposals((prev) => prev.map((p) => ({ ...p, approved })));
  }, []);

  const updateProposal = useCallback((id: string, field: 'front' | 'back', value: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!note) return;
    const approved = proposals.filter((p) => p.approved);
    if (approved.length === 0) {
      Alert.alert('No cards selected', 'Approve at least one card to save.');
      return;
    }

    setIsSaving(true);
    try {
      for (const proposal of approved) {
        await add({
          folderId: note.folderId,
          noteId: note.id,
          front: proposal.front,
          back: proposal.back,
          type: proposal.type,
        });
      }
      router.replace(`/note/${note.id}`);
    } catch (error) {
      Alert.alert('Error', 'Could not save all cards. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [note, proposals, add, router]);

  if (!note) {
    return <Loading message="Loading note..." />;
  }

  if (!hasApiKey) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Generate Cards</Text>
          <View style={styles.iconButton} />
        </View>
        <EmptyState
          title="AI key missing"
          subtitle="Add EXPO_PUBLIC_UMANS_API_KEY to your .env file to generate flashcards with AI, or create cards manually."
          icon={<MaterialIcons name="vpn-key" size={64} color={Colors.textTertiary} />}
        />
      </SafeAreaView>
    );
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
          <Text style={styles.headerTitle}>Generated Cards</Text>
          <Pressable onPress={handleSave} disabled={isSaving || isGenerating} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : `Save ${approvedCount}`}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBar}>
          <Text style={styles.infoText} numberOfLines={1}>
            From: {note.title}
          </Text>
          <View style={styles.infoActions}>
            <Pressable onPress={() => setAll(true)} style={styles.infoAction}>
              <Text style={styles.infoActionText}>Approve all</Text>
            </Pressable>
            <Pressable onPress={() => setAll(false)} style={styles.infoAction}>
              <Text style={styles.infoActionText}>Reject all</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {isGenerating ? (
            <Loading message="Making flashcards..." />
          ) : proposals.length === 0 ? (
            <EmptyState
              title="No cards generated"
              subtitle="Try editing the note to make the content clearer, or add cards manually."
              icon={<MaterialIcons name="style" size={64} color={Colors.textTertiary} />}
            />
          ) : (
            proposals.map((proposal) => (
              <View key={proposal.id} style={[styles.proposal, !proposal.approved && styles.proposalRejected]}>
                <View style={styles.proposalHeader}>
                  <Pressable
                    onPress={() => toggleApproval(proposal.id)}
                    style={styles.approvalButton}
                  >
                    <MaterialIcons
                      name={proposal.approved ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={proposal.approved ? Colors.success : Colors.textTertiary}
                    />
                  </Pressable>
                  <Text style={styles.proposalType}>{proposal.type}</Text>
                </View>

                <Input
                  label="Front"
                  placeholder="Question"
                  value={proposal.front}
                  onChangeText={(text) => updateProposal(proposal.id, 'front', text)}
                  style={styles.compactInput}
                />
                <Input
                  label="Back"
                  placeholder="Answer"
                  value={proposal.back}
                  onChangeText={(text) => updateProposal(proposal.id, 'back', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={styles.compactInput}
                />

                {proposal.rationale ? (
                  <Text style={styles.rationale}>{proposal.rationale}</Text>
                ) : null}
              </View>
            ))
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
  infoBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
  },
  infoActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoAction: {
    paddingVertical: Spacing.xs,
  },
  infoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  proposal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proposalRejected: {
    opacity: 0.6,
    backgroundColor: Colors.background,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  approvalButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposalType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  compactInput: {
    marginBottom: Spacing.sm,
  },
  rationale: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
});
