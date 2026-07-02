import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { Card } from '../types';

export type StudyMode = 'normal' | 'light' | 'catchup' | 'vacation' | 'minimum';

export const STUDY_MODES: StudyMode[] = ['normal', 'light', 'catchup', 'minimum', 'vacation'];

const STUDY_MODE_KEY = 'digitalnotes_study_mode';

export function getDailyCap(mode: StudyMode): number {
  switch (mode) {
    case 'light':
      return 15;
    case 'catchup':
      return 40;
    case 'vacation':
      return 0;
    case 'minimum':
      return 5;
    case 'normal':
    default:
      return 50;
  }
}

export function getStudyModeLabel(mode: StudyMode): string {
  switch (mode) {
    case 'light':
      return 'Light day';
    case 'catchup':
      return 'Catch-up';
    case 'vacation':
      return 'Vacation mode';
    case 'minimum':
      return 'Minimum viable';
    case 'normal':
    default:
      return 'Normal';
  }
}

export function getStudyModeDescription(mode: StudyMode): string {
  switch (mode) {
    case 'light':
      return 'About 15 cards — small wins on busy days.';
    case 'catchup':
      return 'Up to 40 cards — chip away at a backlog.';
    case 'vacation':
      return 'Pause all reviews until you turn this off.';
    case 'minimum':
      return 'Just 5 cards to keep the streak alive.';
    case 'normal':
    default:
      return 'Full daily schedule, capped at 50 cards.';
  }
}

export async function getStudyMode(): Promise<StudyMode> {
  const value = await getItemAsync(STUDY_MODE_KEY);
  if (
    value === 'normal' ||
    value === 'light' ||
    value === 'catchup' ||
    value === 'vacation' ||
    value === 'minimum'
  ) {
    return value;
  }
  return 'normal';
}

export async function setStudyMode(mode: StudyMode): Promise<void> {
  await setItemAsync(STUDY_MODE_KEY, mode);
}

export function applyStudyMode(cards: Card[], mode: StudyMode): Card[] {
  const cap = getDailyCap(mode);
  if (mode === 'vacation') {
    return [];
  }
  return cards.slice(0, cap);
}

export function getStudyModeMessage(mode: StudyMode, dueCount: number): string | null {
  const cap = getDailyCap(mode);
  if (mode === 'vacation') {
    return 'Vacation mode is on. No reviews today.';
  }
  if (dueCount > cap) {
    return `Study mode is ${getStudyModeLabel(mode)}. Showing ${cap} of ${dueCount} due cards.`;
  }
  return null;
}
