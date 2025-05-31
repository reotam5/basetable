import { Clock, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface SearchSuggestionsProps {
  suggestions: string[];
  searchHistory: Array<{
    query: string;
    timestamp: Date;
    resultsCount: number;
  }>;
  onSuggestionClick: (suggestion: string) => void;
  onHistoryClick: (query: string) => void;
  isVisible: boolean;
}

export function SearchSuggestions({
  suggestions,
  searchHistory,
  onSuggestionClick,
  onHistoryClick,
  isVisible,
}: SearchSuggestionsProps) {
  if (!isVisible) return null;

  const recentHistory = searchHistory.slice(0, 3);
  const hasSuggestions = suggestions.length > 0;
  const hasHistory = recentHistory.length > 0;

  if (!hasSuggestions && !hasHistory) return null;

  return (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-2 border shadow-lg bg-background">
      <div className="space-y-3">
        {/* Search Suggestions */}
        {hasSuggestions && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Suggestions
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-left font-normal"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <Search className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Search History */}
        {hasHistory && hasSuggestions && (
          <div className="border-t pt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Recent Searches
            </div>
            <div className="space-y-1">
              {recentHistory.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-left font-normal"
                  onClick={() => onHistoryClick(item.query)}
                >
                  <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate flex-1">{item.query}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {item.resultsCount} result{item.resultsCount !== 1 ? 's' : ''}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Show only history if no suggestions */}
        {hasHistory && !hasSuggestions && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Recent Searches
            </div>
            <div className="space-y-1">
              {recentHistory.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-left font-normal"
                  onClick={() => onHistoryClick(item.query)}
                >
                  <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="truncate flex-1">{item.query}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {item.resultsCount} result{item.resultsCount !== 1 ? 's' : ''}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
