import { ChatInputContext } from "@/contexts/chat-input-context";
import { useContext } from "react";

export function useChatInput() {
  const context = useContext(ChatInputContext);
  if (!context) {
    throw new Error("useChatInput must be used within a ChatInputProvider");
  }
  return context;
}
