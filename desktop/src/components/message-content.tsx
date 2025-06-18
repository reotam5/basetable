import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "./ui/button";

interface MessageContentProps {
  content: string;
  className?: string;
  search_results?: Array<{
    title: string;
    url: string;
  }>;
}

export const MessageContent = memo(function MessageContent({ content, className, search_results }: MessageContentProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Blur any focused element to prevent scroll behavior
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Process content to replace citations with clickable components
  const renderContentWithCitations = (text: string) => {
    if (!search_results) return text;
    
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationNum = parseInt(match[1]) - 1;
        const result = search_results[citationNum];
        if (result) {
          return (
            <button
              key={index}
              onClick={() => window.electronAPI.shell.openExternal(result.url)}
              className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 text-xs font-mono font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20 hover:border-primary/40 transition-all duration-200 mx-0.5 align-baseline"
              title={result.title}
            >
              {match[1]}
            </button>
          );
        }
      }
      return part;
    });
  };

  // Process content to make citations clickable as buttons in markdown
  const processedContent = search_results ? content.replace(/\[(\d+)\]/g, (match, num) => {
    const index = parseInt(num) - 1;
    const result = search_results[index];
    if (result) {
      // Use markdown link syntax but we'll override the styling
      return `[${num}](${result.url})`;
    }
    return match;
  }) : content;
  
  // Detect if content contains markdown-like patterns (exclude simple citations)
  const hasMarkdownElements = /```|`|[*_#]|\[.*\]\(.*\)|^\s*[-*+]\s/m.test(content);

  if (!hasMarkdownElements && !content.includes('```')) {
    // Plain text content
    return (
      <div className={className}>
        {search_results && search_results.length > 0 && (
          <div className="mb-4 pb-3 border-b border-border">
            <h4 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Sources</h4>
            <div className="grid gap-2">
              {search_results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => window.electronAPI.shell.openExternal(result.url)}
                  className="group flex items-start gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent transition-all duration-200 text-left w-full"
                >
                  <span className="flex-shrink-0 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-mono font-medium">
                    [{index + 1}]
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {result.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {new URL(result.url).hostname}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">{renderContentWithCitations(content)}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {search_results && search_results.length > 0 && (
        <div className="mb-4 pb-3 border-b border-border">
          <h4 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Sources</h4>
          <div className="grid gap-2">
            {search_results.map((result, index) => (
              <button
                key={index}
                onClick={() => window.electronAPI.shell.openExternal(result.url)}
                className="group flex items-start gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent transition-all duration-200 text-left w-full"
              >
                <span className="flex-shrink-0 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-mono font-medium">
                  [{index + 1}]
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {result.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {new URL(result.url).hostname}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className={cn("prose prose-sm dark:prose-invert max-w-none")}>
        <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            // Create a stable ID based on content and language
            const codeId = `code-${language}-${codeString.slice(0, 20).replace(/\W/g, '')}-${codeString.length}`;
            const isInline = !props.ref && !language;

            if (!isInline && language) {
              return (
                <div className="mb-5 mt-3 min-w-0 overflow-x-auto border border-gray-700 rounded-md bg-[#282c34] grid">
                  {/* Header bar with language and copy button */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#21252b]">
                    <span className="text-gray-300 text-xs font-mono select-none">
                      {language}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-gray-600 text-gray-300 hover:text-white border-0 select-none"
                      onClick={(e) => copyToClipboard(codeString, codeId, e)}
                      onMouseDown={(e) => e.preventDefault()}
                      onFocus={(e) => e.preventDefault()}
                      tabIndex={-1}
                      type="button"
                      style={{ outline: 'none' }}
                    >
                      {copiedCode === codeId ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !mb-0 !rounded-none min-w-0"
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: 'transparent',
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          // Customize other elements as needed
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => {
            // Check if this is a citation link (single number)
            const isCitation = typeof children === 'string' && /^\d+$/.test(children);
            
            if (isCitation && search_results) {
              return (
                <button
                  onClick={() => window.electronAPI.shell.openExternal(href!)}
                  className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 text-xs font-mono font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20 hover:border-primary/40 transition-all duration-200 mx-0.5 align-baseline"
                  title={`Open source ${children}`}
                >
                  {children}
                </button>
              );
            }
            
            // Regular links
            return (
              <button
                onClick={() => window.electronAPI.shell.openExternal(href!)}
                className="text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 font-inherit cursor-pointer"
              >
                {children}
              </button>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
      </div>
    </div>
  );
});
