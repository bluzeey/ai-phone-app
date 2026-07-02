import { useCallback } from 'react';
import {
  createFolder,
  deleteFolder,
  updateFolder,
  getFolders,
  getNoteCount,
} from '../services/database';
import { deletePhoto } from '../services/storage';
import { useAppStore } from '../store/appStore';
import { CreateFolderInput, Folder } from '../types';

export function useFolders() {
  const folders = useAppStore((state) => state.folders);
  const addFolder = useAppStore((state) => state.addFolder);
  const updateFolderInStore = useAppStore((state) => state.updateFolderInStore);
  const removeFolder = useAppStore((state) => state.removeFolder);
  const setFolders = useAppStore((state) => state.setFolders);

  const refresh = useCallback(async () => {
    const data = await getFolders();
    setFolders(data);
    return data;
  }, [setFolders]);

  const add = useCallback(
    async (input: CreateFolderInput) => {
      const folder = await createFolder(input);
      addFolder(folder);
      return folder;
    },
    [addFolder]
  );

  const update = useCallback(
    async (id: string, input: Partial<CreateFolderInput>) => {
      await updateFolder(id, input);
      const data = await getFolders();
      setFolders(data);
    },
    [setFolders]
  );

  const remove = useCallback(
    async (folder: Folder) => {
      const notes = useAppStore.getState().notes.filter((n) => n.folderId === folder.id);
      await deleteFolder(folder.id);
      await Promise.all(notes.map((n) => deletePhoto(n.imageUri)));
      removeFolder(folder.id);
    },
    [removeFolder]
  );

  const countNotes = useCallback(async (folderId: string) => {
    return getNoteCount(folderId);
  }, []);

  return { folders, refresh, add, update, remove, countNotes };
}
