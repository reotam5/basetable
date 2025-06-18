import { FileText, X } from "lucide-react";

interface ContentPreviewCardProps {
  id: string;
  title: string;
  content: string;
  onView: () => void;
  onRemove: () => void;
}

function getPreviewText(text: string, limit: number = 50): string {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

export function ContentPreviewCard({ id, title, content, onView, onRemove }: ContentPreviewCardProps) {
  return (
    <div className="flex-shrink-0">
      <div 
        className="flex items-start gap-2 p-2 border border-neutral-200 dark:border-neutral-500 rounded-lg bg-neutral-50 dark:bg-neutral-900 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-72"
        onClick={onView}
      >
        <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {title}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
              {content.split('\n').length} lines
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed truncate">
            {getPreviewText(content)}
          </p>
        </div>
        <button
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove document"
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}