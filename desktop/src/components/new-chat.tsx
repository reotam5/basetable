import { useAuth } from "@/contexts/auth-context";
import { ChatStreamData } from "@/hooks/use-chat";
import { useStream } from "@/hooks/use-stream";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatInput } from "./chat-input";
import { Button } from "./ui/button";

export function NewChat() {
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState("Hello");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Get user's first name
    if (user?.name) {
      const firstName = user.name.split(' ')[0];

      // Determine time of day and set greeting
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting(`Hello, ${firstName}. Good morning`);
      } else if (hour >= 12 && hour < 18) {
        setGreeting(`Hello, ${firstName}. Good afternoon`);
      } else {
        setGreeting(`Hello, ${firstName}. Night owl mode`);
      }
    }
  }, [user]);
  const stream = useStream<ChatStreamData>({ channel: 'chat.stream' });

  const handleSubmit = (data: { content: string; attachedFiles: File[]; longTextDocuments: Array<{ id: string, content: string, title: string }> }) => {
    const { content, attachedFiles, longTextDocuments } = data;
    if (!content.trim() && !attachedFiles?.length && !longTextDocuments?.length) return;

    // Handle sending the message
    window.electronAPI.chat.create({}).then((chat) => {
      if (!chat) {
        console.error("Failed to create chat");
        return;
      }
      stream.startStream(chat.id.toString(), {
        chatId: chat.id,
        message: content,
        attachedFiles: data.attachedFiles,
        longTextDocuments: data.longTextDocuments,

      }).then(() => {
        stream.pauseStream(chat.id.toString()).then(() => {
          window.dispatchEvent(new CustomEvent("sidebar.refresh"));
          navigate({ to: `/chat/${chat.id}` });
          setMessage("");
        })
      });
    })
    setMessage("");
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center mx-auto">
      {/* Free plan upgrade banner */}

      {/* Header Section with personalized greeting */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 dark:text-indigo-400">
            <Sparkles className="h-8 w-8" />
          </span>
          <h1 className="text-5xl font-medium text-neutral-800 dark:text-neutral-100">
            {greeting}
          </h1>
        </div>
      </div>

      {/* Chat Input Section - using shared ChatInput component */}
      <div className="w-full max-w-3xl px-4">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSubmit={handleSubmit}
          placeholder="How can I help you today?"
        />

        {/* Shortcut buttons at the bottom */}
        <div className="flex justify-center gap-3 mt-5">
          <Button variant="outline" className="rounded-full border-neutral-200 dark:border-neutral-700 px-5 py-2 h-auto text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200">
            <code className="mr-2">&lt;/&gt;</code> Code
          </Button>
          <Button variant="outline" className="rounded-full border-neutral-200 dark:border-neutral-700 px-5 py-2 h-auto text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200">
            <svg className="h-4 w-4 mr-2 text-neutral-700 dark:text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <path d="M11 11l-4 4"></path>
            </svg>
            Write
          </Button>
          <Button variant="outline" className="rounded-full border-neutral-200 dark:border-neutral-700 px-5 py-2 h-auto text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200">
            <svg className="h-4 w-4 mr-2 text-neutral-700 dark:text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Learn
          </Button>
          <Button variant="outline" className="rounded-full border-neutral-200 dark:border-neutral-700 px-5 py-2 h-auto text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200">
            <svg className="h-4 w-4 mr-2 text-neutral-700 dark:text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
            Life stuff
          </Button>
          <Button variant="outline" className="rounded-full border-neutral-200 dark:border-neutral-700 px-5 py-2 h-auto text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200">
            <svg className="h-4 w-4 mr-2 text-neutral-700 dark:text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
              <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
              <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
              <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
            </svg>
            Claude's choice
          </Button>
        </div>
      </div>
    </div>
  );
}

