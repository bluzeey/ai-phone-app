import { useCallback } from 'react';
import {
  createCard,
  deleteCard,
  updateCard,
  getCard,
  getCards,
  getCardsForNote,
  getDueCards,
} from '../services/database';
import { useAppStore } from '../store/appStore';
import { CreateCardInput, Card, UpdateCardInput } from '../types';

export function useCards() {
  const cards = useAppStore((state) => state.cards);
  const addCard = useAppStore((state) => state.addCard);
  const updateCardInStore = useAppStore((state) => state.updateCardInStore);
  const removeCard = useAppStore((state) => state.removeCard);
  const setCards = useAppStore((state) => state.setCards);

  const refresh = useCallback(async () => {
    const data = await getCards();
    setCards(data);
    return data;
  }, [setCards]);

  const refreshForNote = useCallback(async (noteId: string) => {
    const data = await getCardsForNote(noteId);
    useAppStore.setState((state) => ({
      cards: [...state.cards.filter((c: Card) => c.noteId !== noteId), ...data],
    }));
    return data;
  }, []);

  const add = useCallback(
    async (input: CreateCardInput) => {
      const card = await createCard(input);
      addCard(card);
      return card;
    },
    [addCard]
  );

  const update = useCallback(
    async (id: string, input: UpdateCardInput) => {
      await updateCard(id, input);
      const card = await getCard(id);
      if (card) {
        updateCardInStore(card);
      }
      return card;
    },
    [updateCardInStore]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteCard(id);
      removeCard(id);
    },
    [removeCard]
  );

  const dueCards = useCallback(
    async (folderId?: string) => {
      return getDueCards(folderId, { excludeSuspended: true });
    },
    []
  );

  return {
    cards,
    refresh,
    refreshForNote,
    add,
    update,
    remove,
    dueCards,
  };
}
