import { useNavigate } from "@tanstack/react-router";
import { Search, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatSearch } from "../hooks/use-chat-search";
import { SearchSuggestions } from "./search-suggestions";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { SidebarInput } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function ChatSearch() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
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
  } = useChatSearch();

  // Handle clicks outside search container to hide suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setInputFocused(false);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    setShowSuggestions(true);
  };

  const shouldShowSuggestions = showSuggestions && inputFocused && (searchSuggestions.length > 0 || searchHistory.length > 0);

  return (
    <div className="space-y-8 p-6 mx-auto max-w-4xl">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Chat History</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Search and explore your conversation history
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative" ref={searchContainerRef}>
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <SidebarInput
              id="search"
              placeholder="Type to search..."
              className="h-10 pl-7 pr-7"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
            />
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
            {isSearching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent"></div>
              </div>
            )}

            {/* Search Suggestions */}
            <SearchSuggestions
              suggestions={searchSuggestions}
              searchHistory={searchHistory}
              onSuggestionClick={handleSuggestionClick}
              onHistoryClick={handleSuggestionClick}
              isVisible={shouldShowSuggestions}
            />
          </div>
        </form>

        {/* Search Results Counter */}
        {searchQuery.trim() && (
          <div className="text-sm text-muted-foreground">
            {isSearching ? (
              "Searching..."
            ) : (
              <>Found {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''} for "{searchQuery}"</>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Error loading chats</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                </div>
                <Skeleton className="h-6 w-6 ml-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat List */}
      {!error && !isLoading && (
        <div className="divide-y divide-border/50">
          {isSearching && searchQuery.trim() ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground border-t-transparent mx-auto mb-4"></div>
              <div className="text-muted-foreground">Searching chats...</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query or browse all conversations
              </p>
            </div>
          ) : (
            filteredChats.map((chat, index) => (
              <div
                key={chat.id}
                className={`py-4 hover:bg-accent/30 -mx-2 px-2 rounded cursor-pointer transition-colors group ${index === 0 ? 'pt-0' : ''
                  }`}
                onClick={() => navigate({ to: `/chat/${chat.id}` })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg text-foreground font-normal cursor-pointer">
                        {chat.title}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                      {chat.description}
                    </p>
                    {chat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chat.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}