import { create } from 'zustand';
import { Folder, Note, Card } from '../types';

interface AppState {
  folders: Folder[];
  notes: Note[];
  cards: Card[];
  isLoading: boolean;
  searchQuery: string;
  setFolders: (folders: Folder[]) => void;
  setNotes: (notes: Note[]) => void;
  setCards: (cards: Card[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolderInStore: (folder: Folder) => void;
  removeFolder: (id: string) => void;
  addNote: (note: Note) => void;
  updateNoteInStore: (note: Note) => void;
  removeNote: (id: string) => void;
  addCard: (card: Card) => void;
  updateCardInStore: (card: Card) => void;
  removeCard: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  folders: [],
  notes: [],
  cards: [],
  isLoading: true,
  searchQuery: '',

  setFolders: (folders) => set({ folders }),
  setNotes: (notes) => set({ notes }),
  setCards: (cards) => set({ cards }),

  addFolder: (folder) =>
    set((state) => ({
      folders: [folder, ...state.folders],
    })),

  updateFolderInStore: (folder) =>
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
    })),

  removeFolder: (id) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      notes: state.notes.filter((n) => n.folderId !== id),
      cards: state.cards.filter((c) => c.folderId !== id),
    })),

  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  updateNoteInStore: (note) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === note.id ? note : n)),
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      cards: state.cards.filter((c) => c.noteId !== id),
    })),

  addCard: (card) =>
    set((state) => ({
      cards: [card, ...state.cards],
    })),

  updateCardInStore: (card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    })),

  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
