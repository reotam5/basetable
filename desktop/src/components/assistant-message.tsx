import { useChat } from "@/hooks/use-chat";
import { Bot, Clock } from "lucide-react";
import { Fragment, FunctionComponent, useState } from "react";
import { UIMessage } from "./chat-interface";
import { MessageContent } from "./message-content";
import { ThoughtMessage } from "./thought-message";
import { ToolMessage } from "./tool-message";

export type IAssistantMessageProps = {
  message: UIMessage['message']
  toolCalls: UIMessage['toolCalls']
  sendToolCallConfirmation: ReturnType<typeof useChat>['sendToolCallConfirmation']
  mcpToolKey: number;
  setMcpToolKey: (key: number) => void;
};

export const AssistantMessage: FunctionComponent<IAssistantMessageProps> = ({ message, sendToolCallConfirmation, toolCalls, mcpToolKey, setMcpToolKey }) => {
  const [isExppanded, setIsExpanded] = useState(false);

  return (
    <div>
      {message.thought && (
        <ThoughtMessage
          message={message}
        />
      )}
      <MessageContent
        message={message}
      />
      {toolCalls && toolCalls.length > 0 && toolCalls.map((toolCall, index) => (
        <ToolMessage
          key={index + "tool" + message.id}
          message={toolCall}
          sendToolCallConfirmation={sendToolCallConfirmation}
          setMcpToolKey={setMcpToolKey}
          mcpToolKey={mcpToolKey}
        />
      ))}
      {(message.status === "success" || (toolCalls && toolCalls.length > 0)) && (
        <Fragment key={message.id + "details"}>
          <div className="mt-3 pt-3">
            <button
              onClick={() => setIsExpanded(!isExppanded)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-400 transition-colors"
            >
              <div className={`transform transition-transform ${isExppanded ? 'rotate-90' : 'rotate-0'}`}>
                ▶
              </div>
              {isExppanded ? "Hide details" : "Show details"}
            </button>

            {isExppanded && (
              <div className="mt-3 space-y-2 pl-1">
                {message.metadata?.agents && (
                  <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                    <Bot className="w-3 h-3" />
                    {message.metadata.agents.map((agent) => `${agent.name} - ${agent.llm.display_name}`).join(", ")}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(message.created_at!).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </Fragment>
      )}
    </div>
  )
}