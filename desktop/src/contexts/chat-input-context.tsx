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
    messageId: string;
    selectedText: string;
    wordCount: number;
    messageType: 'user' | 'assistant' | 'system';
    timestamp: Date;
  } | null;
}

interface ChatInputContextType {
  state: ChatInputState;
  setValue: (value: string) => void;
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setLongTextDocuments: React.Dispatch<React.SetStateAction<Array<{ id: string, content: string, title: string }>>>;
  setHighlightedMentions: React.Dispatch<React.SetStateAction<Array<{ start: number, end: number, agent: string }>>>;
  setSelectedTextContext: React.Dispatch<React.SetStateAction<{
    messageId: string;
    selectedText: string;
    wordCount: number;
    messageType: "user" | "assistant" | "system";
    timestamp: Date;
  } | null>>;

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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [longTextDocuments, setLongTextDocuments] = useState<Array<{ id: string, content: string, title: string }>>([]);
  const [highlightedMentions, setHighlightedMentions] = useState<Array<{ start: number, end: number, agent: string }>>([]);
  const [selectedTextContext, setSelectedTextContext] = useState<{
    messageId: string;
    selectedText: string;
    wordCount: number;
    messageType: 'user' | 'assistant' | 'system';
    timestamp: Date;
  } | null>(null);
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
