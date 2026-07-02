import { Directory, File, Paths } from 'expo-file-system';

const NOTES_DIR = new Directory(Paths.document, 'notes');

export async function ensureNotesDirectory(): Promise<Directory> {
  NOTES_DIR.create({ intermediates: true, idempotent: true });
  return NOTES_DIR;
}

export async function savePhoto(uri: string): Promise<string> {
  await ensureNotesDirectory();
  const filename = `photo_${Date.now()}.jpg`;
  const sourceFile = new File(uri);
  const destinationFile = NOTES_DIR.createFile(filename, 'image/jpeg');
  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

export async function deletePhoto(uri: string): Promise<void> {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete photo:', error);
  }
}

export async function photoUriToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}
