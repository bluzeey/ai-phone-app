import { useCallback } from 'react';
import {
  createNote,
  deleteNote,
  updateNote,
  getNotes,
  searchNotes,
  getNote,
} from '../services/database';
import { deletePhoto } from '../services/storage';
import { useAppStore } from '../store/appStore';
import { CreateNoteInput, Note, UpdateNoteInput } from '../types';

export function useNotes() {
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const updateNoteInStore = useAppStore((state) => state.updateNoteInStore);
  const removeNote = useAppStore((state) => state.removeNote);
  const setNotes = useAppStore((state) => state.setNotes);

  const refresh = useCallback(async (folderId?: string) => {
    const data = await getNotes(folderId);
    setNotes(data);
    return data;
  }, [setNotes]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      const data = await getNotes();
      setNotes(data);
      return data;
    }
    const data = await searchNotes(query);
    setNotes(data);
    return data;
  }, [setNotes]);

  const add = useCallback(
    async (input: CreateNoteInput) => {
      const note = await createNote(input);
      addNote(note);
      return note;
    },
    [addNote]
  );

  const update = useCallback(
    async (id: string, input: UpdateNoteInput) => {
      await updateNote(id, input);
      const note = await getNote(id);
      if (note) {
        updateNoteInStore(note);
      }
      return note;
    },
    [updateNoteInStore]
  );

  const remove = useCallback(
    async (note: Note) => {
      await deleteNote(note.id);
      await deletePhoto(note.imageUri);
      removeNote(note.id);
    },
    [removeNote]
  );

  const toggleFavorite = useCallback(
    async (note: Note) => {
      return update(note.id, { isFavorite: !note.isFavorite });
    },
    [update]
  );

  return { notes, refresh, search, add, update, remove, toggleFavorite };
}
