import { useEffect } from 'react';
import { getDatabase, getFolders, getNotes, getCards } from '../services/database';
import { useAppStore } from '../store/appStore';

export function useDatabase() {
  const setFolders = useAppStore((state) => state.setFolders);
  const setNotes = useAppStore((state) => state.setNotes);
  const setCards = useAppStore((state) => state.setCards);
  const setLoading = useAppStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await getDatabase();
        const [folders, notes, cards] = await Promise.all([
          getFolders(),
          getNotes(),
          getCards(),
        ]);
        if (mounted) {
          setFolders(folders);
          setNotes(notes);
          setCards(cards);
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
  }, [setFolders, setNotes, setCards, setLoading]);
}
