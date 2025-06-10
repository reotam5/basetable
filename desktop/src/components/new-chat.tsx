import { useAuth } from "@/contexts/auth-context";
import { use } from "@/hooks/use";
import { useStream } from "@/hooks/use-stream";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Paperclip, Search, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export function NewChat() {
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState("Hello");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const modelsPerPage = 7;
  const navigate = useNavigate();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: models } = use({ fetcher: async () => await window.electronAPI.llm.getAll() });
  const { data: mainAgentData, refetch: refetchMainAgent } = use<{ llmId: number, id: number }>({ fetcher: async () => await window.electronAPI.agent.getMain() });
  const selectedModel = mainAgentData?.llmId ?? null;
  const setSelectedModel = (llmId: string) => {
    window.electronAPI.agent.update(mainAgentData?.id ?? 0, { llmId: parseInt(llmId) }).then(() => {
      refetchMainAgent();
    })
  }

  // Filter models based on search quer  const [selectedModel, setSelectedModel] = useState("4");y
  const filteredModels = models?.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredModels.length / modelsPerPage);
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * modelsPerPage,
    currentPage * modelsPerPage
  );

  // Get selected model details
  const selectedModelDetails = models?.find(m => m.id === selectedModel);

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
  const stream = useStream({ channel: 'chat.stream' });

  const handleSubmit = () => {
    if (message.trim()) {
      // Handle sending the message
      window.electronAPI.chat.create({}).then((chat) => {
        console.log("New chat created:", chat.id.toString());
        stream.startStream(chat.id.toString(), {
          chatId: chat.id,
          message: message.trim(),
          attachments: [],
        }).then(() => {
          stream.pauseStream(chat.id.toString()).then(() => {
            window.dispatchEvent(new CustomEvent("sidebar.refresh"));
            navigate({ to: `/chat/${chat.id}` });
            setMessage("");
          })
        });
      })
      setMessage("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ""; // reset for re-uploading same file
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setDialogOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
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

      {/* Chat Input Section - matching chat-interface.tsx */}
      <div className="w-full max-w-3xl px-4">
        <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-500">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={5}
            className="w-full p-4 resize-none leading-relaxed focus-visible:ring-transparent border-0 shadow-none min-h-[3rem] max-h-[12rem]"
          />
          <div className="flex justify-between items-end p-3" onClick={(e) => { textareaRef.current?.focus(); e.stopPropagation(); }}>
            {/* Bottom Left Controls */}
            <div>
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={file.name + file.size + idx}
                      className="flex items-center border border-neutral-200 dark:border-neutral-500 rounded px-3 py-1 text-sm text-neutral-800 dark:text-neutral-200"
                    >
                      <Paperclip className="w-4 h-4 mr-1 opacity-70" />
                      <span className="truncate max-w-[120px]" title={file.name}>{file.name}</span>
                      <button
                        className="ml-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none"
                        onClick={() => handleRemoveFile(idx)}
                        aria-label="Remove file"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Right Controls */}
            <div className="flex items-center">
              {/* Model Selector Modal */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-8 px-3 text-xs border-0 flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {selectedModelDetails?.name || "Claude Sonnet 4"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] w-[650px] h-[600px] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Select a model</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                      <Input
                        type="search"
                        placeholder="Search models..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>

                    {/* Models list */}
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                      {paginatedModels.map(model => (
                        <div
                          key={model.id}
                          onClick={() => handleSelectModel(model.id)}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${selectedModel === model.id
                            ? 'bg-neutral-100 dark:bg-neutral-700'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-neutral-500">{model.provider}</div>
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {model.description}
                          </div>
                        </div>
                      ))}

                      {filteredModels.length === 0 && (
                        <div className="text-center py-4 text-neutral-500">
                          No models match your search
                        </div>
                      )}
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Attachment Button */}
              <div>
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  onClick={handleAttachClick}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="File input"
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={!message.trim()}
                size="icon"
                variant="ghost"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

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

