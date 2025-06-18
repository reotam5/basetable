import { FileText } from "lucide-react";
import { useState } from "react";
import { TextViewerModal } from "./text-viewer-modal";

interface DocumentCardProps {
  content: string;
}

export function DocumentCard({ content }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const getPreviewText = (text: string, limit: number = 100): string => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const getLineCount = (text: string): number => {
    return text.split('\n').length;
  };

  const formatStats = (text: string): string => {
    const lineCount = getLineCount(text);

    if (lineCount > 1) {
      return `${lineCount} lines`;
    }
    return `${lineCount} line`;
  };

  return (
    <>
      <div
        className={`
        cursor-pointer transition-all duration-200 rounded-lg border p-4 w-full
        ${isHovered
            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 shadow-sm'
            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
          }
      `}
        onClick={() => setIsViewing(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                PASTED
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatStats(content)}
              </span>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-h-24 overflow-hidden">
              <p className="break-words">
                {getPreviewText(content)}
              </p>
            </div>
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Click to view full content
            </div>
          </div>
        </div>
      </div>
      <TextViewerModal
        content={content}
        isOpen={isViewing}
        onClose={() => {
          setIsViewing(false)
        }}
        title="PASTED"
      />
    </>
  );
}