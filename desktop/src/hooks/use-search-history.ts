import { useCallback, useEffect, useState } from "react";

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

const SEARCH_HISTORY_KEY = 'chat_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveToStorage = useCallback((history: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  const addToHistory = useCallback((query: string, resultsCount: number) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      // Remove any existing entry with the same query
      const filtered = prev.filter(item => item.query !== query);

      // Add new entry at the beginning
      const newHistory = [
        {
          query,
          timestamp: new Date(),
          resultsCount,
        },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only the latest items

      saveToStorage(newHistory);
      return newHistory;
    });
  }, [saveToStorage]);

  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.query !== query);
      saveToStorage(filtered);
      return filtered;
    });
  }, [saveToStorage]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  const getPopularQueries = useCallback(() => {
    // Return queries sorted by frequency of use, excluding queries with no results and too short queries
    const queryCount = searchHistory
      .filter(item => item.resultsCount > 0 && item.query.trim().length >= 3) // Only include queries that had results and are at least 3 characters
      .reduce((acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query]) => query);
  }, [searchHistory]);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getPopularQueries,
  };
}
