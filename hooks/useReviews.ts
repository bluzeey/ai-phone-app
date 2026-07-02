import { useCallback, useState } from 'react';
import { getReviewsSince, getReviewCount, getAllReviews } from '../services/database';
import { Review } from '../types';

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [count, setCount] = useState(0);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const loadReviewsSince = useCallback(async (since: string) => {
    const data = await getReviewsSince(since);
    setReviews(data);
    return data;
  }, []);

  const loadAllReviews = useCallback(async () => {
    const data = await getAllReviews();
    setAllReviews(data);
    return data;
  }, []);

  const loadReviewCount = useCallback(async () => {
    const total = await getReviewCount();
    setCount(total);
    return total;
  }, []);

  return {
    reviews,
    allReviews,
    count,
    loadReviewsSince,
    loadAllReviews,
    loadReviewCount,
  };
}
