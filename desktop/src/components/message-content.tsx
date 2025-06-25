import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from 'remark-gfm';
import { UIMessage } from "./chat-interface";
import { Button } from "./ui/button";

interface MessageContentProps {
  message: UIMessage['message']
}

export const MessageContent = memo(function MessageContent({ message: { content, metadata, status } }: MessageContentProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const search_results = metadata?.search_results ?? []

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

  // Extract used citations from content
  const extractUsedCitations = (text: string) => {
    if (!search_results) return [];

    const usedCitations: number[] = [];
    const citationRegex = /\[(\d+)\]/g;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const citationNum = parseInt(match[1]);
      if (!usedCitations.includes(citationNum)) {
        usedCitations.push(citationNum);
      }
    }

    return usedCitations.sort((a, b) => a - b);
  };

  const usedCitations = extractUsedCitations(content);

  // Process content to replace citations with clickable components for plain text
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
              key={index + "citation-button"}
              onClick={() => window.electronAPI.shell.openExternal(result.url)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded border border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 transition-colors mx-0.5 align-baseline"
              title={`${result.title} - ${new URL(result.url).hostname}`}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=16`}
                alt=""
                className="h-3 w-3 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="font-mono font-medium">{match[1]}</span>
            </button>
          );
        }
      }
      return part;
    });
  };

  // Process content for markdown but keep citations for inline display
  const processedContent = search_results ? content?.replace(/\[(\d+)\]/g, (match, num) => {
    const index = parseInt(num) - 1;
    const result = search_results[index];
    if (result) {
      // Use markdown link syntax but we'll override the styling
      return `[${num}](${result.url})`;
    }
    return match;
  }) : content;

  // Detect if content contains markdown-like patterns (exclude simple citations)
  const hasMarkdownElements = /```|`|[*_#]|\[.*\]\(.*\)|^\s*[-*+]\s/m.test(content); if (!hasMarkdownElements && !content.includes('```')) {
    // Plain text content
    return (
      <div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderContentWithCitations(content)}
        </div>

        {/* Citation badges at the end showing titles */}
        {search_results && usedCitations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex flex-wrap gap-2">
              {usedCitations.map((citationNum) => {
                const result = search_results[citationNum - 1];
                if (!result) return null;

                return (
                  <button
                    key={citationNum + "citation"}
                    onClick={() => window.electronAPI.shell.openExternal(result.url)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-md border border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 transition-colors max-w-xs"
                    title={result.title}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=16`}
                      alt=""
                      className="h-3 w-3 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-mono font-medium">{citationNum}</span>
                    <span className="truncate">{result.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
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
                const citationIndex = parseInt(children as string) - 1;
                const result = search_results[citationIndex];
                const tooltipText = result ? `${result.title} - ${new URL(result.url).hostname}` : `Open source ${children}`;

                return (
                  <button
                    onClick={() => window.electronAPI.shell.openExternal(href!)}
                    className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded border border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 transition-colors mx-0.5 align-baseline"
                    title={tooltipText}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(href!).hostname}&sz=16`}
                      alt=""
                      className="h-2.5 w-2.5 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-mono font-medium">{children}</span>
                  </button>
                );
              }

              // Regular links
              return (
                <Button
                  variant="link"
                  onClick={() => window.electronAPI.shell.openExternal(href!)}
                  className="h-auto p-0 font-inherit text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                  <span>{children}</span>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(href!).hostname}&sz=16`}
                    alt=""
                    className="h-3 w-3 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Button>
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

      {/* Citation badges at the end showing titles */}
      {search_results && usedCitations.length > 0 && status === 'success' && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <div className="flex flex-wrap gap-2">
            {usedCitations.map((citationNum) => {
              const result = search_results[citationNum - 1];
              if (!result) return null;

              return (
                <button
                  key={citationNum + "search-result"}
                  onClick={() => window.electronAPI.shell.openExternal(result.url)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-md border border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 transition-colors max-w-xs"
                  title={result.title}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=16`}
                    alt=""
                    className="h-3 w-3 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="font-mono font-medium">{citationNum}</span>
                  <span className="truncate">{result.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
