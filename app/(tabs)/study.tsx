import { useMemo, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/appStore';
import { useReviews } from '../../hooks/useReviews';
import {
  getStudyMode,
  getStudyModeLabel,
  getDailyCap,
  StudyMode,
} from '../../services/studyPlan';
import {
  computeRetention,
  computeCurrentStreak,
  computeStudyDaysLast7Days,
  computeTotalStudyTimeEstimate,
} from '../../services/analytics';
import { BorderRadius, Colors, Spacing } from '../../constants/colors';
import { Card } from '../../types';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isDue(card: Card): boolean {
  if (card.suspended) return false;
  return new Date(card.dueDate) <= startOfToday();
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function Study() {
  const router = useRouter();
  const cards = useAppStore((state) => state.cards);
  const { reviews, allReviews, loadReviewsSince, loadAllReviews } = useReviews();

  const [studyMode, setStudyMode] = useState<StudyMode>('normal');

  const activeCards = useMemo(() => cards.filter((c) => !c.suspended), [cards]);
  const dueCards = useMemo(() => activeCards.filter(isDue), [activeCards]);
  const newCards = useMemo(
    () => activeCards.filter((c) => c.state === 'new'),
    [activeCards]
  );
  const weakCards = useMemo(
    () =>
      activeCards
        .filter((c) => c.lapses > 0 || c.easeFactor < 2.0)
        .sort((a, b) => b.lapses - a.lapses)
        .slice(0, 5),
    [activeCards]
  );

  const studiedToday = useMemo(() => {
    const today = startOfToday().toISOString();
    return reviews.filter((r) => r.reviewedAt >= today).length;
  }, [reviews]);

  const retention = useMemo(() => computeRetention(allReviews), [allReviews]);
  const streak = useMemo(() => computeCurrentStreak(allReviews), [allReviews]);
  const studyDays7 = useMemo(
    () => computeStudyDaysLast7Days(allReviews),
    [allReviews]
  );
  const studyMinutes = useMemo(
    () => computeTotalStudyTimeEstimate(allReviews),
    [allReviews]
  );

  useEffect(() => {
    const today = startOfToday();
    loadReviewsSince(today.toISOString());
    loadAllReviews();
    getStudyMode().then(setStudyMode);
  }, [loadReviewsSince, loadAllReviews]);

  const startReview = useCallback(() => {
    router.push('/review/session');
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Study</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeCards.length === 0 ? (
          <EmptyState
            title="No cards yet"
            subtitle="Create cards from a note to start reviewing."
            icon={<MaterialIcons name="school" size={64} color={Colors.textTertiary} />}
          />
        ) : (
          <>
            <View style={styles.modeCard}>
              <View>
                <Text style={styles.modeLabel}>Study mode</Text>
                <Text style={styles.modeValue}>{getStudyModeLabel(studyMode)}</Text>
              </View>
              <Text style={styles.modeCap}>Cap {getDailyCap(studyMode)}</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatNumber(dueCards.length)}</Text>
                <Text style={styles.statLabel}>Due today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatNumber(newCards.length)}</Text>
                <Text style={styles.statLabel}>New</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatNumber(streak)}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatNumber(studiedToday)}</Text>
                <Text style={styles.statLabel}>Studied today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{retention}%</Text>
                <Text style={styles.statLabel}>Retention</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatNumber(activeCards.length)}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>

            <Button
              title={
                studyMode === 'vacation'
                  ? 'Vacation mode on'
                  : dueCards.length > 0
                  ? `Review ${dueCards.length} cards`
                  : 'No cards due'
              }
              onPress={startReview}
              disabled={dueCards.length === 0 || studyMode === 'vacation'}
              style={styles.reviewButton}
              icon={<MaterialIcons name="play-arrow" size={20} color={Colors.surface} />}
            />

            {dueCards.length > 0 && activeCards.length > dueCards.length && (
              <Text style={styles.hint}>
                {activeCards.length - dueCards.length} cards are scheduled for future days.
              </Text>
            )}

            {weakCards.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cards causing pain</Text>
                {weakCards.map((card) => (
                  <View key={card.id} style={styles.weakCard}>
                    <Text style={styles.weakFront} numberOfLines={2}>
                      {card.front}
                    </Text>
                    <Text style={styles.weakMeta}>
                      {card.lapses} lapse{card.lapses === 1 ? '' : 's'} · ease {card.easeFactor.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.primary}12`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  modeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  modeCap: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  reviewButton: {
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  weakCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  weakFront: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  weakMeta: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
