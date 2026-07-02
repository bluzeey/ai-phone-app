import { Card, ReviewRating } from '../types';
import { updateCardScheduling, createReview, getCard } from './database';
import { scheduleCard } from './scheduler';

export interface ReviewResult {
  card: Card;
  review: Awaited<ReturnType<typeof createReview>>;
}

export async function reviewCard(cardId: string, rating: ReviewRating): Promise<ReviewResult> {
  const card = await getCard(cardId);
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  const oldInterval = card.interval;
  const scheduled = scheduleCard(card, rating);

  await updateCardScheduling(card.id, {
    state: scheduled.state,
    easeFactor: scheduled.easeFactor,
    interval: scheduled.interval,
    repetitions: scheduled.repetitions,
    dueDate: scheduled.dueDate,
    lapses: scheduled.lapses,
  });

  const review = await createReview({
    cardId: card.id,
    rating,
    oldState: card.state,
    newState: scheduled.state,
    oldInterval,
    newInterval: scheduled.interval,
  });

  const updatedCard = await getCard(card.id);
  if (!updatedCard) {
    throw new Error(`Card disappeared after review: ${cardId}`);
  }

  return { card: updatedCard, review };
}
