import { Review, Card } from '../types';

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeRetention(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const recalled = reviews.filter((r) => r.rating === 'good' || r.rating === 'easy').length;
  return Math.round((recalled / reviews.length) * 100);
}

export function computeCurrentStreak(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  const days = new Set(reviews.map((r) => dateKey(r.reviewedAt)));
  const today = todayKey();
  let streak = 0;
  let check = new Date();

  // Start from today or yesterday if no reviews today
  const hasToday = days.has(today);
  if (!hasToday) {
    check.setDate(check.getDate() - 1);
  }

  while (true) {
    if (days.has(check.toISOString().slice(0, 10))) {
      streak += 1;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeStudyDaysLast7Days(reviews: Review[]): number {
  const days = new Set(reviews.map((r) => dateKey(r.reviewedAt)));
  let count = 0;
  const check = new Date();
  for (let i = 0; i < 7; i++) {
    if (days.has(check.toISOString().slice(0, 10))) {
      count += 1;
    }
    check.setDate(check.getDate() - 1);
  }
  return count;
}

export function computeHardestCards(cards: Card[], limit: number = 5): Card[] {
  return [...cards]
    .filter((c) => c.lapses > 0 || c.easeFactor < 2.2)
    .sort((a, b) => {
      if (b.lapses !== a.lapses) return b.lapses - a.lapses;
      return a.easeFactor - b.easeFactor;
    })
    .slice(0, limit);
}

export function computeTotalStudyTimeEstimate(reviews: Review[]): number {
  // Rough estimate: 20 seconds per review
  return Math.round((reviews.length * 20) / 60);
}
