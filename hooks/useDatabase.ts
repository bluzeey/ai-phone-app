import { useEffect } from 'react';
import { getDatabase, getFolders, getNotes } from '../services/database';
import { useAppStore } from '../store/appStore';

export function useDatabase() {
  const setFolders = useAppStore((state) => state.setFolders);
  const setNotes = useAppStore((state) => state.setNotes);
  const setLoading = useAppStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await getDatabase();
        const [folders, notes] = await Promise.all([getFolders(), getNotes()]);
        if (mounted) {
          setFolders(folders);
          setNotes(notes);
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setFolders, setNotes, setLoading]);
}
