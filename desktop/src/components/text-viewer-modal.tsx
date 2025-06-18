import { Copy, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface TextViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
}

export function TextViewerModal({ isOpen, onClose, content, title = "PASTED" }: TextViewerModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getStats = (text: string) => {
    const charCount = text.length;
    const lineCount = text.split('\n').length;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

    return { charCount, lineCount, wordCount };
  };

  const stats = getStats(content);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <DialogTitle>{title}</DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            <span>{stats.charCount} characters</span>
            <span>{stats.wordCount} words</span>
            <span>{stats.lineCount} lines</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-700 dark:text-neutral-300 break-words">
              {content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}