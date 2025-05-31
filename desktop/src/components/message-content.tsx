import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "./ui/button";

interface MessageContentProps {
  content: string;
  className?: string;
}

export const MessageContent = memo(function MessageContent({ content, className }: MessageContentProps) {
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

  // Detect if content contains markdown-like patterns
  const hasMarkdownElements = /```|`|[*_#]|\[.*\]\(.*\)|^\s*[-*+]\s/m.test(content);

  if (!hasMarkdownElements && !content.includes('```')) {
    // Plain text content
    return <div className={cn("whitespace-pre-wrap leading-relaxed", className)}>{content}</div>;
  }

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
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
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
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
        {content}
      </ReactMarkdown>
    </div>
  );
});
