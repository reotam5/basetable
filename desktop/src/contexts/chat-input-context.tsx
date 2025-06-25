import { UIMessage } from "@/components/chat-interface";
import { useMatch } from "@tanstack/react-router";
import React, { createContext, useCallback, useEffect, useRef, useState } from "react";

interface ChatInputState {
  // Text input state
  value: string;

  // File attachments
  attachedFiles: File[];

  // Long text documents
  longTextDocuments: Array<{ id: string, content: string, title: string }>;

  // Agent mention state
  highlightedMentions: Array<{ start: number, end: number, agent: string }>;

  // Selected text context
  selectedTextContext: {
    messageId: number;
    selectedText: string;
    wordCount: number;
    messageType: UIMessage['message']['role'] | "tool";
    timestamp: Date;
  } | null;
}

interface ChatInputContextType {
  state: ChatInputState;
  setValue: (value: string) => void;
  setAttachedFiles: React.Dispatch<React.SetStateAction<ChatInputState['attachedFiles']>>;
  setLongTextDocuments: React.Dispatch<React.SetStateAction<ChatInputState['longTextDocuments']>>;
  setHighlightedMentions: React.Dispatch<React.SetStateAction<ChatInputState['highlightedMentions']>>;
  setSelectedTextContext: React.Dispatch<React.SetStateAction<ChatInputState['selectedTextContext']>>;

  // Actions
  clearInput: () => void;
  clearSelectedTextContext: () => void;
  removeAttachedFile: (index: number) => void;
  removeLongTextDocument: (id: string) => void;
}

const ChatInputContext = createContext<ChatInputContextType | null>(null);

export function ChatInputProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const match = useMatch({ from: '/__app_layout/chat/$chatId', shouldThrow: false })
  const chatId = match?.params?.chatId;

  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ChatInputState['attachedFiles']>([]);
  const [longTextDocuments, setLongTextDocuments] = useState<ChatInputState['longTextDocuments']>([]);
  const [highlightedMentions, setHighlightedMentions] = useState<ChatInputState['highlightedMentions']>([]);
  const [selectedTextContext, setSelectedTextContext] = useState<ChatInputState['selectedTextContext']>(null);
  const shouldReset = useRef(true);

  // Reset state when chatId changes
  useEffect(() => {
    if (shouldReset.current) {
      setValue("");
      setAttachedFiles([]);
      setLongTextDocuments([]);
      setHighlightedMentions([]);
      setSelectedTextContext(null);
    }
    return () => {
      shouldReset.current = chatId !== undefined;
    }
  }, [chatId]);

  const clearInput = useCallback(() => {
    setValue("");
    setAttachedFiles([]);
    setLongTextDocuments([]);
    setSelectedTextContext(null);
    setHighlightedMentions([]);
  }, []);

  const clearSelectedTextContext = useCallback(() => {
    setSelectedTextContext(null);
  }, []);

  const removeAttachedFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeLongTextDocument = useCallback((id: string) => {
    setLongTextDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const state: ChatInputState = {
    value,
    attachedFiles,
    longTextDocuments,
    highlightedMentions,
    selectedTextContext,
  };

  return (
    <ChatInputContext.Provider
      value={{
        state,
        setValue,
        setAttachedFiles,
        setLongTextDocuments,
        setHighlightedMentions,
        setSelectedTextContext,
        clearInput,
        clearSelectedTextContext,
        removeAttachedFile,
        removeLongTextDocument,
      }}
    >
      {children}
    </ChatInputContext.Provider>
  );
}

export { ChatInputContext };
