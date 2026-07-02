import { Share } from 'react-native';
import { getDatabase } from './database';
import { Folder, Note, Card, Review } from '../types';

export interface BackupData {
  version: number;
  exportedAt: string;
  folders: Folder[];
  notes: Note[];
  cards: Card[];
  reviews: Review[];
}

function emptyIfNull(value: string | null | undefined): string {
  return value ?? '';
}

function booleanToInt(value: boolean): number {
  return value ? 1 : 0;
}

export async function exportAllData(): Promise<string> {
  const db = await getDatabase();
  const folders = await db.getAllAsync<Folder>('SELECT * FROM folders ORDER BY createdAt DESC');
  const notesRows = await db.getAllAsync<any>('SELECT * FROM notes ORDER BY createdAt DESC');
  const notes: Note[] = notesRows.map((row) => ({
    ...row,
    imageUri: row.imageUri || null,
    isFavorite: row.isFavorite === 1,
  }));
  const cardsRows = await db.getAllAsync<any>('SELECT * FROM cards ORDER BY createdAt DESC');
  const cards: Card[] = cardsRows.map((row) => ({
    ...row,
    suspended: row.suspended === 1,
  }));
  const reviews = await db.getAllAsync<Review>('SELECT * FROM reviews ORDER BY reviewedAt DESC');

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    notes,
    cards,
    reviews,
  };

  return JSON.stringify(data, null, 2);
}

export async function shareExport(): Promise<void> {
  const json = await exportAllData();
  await Share.share({
    title: 'Digital Notes backup',
    message: json,
  });
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function exportCardsToCsv(): Promise<string> {
  const db = await getDatabase();
  const cards = await db.getAllAsync<Card>('SELECT front, back, type, state, interval, dueDate, lapses FROM cards WHERE suspended = 0 ORDER BY createdAt DESC');

  const header = ['front', 'back', 'type', 'interval', 'dueDate', 'lapses'];
  const rows = cards.map((c) => [
    escapeCsv(c.front),
    escapeCsv(c.back),
    c.type,
    String(c.interval),
    c.dueDate.slice(0, 10),
    String(c.lapses),
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function shareCardsCsv(): Promise<void> {
  const csv = await exportCardsToCsv();
  await Share.share({
    title: 'Digital Notes flashcards',
    message: csv,
  });
}

export async function importAllData(jsonString: string): Promise<void> {
  let data: BackupData;
  try {
    data = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON backup.');
  }

  if (!data.folders || !Array.isArray(data.folders)) {
    throw new Error('Backup is missing folders.');
  }

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM reviews');
    await db.runAsync('DELETE FROM cards');
    await db.runAsync('DELETE FROM notes');
    await db.runAsync('DELETE FROM folders');

    for (const folder of data.folders) {
      await db.runAsync(
        `INSERT INTO folders (id, name, topic, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [folder.id, folder.name, folder.topic || null, folder.color, folder.createdAt, folder.updatedAt]
      );
    }

    for (const note of data.notes || []) {
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
          booleanToInt(note.isFavorite),
          note.createdAt,
          note.updatedAt,
        ]
      );
    }

    for (const card of data.cards || []) {
      await db.runAsync(
        `INSERT INTO cards (id, noteId, folderId, front, back, type, state, easeFactor, interval, repetitions, dueDate, lapses, suspended, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          card.id,
          card.noteId || null,
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
          booleanToInt(card.suspended),
          card.createdAt,
          card.updatedAt,
        ]
      );
    }

    for (const review of data.reviews || []) {
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
    }
  });
}
