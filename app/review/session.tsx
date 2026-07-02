import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Vibration,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppStore } from '../../store/appStore';
import { getDueCards } from '../../services/database';
import { reviewCard } from '../../services/reviews';
import {
  getStudyMode,
  applyStudyMode,
  getStudyModeMessage,
  StudyMode,
} from '../../services/studyPlan';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { Card, ReviewRating } from '../../types';

export default function ReviewSession() {
  const router = useRouter();
  const updateCardInStore = useAppStore((state) => state.updateCardInStore);

  const [isLoading, setIsLoading] = useState(true);
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('normal');
  const [capMessage, setCapMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([getStudyMode(), getDueCards(undefined, { excludeSuspended: true })])
      .then(([mode, cards]) => {
        if (!mounted) return;
        setStudyMode(mode);
        const capped = applyStudyMode(cards, mode);
        setCapMessage(getStudyModeMessage(mode, cards.length));
        setQueue(capped);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentCard = queue[index];
  const progress = useMemo(
    () => `${Math.min(index + 1, queue.length)} / ${queue.length}`,
    [index, queue.length]
  );

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard || isSubmitting) return;
      setIsSubmitting(true);

      try {
        Vibration.vibrate(10);
        const { card } = await reviewCard(currentCard.id, rating);
        updateCardInStore(card);

        setCounts((prev) => ({
          ...prev,
          [rating]: prev[rating] + 1,
        }));

        setRevealed(false);
        setIndex((prev) => prev + 1);
      } catch (error) {
        Alert.alert('Error', 'Could not record your review.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, updateCardInStore]
  );

  const handleFinish = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return <Loading message="Loading cards..." />;
  }

  if (queue.length === 0) {
    const title = studyMode === 'vacation' ? 'Vacation mode' : 'All caught up';
    const subtitle = capMessage ?? 'You have no cards due today. Great work.';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Review</Text>
          <View style={styles.iconButton} />
        </View>
        <EmptyState
          title={title}
          subtitle={subtitle}
          icon={<MaterialIcons name="check-circle" size={64} color={Colors.success} />}
        />
      </SafeAreaView>
    );
  }

  if (index >= queue.length) {
    const total = queue.length;
    const correct = counts.good + counts.easy;
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Session complete</Text>
        </View>

        <View style={styles.summary}>
          <MaterialIcons name="emoji-events" size={64} color={Colors.warning} />
          <Text style={styles.summaryTitle}>You reviewed {total} cards</Text>
          <Text style={styles.summarySubtitle}>
            {correct} recalled smoothly · {counts.again + counts.hard} need more practice
          </Text>

          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countValue}>{counts.again}</Text>
              <Text style={styles.countLabel}>Again</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countValue}>{counts.hard}</Text>
              <Text style={styles.countLabel}>Hard</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countValue}>{counts.good}</Text>
              <Text style={styles.countLabel}>Good</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countValue}>{counts.easy}</Text>
              <Text style={styles.countLabel}>Easy</Text>
            </View>
          </View>

          <Pressable onPress={handleFinish} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>{progress}</Text>
        <View style={styles.iconButton} />
      </View>

      {capMessage && <Text style={styles.capMessage}>{capMessage}</Text>}

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardType}>{currentCard.type === 'cloze' ? 'Cloze' : 'Basic'}</Text>
          <Text style={styles.cardFront}>{currentCard.front}</Text>

          {revealed && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardBack}>{currentCard.back}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        {!revealed ? (
          <Pressable onPress={handleReveal} style={styles.revealButton}>
            <Text style={styles.revealButtonText}>Show answer</Text>
          </Pressable>
        ) : (
          <View style={styles.ratingRow}>
            <Pressable onPress={() => handleRate('again')} style={[styles.ratingButton, styles.againButton]}>
              <Text style={styles.ratingTitle}>Again</Text>
              <Text style={styles.ratingSubtitle}>1d</Text>
            </Pressable>
            <Pressable onPress={() => handleRate('hard')} style={[styles.ratingButton, styles.hardButton]}>
              <Text style={styles.ratingTitle}>Hard</Text>
              <Text style={styles.ratingSubtitle}>~1d</Text>
            </Pressable>
            <Pressable onPress={() => handleRate('good')} style={[styles.ratingButton, styles.goodButton]}>
              <Text style={styles.ratingTitle}>Good</Text>
              <Text style={styles.ratingSubtitle}>schedule</Text>
            </Pressable>
            <Pressable onPress={() => handleRate('easy')} style={[styles.ratingButton, styles.easyButton]}>
              <Text style={styles.ratingTitle}>Easy</Text>
              <Text style={styles.ratingSubtitle}>longer</Text>
            </Pressable>
          </View>
        )}
      </View>
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
  capMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    minHeight: 260,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.xl,
  },
  cardFront: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  cardBack: {
    fontSize: 20,
    color: Colors.textSecondary,
    lineHeight: 28,
    textAlign: 'center',
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  revealButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  revealButtonText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  againButton: {
    backgroundColor: Colors.danger,
  },
  hardButton: {
    backgroundColor: Colors.warning,
  },
  goodButton: {
    backgroundColor: Colors.primary,
  },
  easyButton: {
    backgroundColor: Colors.success,
  },
  ratingTitle: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  ratingSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  countRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  countBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    minWidth: 64,
  },
  countValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
  },
  doneButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
