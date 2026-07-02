export interface Folder {
  id: string;
  name: string;
  topic: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  body: string;
  imageUri: string | null;
  extractedText: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderInput {
  name: string;
  topic?: string;
  color?: string;
}

export interface CreateNoteInput {
  folderId: string;
  title: string;
  body: string;
  imageUri?: string | null;
  extractedText?: string;
  isFavorite?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  folderId?: string;
  imageUri?: string | null;
  extractedText?: string;
  isFavorite?: boolean;
}

export interface AiNoteResult {
  title: string;
  body: string;
  extractedText: string;
}

export type CardType = 'basic' | 'cloze';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface Card {
  id: string;
  noteId: string | null;
  folderId: string;
  front: string;
  back: string;
  type: CardType;
  state: CardState;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lapses: number;
  suspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  folderId: string;
  noteId?: string | null;
  front: string;
  back: string;
  type?: CardType;
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  type?: CardType;
  suspended?: boolean;
}

export interface Review {
  id: string;
  cardId: string;
  rating: ReviewRating;
  oldState: CardState;
  newState: CardState;
  oldInterval: number;
  newInterval: number;
  reviewedAt: string;
}

export interface CreateReviewInput {
  cardId: string;
  rating: ReviewRating;
  oldState: CardState;
  newState: CardState;
  oldInterval: number;
  newInterval: number;
}
