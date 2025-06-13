import { useCallback, useEffect, useState } from "react";
import { useSearchHistory } from "./use-search-history";
// import { chatApi } from '../services/chat-api';

interface ChatItem {
  id: number;
  title: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
}

export function useChatSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const { addToHistory, searchHistory, getPopularQueries } = useSearchHistory();

  // Async function to fetch chats
  const fetchChats = useCallback(async () => {
    setError(null);
    try {
      const rows = await window.electronAPI.chat.getAll();
      setChats(rows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(errorMessage);
    }
  }, []);

  // Fetch chats on component mount
  useEffect(() => {
    setIsLoading(true);
    fetchChats().finally(() => {
      setIsLoading(false);
    });
  }, [fetchChats]);

  // Async search function with debouncing
  const searchChats = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredChats(chats);
      return;
    }

    setIsSearching(true);
    const data = await window.electronAPI.chat.getAll({ search: query, limit: 100 });

    setFilteredChats(data ?? []);

    // Add to search history when search is complete
    addToHistory(query, data?.length);
    setIsSearching(false);
  }, [chats, addToHistory]);

  useEffect(() => {
    const onSidebarRefresh = () => {
      if (searchQuery.trim()) {
        searchChats(searchQuery);
      } else {
        fetchChats()
      }
    }
    window.addEventListener("sidebar.refresh", onSidebarRefresh);
    return () => {
      window.removeEventListener("sidebar.refresh", onSidebarRefresh);
    }
  }, [fetchChats, searchChats, searchQuery])

  // Generate search suggestions based on chat content and history
  const generateSuggestions = useCallback((inputQuery: string) => {
    if (!inputQuery.trim()) {
      // Show popular queries when no input
      setSearchSuggestions(getPopularQueries());
      return;
    }

    const query = inputQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Add suggestions from chat titles and tags
    chats.forEach(chat => {
      // Extract words from title
      chat.title.toLowerCase().split(/\s+/).forEach(word => {
        if (word.includes(query) && word !== query) {
          suggestions.add(word);
        }
      });
    });

    // Add from search history (only queries that had results and are long enough)
    searchHistory
      .filter(item => item.resultsCount > 0 && item.query.trim().length >= 3) // Only include queries that had results and are at least 3 characters
      .forEach(item => {
        if (item.query.toLowerCase().includes(query) && item.query.toLowerCase() !== query) {
          suggestions.add(item.query);
        }
      });

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  }, [chats, searchHistory, getPopularQueries]);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchChats(searchQuery);
    }, 100); // Reduced to 100ms debounce for faster response

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, searchChats]);

  // Generate suggestions when search query changes
  useEffect(() => {
    const delayedSuggestions = setTimeout(() => {
      generateSuggestions(searchQuery);
    }, 150); // Faster debounce for suggestions

    return () => clearTimeout(delayedSuggestions);
  }, [searchQuery, generateSuggestions]);

  // Initialize filtered chats when chats change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now?.getTime() - date?.getTime();
    const diffDays = Math?.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date?.toLocaleDateString();
  };

  const deleteChat = useCallback(async (chatId: number) => {
    try {
      await window.electronAPI.chat.delete(chatId);

      // Remove chat from local state optimistically
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chat';
      setError(errorMessage);
      console.error('Error deleting chat:', err);

      // Refetch data to restore state if delete failed
      fetchChats();
    }
  }, [fetchChats]);

  const refetch = useCallback(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    searchQuery,
    setSearchQuery,
    filteredChats: filteredChats ?? [],
    isLoading,
    isSearching,
    error,
    formatDate,
    deleteChat,
    refetch,
    searchSuggestions: searchSuggestions ?? [],
    searchHistory: searchHistory ?? [],
  };
}
