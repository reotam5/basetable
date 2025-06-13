import { useNavigate } from "@tanstack/react-router";
import { Search, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatSearch } from "../hooks/use-chat-search";
import { SearchSuggestions } from "./search-suggestions";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { SidebarInput } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function ChatSearch() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ id: number; title: string } | null>(null);
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

  const handleDeleteClick = (chat: { id: number; title: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete.id);
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const shouldShowSuggestions = showSuggestions && inputFocused && (searchSuggestions?.length > 0 || searchHistory?.length > 0);

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl">
      <div className="pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Chat History</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Search and explore your conversation history
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative" ref={searchContainerRef}>
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <SidebarInput
              id="search"
              placeholder="Search conversations..."
              className="h-12 pl-12 pr-4 text-base border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 select-none text-muted-foreground" />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-muted-foreground border-t-transparent"></div>
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
              <>Found {filteredChats.length} conversation{filteredChats?.length !== 1 ? 's' : ''}</>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-destructive/60" />
          </div>
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-6 text-sm">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border border-border rounded-lg p-4 bg-background">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-6" />
                </div>
                <div className="mt-auto">
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat List */}
      {!error && !isLoading && (
        <div className="space-y-4">
          {isSearching && searchQuery.trim() ? (
            <div className="border border-border rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
              <div className="text-muted-foreground">Searching conversations...</div>
            </div>
          ) : filteredChats?.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations found</h3>
              <p className="text-muted-foreground">
                {searchQuery.trim() ? 'Try a different search term' : 'Start a new conversation to see it here'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="border border-border rounded-lg p-4 bg-background hover:bg-muted/30 cursor-pointer transition-colors group"
                  onClick={() => navigate({ to: `/chat/${chat.id}` })}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 flex-1 mr-2">
                        {chat.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick({ id: chat.id, title: chat.title }, e)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0 flex-shrink-0"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-auto">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(new Date(chat.updated_at!))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}