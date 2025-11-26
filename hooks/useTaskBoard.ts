import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { TaskColumn, TaskCard } from '../types';
import { INITIAL_COLUMNS } from '../constants';

interface UseTaskBoardProps {
    initialData: {
        columns: TaskColumn[];
    } | null;
}

export const useTaskBoard = ({ initialData }: UseTaskBoardProps) => {
    const [columns, setColumns] = useState<TaskColumn[]>(INITIAL_COLUMNS);
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
    const [justUpdatedCardId, setJustUpdatedCardId] = useState<string | null>(null);
    const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

    // Sync with initial data
    useEffect(() => {
        if (initialData) {
            setColumns(initialData.columns);
        }
    }, [initialData]);

    const triggerUpdateAnimation = useCallback((cardId: string) => {
        setJustUpdatedCardId(cardId);
        setTimeout(() => setJustUpdatedCardId(null), 1000);
    }, []);

    const moveTaskCard = useCallback(async (cardId: string, fromColumnId: string, toColumnId: string, destinationIndex: number) => {
        const previousColumns = columns;
        setColumns(prev => {
            const newCols = prev.map(c => ({ ...c, cards: [...c.cards] }));
            const fromCol = newCols.find(c => c.id === fromColumnId);
            const toCol = newCols.find(c => c.id === toColumnId);
            if (!fromCol || !toCol) return prev;

            const cardIndex = fromCol.cards.findIndex(c => c.id === cardId);
            if (cardIndex < 0) return prev;

            const [card] = fromCol.cards.splice(cardIndex, 1);
            toCol.cards.splice(destinationIndex, 0, card);

            return newCols;
        });

        try {
            await api.tasks.moveTask(cardId, toColumnId, destinationIndex);
        } catch (error) {
            console.error('Failed to move task:', error);
            setColumns(previousColumns);
        }
    }, [columns]);

    const addCard = useCallback(async (columnId: string, content: string) => {
        const newCard: TaskCard = { id: crypto.randomUUID(), content, labels: [], checklist: [], attachments: [], dependencies: [] };
        setColumns(cols => cols.map(col => col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col));
        try {
            await api.tasks.createTask(newCard, columnId);
        } catch (error) {
            console.error('Failed to create task:', error);
            setColumns(cols => cols.map(col => col.id === columnId ? { ...col, cards: col.cards.filter(c => c.id !== newCard.id) } : col));
        }
    }, []);

    const addColumn = useCallback(async (title: string) => {
        const newColumn: TaskColumn = { id: crypto.randomUUID(), title, cards: [] };
        setColumns(cols => [...cols, newColumn]);
        try {
            await api.columns.create(newColumn);
        } catch (error) {
            console.error('Failed to create column:', error);
            setColumns(cols => cols.filter(col => col.id !== newColumn.id));
        }
    }, []);

    const deleteColumn = useCallback(async (columnId: string) => {
        const previousColumns = columns;
        setColumns(cols => cols.filter(col => col.id !== columnId));
        try {
            await api.columns.delete(columnId);
        } catch (error) {
            console.error('Failed to delete column:', error);
            setColumns(previousColumns);
        }
    }, [columns]);

    const updateColumnTitle = useCallback(async (columnId: string, newTitle: string) => {
        setColumns(cols => cols.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
        try {
            await api.columns.update(columnId, { title: newTitle });
        } catch (error) {
            console.error('Failed to update column title:', error);
        }
    }, []);

    const reorderColumns = useCallback(async (startIndex: number, endIndex: number) => {
        setColumns(cols => {
            const newCols = Array.from(cols);
            const [removed] = newCols.splice(startIndex, 1);
            newCols.splice(endIndex, 0, removed);
            return newCols;
        });
    }, []);

    const updateTaskDetails = useCallback(async (cardId: string, columnId: string, updatedProperties: Partial<TaskCard>) => {
        setColumns(cols => cols.map(col => {
            if (col.id === columnId) {
                return {
                    ...col,
                    cards: col.cards.map(card => card.id === cardId ? { ...card, ...updatedProperties } : card),
                };
            }
            return col;
        }));
        triggerUpdateAnimation(cardId);

        try {
            await api.tasks.updateTask(cardId, updatedProperties);
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, [triggerUpdateAnimation]);

    const deleteTaskCard = useCallback(async (cardId: string, onSuccess?: () => void) => {
        setDeletingCardId(cardId);
        try {
            await api.tasks.deleteTask(cardId);
        } catch (error) {
            console.error('Failed to delete task:', error);
            setDeletingCardId(null);
            return;
        }

        setTimeout(() => {
            setColumns(cols => cols.map(col => ({
                ...col,
                cards: col.cards.filter(card => card.id !== cardId)
            })));
            setDeletingCardId(null);
            if (onSuccess) onSuccess();
        }, 500);
    }, []);

    const clearHighlightedTask = useCallback(() => {
        setHighlightedTaskId(null);
    }, []);

    return {
        columns,
        setColumns,
        highlightedTaskId,
        setHighlightedTaskId,
        justUpdatedCardId,
        deletingCardId,
        moveTaskCard,
        addCard,
        addColumn,
        deleteColumn,
        updateColumnTitle,
        reorderColumns,
        updateTaskDetails,
        deleteTaskCard,
        clearHighlightedTask
    };
};
