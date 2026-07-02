import { Card, CardState, ReviewRating } from '../types';

const MIN_EASE = 1.3;

export interface ScheduledCard {
  state: CardState;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lapses: number;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Math.max(0, days));
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDueDate(date: Date): string {
  return date.toISOString();
}

export function scheduleCard(card: Card, rating: ReviewRating): ScheduledCard {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let state: CardState = card.state;
  let easeFactor = card.easeFactor;
  let interval = card.interval;
  let repetitions = card.repetitions;
  let lapses = card.lapses;

  switch (rating) {
    case 'again': {
      repetitions = 0;
      state = 'relearning';
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      interval = 1;
      lapses += 1;
      break;
    }
    case 'hard': {
      if (card.state === 'new' || card.state === 'learning') {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      state = 'review';
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      repetitions += 1;
      break;
    }
    case 'good': {
      if (card.state === 'new' || card.state === 'learning' || card.state === 'relearning') {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      state = 'review';
      repetitions += 1;
      break;
    }
    case 'easy': {
      if (card.state === 'new' || card.state === 'learning' || card.state === 'relearning') {
        interval = 2;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
      }
      state = 'review';
      easeFactor = easeFactor + 0.15;
      repetitions += 1;
      break;
    }
  }

  const dueDate = formatDueDate(addDays(today, interval));

  return {
    state,
    easeFactor,
    interval,
    repetitions,
    dueDate,
    lapses,
  };
}
