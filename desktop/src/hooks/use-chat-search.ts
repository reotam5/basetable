import { useCallback, useEffect, useState } from "react";
import { useSearchHistory } from "./use-search-history";
// import { chatApi } from '../services/chat-api';

export interface ChatItem {
  id: string;
  title: string;
  updatedAt: Date;
  description: string;
  tags: string[];
}

// Dummy data that will be replaced with async call in the future
const dummyData: ChatItem[] = [
  {
    title: "Email Summary & Code",
    updatedAt: new Date("2023-10-01T12:00:00Z"),
    description: "Summarize the email and extract code snippets.",
    tags: ["email", "code", "summary"],
    id: "1",
  },
  {
    title: "Project Management",
    updatedAt: new Date("2023-10-02T14:30:00Z"),
    description: "Discuss project timelines and deliverables.",
    tags: ["project", "management", "timeline"],
    id: "2",
  },
  {
    title: "AI Research Discussion",
    updatedAt: new Date("2023-10-03T09:15:00Z"),
    description: "Explore the latest trends in AI research.",
    tags: ["AI", "research", "trends"],
    id: "3",
  },
  {
    title: "Customer Feedback Analysis",
    updatedAt: new Date("2023-10-04T11:45:00Z"),
    description: "Analyze customer feedback for product improvements.",
    tags: ["customer", "feedback", "analysis"],
    id: "4",
  },
  {
    title: "Marketing Strategy Planning",
    updatedAt: new Date("2023-10-05T16:20:00Z"),
    description: "Plan the next marketing campaign strategies.",
    tags: ["marketing", "strategy", "planning"],
    id: "5",
  },
  {
    title: "Sales Data Insights",
    updatedAt: new Date("2023-10-06T08:00:00Z"),
    description: "Review sales data and identify key insights.",
    tags: ["sales", "data", "insights"],
    id: "6",
  },
  {
    title: "Team Collaboration Tools",
    updatedAt: new Date("2023-10-07T10:30:00Z"),
    description: "Discuss tools for better team collaboration.",
    tags: ["team", "collaboration", "tools"],
    id: "7",
  },
  {
    title: "Financial Report Review",
    updatedAt: new Date("2023-10-08T13:00:00Z"),
    description: "Review the latest financial reports and forecasts.",
    tags: ["financial", "report", "review"],
    id: "8",
  },
  {
    title: "Product Launch Planning",
    updatedAt: new Date("2023-10-09T15:45:00Z"),
    description: "Plan the upcoming product launch event.",
    tags: ["product", "launch", "planning"],
    id: "9",
  },
  {
    title: "User Experience Research",
    updatedAt: new Date("2023-10-10T17:30:00Z"),
    description: "Conduct research on user experience improvements.",
    tags: ["user", "experience", "research"],
    id: "10",
  },
];

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
    setIsLoading(true);
    setError(null);
    try {
      // REAL API INTEGRATION - Uncomment the lines below and remove dummy data
      // const data = await chatApi.getChats();
      // setChats(data);

      // DUMMY DATA - Remove this when integrating with real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChats(dummyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(errorMessage);
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Async search function with debouncing
  const searchChats = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredChats(chats);
      return;
    }

    setIsSearching(true);
    try {
      // REAL API INTEGRATION - Server-side search
      // const searchResults = await chatApi.searchChats(query);
      // setFilteredChats(searchResults);

      // DUMMY IMPLEMENTATION - Client-side filtering with delay to simulate async
      await new Promise(resolve => setTimeout(resolve, 300));
      const lowercaseQuery = query.toLowerCase();
      const filtered = chats.filter((chat) => {
        return (
          chat.title.toLowerCase().includes(lowercaseQuery) ||
          chat.description.toLowerCase().includes(lowercaseQuery) ||
          chat.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        );
      });
      setFilteredChats(filtered);

      // Add to search history when search is complete
      addToHistory(query, filtered.length);
    } catch (err) {
      console.error('Error searching chats:', err);
      // Fallback to local filtering on search error
      const lowercaseQuery = query.toLowerCase();
      const filtered = chats.filter((chat) => {
        return (
          chat.title.toLowerCase().includes(lowercaseQuery) ||
          chat.description.toLowerCase().includes(lowercaseQuery) ||
          chat.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        );
      });
      setFilteredChats(filtered);
      addToHistory(query, filtered.length);
    } finally {
      setIsSearching(false);
    }
  }, [chats, addToHistory]);

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

      // Add matching tags
      chat.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query) && tag.toLowerCase() !== query) {
          suggestions.add(tag);
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
    }, 300); // 300ms debounce

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
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      // REAL API INTEGRATION - Uncomment the line below
      // await chatApi.deleteChat(chatId);

      // Remove chat from local state optimistically
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));

      // DUMMY IMPLEMENTATION - Remove this when integrating with real API
      console.log('Delete chat:', chatId);
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
    filteredChats,
    isLoading,
    isSearching,
    error,
    formatDate,
    deleteChat,
    refetch,
    searchSuggestions,
    searchHistory,
  };
}
