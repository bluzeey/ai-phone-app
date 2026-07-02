import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import {
  Folder,
  Note,
  CreateFolderInput,
  CreateNoteInput,
  UpdateNoteInput,
  Card,
  CreateCardInput,
  UpdateCardInput,
  Review,
  CreateReviewInput,
  CardType,
  CardState,
} from '../types';

const DB_NAME = 'digitalnotes.db';

let database: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!database) {
    database = await openDatabaseAsync(DB_NAME);
    await migrate(database);
  }
  return database;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      topic TEXT,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      folderId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      imageUri TEXT NOT NULL DEFAULT '',
      extractedText TEXT NOT NULL DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      noteId TEXT,
      folderId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'basic',
      state TEXT NOT NULL DEFAULT 'new',
      easeFactor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      dueDate TEXT NOT NULL,
      lapses INTEGER NOT NULL DEFAULT 0,
      suspended INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE SET NULL,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY NOT NULL,
      cardId TEXT NOT NULL,
      rating TEXT NOT NULL,
      oldState TEXT NOT NULL,
      newState TEXT NOT NULL,
      oldInterval INTEGER NOT NULL,
      newInterval INTEGER NOT NULL,
      reviewedAt TEXT NOT NULL,
      FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folderId);
    CREATE INDEX IF NOT EXISTS idx_notes_search ON notes(title, extractedText);
    CREATE INDEX IF NOT EXISTS idx_cards_note ON cards(noteId);
    CREATE INDEX IF NOT EXISTS idx_cards_folder ON cards(folderId);
    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(dueDate, suspended);
    CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(cardId);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewedAt ON reviews(reviewedAt);
  `);
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function nullIfEmpty(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  return value;
}

function emptyIfNull(value: string | null | undefined): string {
  return value ?? '';
}

// Folders

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = nowIso();
  const folder: Folder = {
    id,
    name: input.name.trim(),
    topic: input.topic?.trim() || null,
    color: input.color || '#007AFF',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO folders (id, name, topic, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [folder.id, folder.name, folder.topic, folder.color, folder.createdAt, folder.updatedAt]
  );

  return folder;
}

export async function getFolders(): Promise<Folder[]> {
  const db = await getDatabase();
  return db.getAllAsync<Folder>(
    `SELECT * FROM folders ORDER BY updatedAt DESC`
  );
}

export async function getFolder(id: string): Promise<Folder | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Folder>(`SELECT * FROM folders WHERE id = ?`, [id]);
}

export async function updateFolder(id: string, input: Partial<CreateFolderInput>): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (input.name !== undefined) {
    sets.push('name = ?');
    values.push(input.name.trim());
  }
  if (input.topic !== undefined) {
    sets.push('topic = ?');
    values.push(input.topic.trim() || null);
  }
  if (input.color !== undefined) {
    sets.push('color = ?');
    values.push(input.color);
  }

  if (sets.length === 0) return;

  sets.push('updatedAt = ?');
  values.push(nowIso());
  values.push(id);

  await db.runAsync(
    `UPDATE folders SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM folders WHERE id = ?`, [id]);
}

// Notes

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = nowIso();
  const note: Note = {
    id,
    folderId: input.folderId,
    title: input.title.trim(),
    body: input.body.trim(),
    imageUri: nullIfEmpty(input.imageUri),
    extractedText: input.extractedText?.trim() || '',
    isFavorite: input.isFavorite ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO notes (id, folderId, title, body, imageUri, extractedText, isFavorite, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.folderId,
      note.title,
      note.body,
      emptyIfNull(note.imageUri),
      note.extractedText,
      note.isFavorite ? 1 : 0,
      note.createdAt,
      note.updatedAt,
    ]
  );

  return note;
}

function noteFromRow(row: any): Note {
  return {
    ...row,
    imageUri: nullIfEmpty(row.imageUri),
    isFavorite: row.isFavorite === 1,
  };
}

export async function getNotes(folderId?: string): Promise<Note[]> {
  const db = await getDatabase();
  if (folderId) {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM notes WHERE folderId = ? ORDER BY isFavorite DESC, updatedAt DESC`,
      [folderId]
    );
    return rows.map(noteFromRow);
  }
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM notes ORDER BY isFavorite DESC, updatedAt DESC`
  );
  return rows.map(noteFromRow);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const db = await getDatabase();
  const like = `%${query.trim()}%`;
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM notes WHERE title LIKE ? OR extractedText LIKE ? OR body LIKE ?
     ORDER BY isFavorite DESC, updatedAt DESC`,
    [like, like, like]
  );
  return rows.map(noteFromRow);
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`SELECT * FROM notes WHERE id = ?`, [id]);
  return row ? noteFromRow(row) : null;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    sets.push('title = ?');
    values.push(input.title.trim());
  }
  if (input.body !== undefined) {
    sets.push('body = ?');
    values.push(input.body.trim());
  }
  if (input.extractedText !== undefined) {
    sets.push('extractedText = ?');
    values.push(input.extractedText.trim());
  }
  if (input.imageUri !== undefined) {
    sets.push('imageUri = ?');
    values.push(emptyIfNull(input.imageUri));
  }
  if (input.folderId !== undefined) {
    sets.push('folderId = ?');
    values.push(input.folderId);
  }
  if (input.isFavorite !== undefined) {
    sets.push('isFavorite = ?');
    values.push(input.isFavorite ? 1 : 0);
  }

  if (sets.length === 0) return;

  sets.push('updatedAt = ?');
  values.push(nowIso());
  values.push(id);

  await db.runAsync(
    `UPDATE notes SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
}

export async function getNoteCount(folderId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM notes WHERE folderId = ?`,
    [folderId]
  );
  return row?.count ?? 0;
}

export async function getRecentNotes(limit: number = 5): Promise<Note[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM notes ORDER BY updatedAt DESC LIMIT ?`,
    [limit]
  );
  return rows.map(noteFromRow);
}

// Cards

function cardFromRow(row: any): Card {
  return {
    ...row,
    type: row.type as CardType,
    state: row.state as CardState,
    suspended: row.suspended === 1,
  };
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = nowIso();
  const card: Card = {
    id,
    noteId: input.noteId ?? null,
    folderId: input.folderId,
    front: input.front.trim(),
    back: input.back.trim(),
    type: input.type ?? 'basic',
    state: 'new',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: todayIso(),
    lapses: 0,
    suspended: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO cards (id, noteId, folderId, front, back, type, state, easeFactor, interval, repetitions, dueDate, lapses, suspended, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      card.noteId,
      card.folderId,
      card.front,
      card.back,
      card.type,
      card.state,
      card.easeFactor,
      card.interval,
      card.repetitions,
      card.dueDate,
      card.lapses,
      card.suspended ? 1 : 0,
      card.createdAt,
      card.updatedAt,
    ]
  );

  return card;
}

export async function getCard(id: string): Promise<Card | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`SELECT * FROM cards WHERE id = ?`, [id]);
  return row ? cardFromRow(row) : null;
}

export async function getCards(folderId?: string): Promise<Card[]> {
  const db = await getDatabase();
  if (folderId) {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM cards WHERE folderId = ? ORDER BY createdAt DESC`,
      [folderId]
    );
    return rows.map(cardFromRow);
  }
  const rows = await db.getAllAsync<any>(`SELECT * FROM cards ORDER BY createdAt DESC`);
  return rows.map(cardFromRow);
}

export async function getCardsForNote(noteId: string): Promise<Card[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM cards WHERE noteId = ? ORDER BY createdAt DESC`,
    [noteId]
  );
  return rows.map(cardFromRow);
}

export async function getDueCards(
  folderId?: string,
  options: { dueBefore?: string; excludeSuspended?: boolean } = {}
): Promise<Card[]> {
  const db = await getDatabase();
  const dueBefore = options.dueBefore ?? todayIso();
  let query = `SELECT * FROM cards WHERE dueDate <= ?`;
  const params: (string | number)[] = [dueBefore];

  if (folderId) {
    query += ` AND folderId = ?`;
    params.push(folderId);
  }
  if (options.excludeSuspended !== false) {
    query += ` AND suspended = 0`;
  }
  query += ` ORDER BY createdAt ASC`;

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(cardFromRow);
}

export async function getCardCount(folderId?: string): Promise<number> {
  const db = await getDatabase();
  let query = `SELECT COUNT(*) as count FROM cards`;
  const params: string[] = [];
  if (folderId) {
    query += ` WHERE folderId = ?`;
    params.push(folderId);
  }
  const row = await db.getFirstAsync<{ count: number }>(query, params);
  return row?.count ?? 0;
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<void> {
  const db = await getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.front !== undefined) {
    sets.push('front = ?');
    values.push(input.front.trim());
  }
  if (input.back !== undefined) {
    sets.push('back = ?');
    values.push(input.back.trim());
  }
  if (input.type !== undefined) {
    sets.push('type = ?');
    values.push(input.type);
  }
  if (input.suspended !== undefined) {
    sets.push('suspended = ?');
    values.push(input.suspended ? 1 : 0);
  }

  if (sets.length === 0) return;

  sets.push('updatedAt = ?');
  values.push(nowIso());
  values.push(id);

  await db.runAsync(
    `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export interface CardSchedulingUpdate {
  state: CardState;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lapses?: number;
}

export async function updateCardScheduling(id: string, update: CardSchedulingUpdate): Promise<void> {
  const db = await getDatabase();
  const sets = [
    'state = ?',
    'easeFactor = ?',
    'interval = ?',
    'repetitions = ?',
    'dueDate = ?',
    'updatedAt = ?',
  ];
  const values: (string | number)[] = [
    update.state,
    update.easeFactor,
    update.interval,
    update.repetitions,
    update.dueDate,
    nowIso(),
  ];

  if (update.lapses !== undefined) {
    sets.push('lapses = ?');
    values.push(update.lapses);
  }

  values.push(id);

  await db.runAsync(
    `UPDATE cards SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM cards WHERE id = ?`, [id]);
}

// Reviews

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const db = await getDatabase();
  const id = generateId();
  const review: Review = {
    id,
    cardId: input.cardId,
    rating: input.rating,
    oldState: input.oldState,
    newState: input.newState,
    oldInterval: input.oldInterval,
    newInterval: input.newInterval,
    reviewedAt: nowIso(),
  };

  await db.runAsync(
    `INSERT INTO reviews (id, cardId, rating, oldState, newState, oldInterval, newInterval, reviewedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      review.id,
      review.cardId,
      review.rating,
      review.oldState,
      review.newState,
      review.oldInterval,
      review.newInterval,
      review.reviewedAt,
    ]
  );

  return review;
}

export async function getReviewsForCard(cardId: string): Promise<Review[]> {
  const db = await getDatabase();
  return db.getAllAsync<Review>(
    `SELECT * FROM reviews WHERE cardId = ? ORDER BY reviewedAt DESC`,
    [cardId]
  );
}

export async function getReviewCount(cardId?: string): Promise<number> {
  const db = await getDatabase();
  if (cardId) {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM reviews WHERE cardId = ?`,
      [cardId]
    );
    return row?.count ?? 0;
  }
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM reviews`);
  return row?.count ?? 0;
}

export async function getReviewsSince(since: string): Promise<Review[]> {
  const db = await getDatabase();
  return db.getAllAsync<Review>(
    `SELECT * FROM reviews WHERE reviewedAt >= ? ORDER BY reviewedAt DESC`,
    [since]
  );
}

export async function getAllReviews(): Promise<Review[]> {
  const db = await getDatabase();
  return db.getAllAsync<Review>(`SELECT * FROM reviews ORDER BY reviewedAt DESC`);
}
