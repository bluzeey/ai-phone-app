import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { Folder, Note, CreateFolderInput, CreateNoteInput, UpdateNoteInput } from '../types';

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
      imageUri TEXT NOT NULL,
      extractedText TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folderId);
    CREATE INDEX IF NOT EXISTS idx_notes_search ON notes(title, extractedText);
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
    imageUri: input.imageUri,
    extractedText: input.extractedText.trim(),
    isFavorite: input.isFavorite ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO notes (id, folderId, title, body, imageUri, extractedText, isFavorite, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [note.id, note.folderId, note.title, note.body, note.imageUri, note.extractedText, note.isFavorite ? 1 : 0, note.createdAt, note.updatedAt]
  );

  return note;
}

export async function getNotes(folderId?: string): Promise<Note[]> {
  const db = await getDatabase();
  if (folderId) {
    return db.getAllAsync<Note>(
      `SELECT * FROM notes WHERE folderId = ? ORDER BY isFavorite DESC, updatedAt DESC`,
      [folderId]
    );
  }
  return db.getAllAsync<Note>(
    `SELECT * FROM notes ORDER BY isFavorite DESC, updatedAt DESC`
  );
}

export async function searchNotes(query: string): Promise<Note[]> {
  const db = await getDatabase();
  const like = `%${query.trim()}%`;
  return db.getAllAsync<Note>(
    `SELECT * FROM notes WHERE title LIKE ? OR extractedText LIKE ? OR body LIKE ?
     ORDER BY isFavorite DESC, updatedAt DESC`,
    [like, like, like]
  );
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Note>(`SELECT * FROM notes WHERE id = ?`, [id]);
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
    values.push(input.imageUri);
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
  return db.getAllAsync<Note>(
    `SELECT * FROM notes ORDER BY updatedAt DESC LIMIT ?`,
    [limit]
  );
}
