import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function NewChat() {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim()) {
      // Handle sending the message
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center mx-auto">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
            basetable
          </h1>
        </div>
        <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
          Your intelligent AI control center. Ask questions, manage workflows, or start a conversation.
        </p>
      </div>

      {/* Chat Input Section */}
      <div className="w-full max-w-3xl">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything or describe what you'd like to do..."
            className="resize-none min-h-[120px] pr-12 text-base border-2 border-border/50 focus:border-primary/50 transition-colors"
            rows={4}
          />
          <Button
            onClick={handleSubmit}
            disabled={!message.trim()}
            size="sm"
            className="absolute bottom-3 right-3 h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Helper Text */}
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>Press ⌘ + Enter to send</span>
          <span>{message.length}/2000</span>
        </div>
      </div>
    </div>
  )
}