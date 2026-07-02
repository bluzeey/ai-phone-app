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
  imageUri: string;
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
  imageUri: string;
  extractedText: string;
  isFavorite?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  folderId?: string;
  imageUri?: string;
  extractedText?: string;
  isFavorite?: boolean;
}

export interface AiNoteResult {
  title: string;
  body: string;
  extractedText: string;
}
