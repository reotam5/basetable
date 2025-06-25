import { use } from "@/hooks/use";
import { useAgents } from "@/hooks/use-agent";
import { useChatInput } from "@/hooks/use-chat-input";
import { useSettings } from "@/hooks/use-settings";
import { Bot, ChevronDown, Paperclip, Search, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentPreviewCards } from "./content-preview-cards";
import { TextViewerModal } from "./text-viewer-modal";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Long text detection constants
const LONG_TEXT_CHAR_THRESHOLD = 4000;
const LONG_TEXT_LINE_THRESHOLD = 50;

// Helper function to detect long text - only for pasted content
function isLongText(text: string, isPasted: boolean = false): boolean {
  if (!isPasted) return false;
  const lineCount = text.split('\n').length;
  return text.length > LONG_TEXT_CHAR_THRESHOLD || lineCount > LONG_TEXT_LINE_THRESHOLD;
}

interface ChatInputProps {
  // Callback for submitting
  onSubmit: (data: { content: string; attachedFiles: File[]; longTextDocuments: Array<{ id: string, content: string, title: string }> }) => void;
  placeholder?: string;
  disabled?: boolean;

  // Send button customization
  sendButtonContent?: React.ReactNode;
  showCancelButton?: boolean;
  onCancel?: () => void;

  // Container customization
  containerClassName?: string;
}

export function ChatInput({
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  sendButtonContent,
  showCancelButton = false,
  onCancel,
  containerClassName = "",
}: ChatInputProps) {
  const { state: { value, selectedTextContext, attachedFiles, highlightedMentions, longTextDocuments }, setSelectedTextContext, setLongTextDocuments, setAttachedFiles, setValue: onChange, setHighlightedMentions } = useChatInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasPasted = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevInputValueRef = useRef('');

  const [modalContent, setModalContent] = useState<string | null>(null);

  // Internal model management
  const { data: models } = use({ fetcher: async () => await window.electronAPI.llm.getAll() });
  const { data: mainAgentData, refetch: refetchMainAgent } = use({ fetcher: async () => await window.electronAPI.agent.getMain() });
  const selectedModel = mainAgentData?.llm_id ?? null;
  const setSelectedModel = useCallback((llmId: number) => {
    window.electronAPI.agent.update(mainAgentData?.id ?? 0, { llmId }).then(() => {
      refetchMainAgent();
    })
  }, [mainAgentData?.id, refetchMainAgent]);

  // Model selector state for dialog type
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const modelsPerPage = 7;

  // Agent mention functionality
  const { agents } = useAgents();
  const [cachedAgents, setCachedAgents] = useState<typeof agents>([]);

  // Debug: log when agents change
  useEffect(() => {
    if (agents.length > 0) {
      setCachedAgents(agents);
    }
  }, [agents]);

  // Use cached agents if current agents are empty
  const stableAgents = agents.length > 0 ? agents : cachedAgents;
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [agentDropdownPosition, setAgentDropdownPosition] = useState({ top: 0, left: 0 });
  const [agentQuery, setAgentQuery] = useState('');
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);

  // Auto-route settings
  const { settings, setSetting } = useSettings({
    keys: ['agent.autoRoute'],
    defaults: { 'agent.autoRoute': 'true' }
  });
  const autoRouteEnabled = settings[0] === 'true';

  // Filter agents for @ mention dropdown
  const filteredAgents = useMemo(() => {
    if (!agentQuery) return stableAgents.filter(agent => !agent.is_main); // Hide main agentAdd commentMore actions
    return stableAgents.filter(agent =>
      !agent.is_main &&
      agent.name?.toLowerCase().includes(agentQuery.toLowerCase())
    );
  }, [agentQuery, stableAgents]);

  // Function to detect and highlight @ mentions in the input
  const detectMentions = useCallback((text: string) => {
    const mentions: Array<{ start: number, end: number, agent: string }> = [];

    for (const agent of stableAgents) {
      if (agent.is_main) continue;

      const dashedName = agent.name?.replace(/\s+/g, '-') || '';
      const mentionPattern = `@${dashedName}`;

      let startIndex = 0;
      while (true) {
        const index = text.toLowerCase().indexOf(mentionPattern.toLowerCase(), startIndex);
        if (index === -1) break;

        mentions.push({
          start: index,
          end: index + mentionPattern.length,
          agent: agent.name || ''
        });

        startIndex = index + 1;
      }
    }

    setHighlightedMentions(mentions);
  }, [setHighlightedMentions, stableAgents]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const prevValue = prevInputValueRef.current;
    const newValue = e.target.value;
    const delta = newValue.slice(prevValue.length);
    const cursorPosition = e.target.selectionStart;
    let skipAutoResize = false;

    // Check if text is long and was pasted
    if (isLongText(delta, wasPasted.current)) {
      const id = Date.now().toString();
      const title = "PASTED";
      setLongTextDocuments(prev => [...prev ?? [], { id, content: delta, title }]);
      onChange(prevInputValueRef.current);
      setShowAgentDropdown(false);
      setSelectedAgentIndex(0);
      skipAutoResize = true; // Prevent auto-resize from running

    } else {
      onChange(newValue);
      prevInputValueRef.current = newValue;

      // Detect mentions for highlighting (only if agents are loaded)
      if (stableAgents.length > 0) {
        detectMentions(newValue);
      }

      // Handle @ mention detection for dropdown
      const beforeCursor = newValue.substring(0, cursorPosition);
      const atIndex = beforeCursor.lastIndexOf('@');

      if (atIndex !== -1) {
        const afterAt = beforeCursor.substring(atIndex + 1);
        const hasSpaceAfterAt = afterAt.includes(' ');

        if (!hasSpaceAfterAt && !highlightedMentions?.length) {
          // Show dropdown
          setMentionStartIndex(atIndex);
          setAgentQuery(afterAt);
          setShowAgentDropdown(true);
        } else {
          setShowAgentDropdown(false);
        }
      } else {
        setShowAgentDropdown(false);
      }
    }

    // Reset paste flag after processing
    wasPasted.current = false;

    // Auto-resize textarea (skip if we handled long text)
    if (textareaRef.current && !skipAutoResize) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [detectMentions, highlightedMentions?.length, onChange, setLongTextDocuments, stableAgents.length]);

  const handlePaste = useCallback(() => { wasPasted.current = true; }, []);
  const handleSubmit = useCallback(() => {
    const content = value.trim();

    const attachedText: { id: string, content: string, title: string }[] = [
      ...longTextDocuments ?? [],
      ...selectedTextContext ? [{
        id: selectedTextContext.messageId?.toString(),
        content: selectedTextContext.selectedText,
        title: `Selected Text`
      }] : []
    ]

    onSubmit({ content, attachedFiles, longTextDocuments: attachedText });

    // Clear internal state after submitting
    setAttachedFiles([]);
    setLongTextDocuments([]);
    setShowAgentDropdown(false);
    setSelectedTextContext?.(null);

    // if user targeted specific agent, keep it for the next input
    const initialValue = highlightedMentions?.length > 0 ? `@${highlightedMentions[0].agent?.replace(/\s+/g, '-')} ` : '';
    detectMentions(initialValue);
    prevInputValueRef.current = initialValue;
    onChange(initialValue);

    // Reset textarea height after clearing content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Set to minimum height to ensure proper reset
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      }, 0);
    }
  }, [value, longTextDocuments, selectedTextContext, onSubmit, attachedFiles, setAttachedFiles, setLongTextDocuments, setSelectedTextContext, highlightedMentions, detectMentions, onChange]);

  const handleAgentSelect = useCallback((agent: typeof agents[0]) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(mentionStartIndex + 1 + agentQuery.length);
    // Use dashed version for @ mentions
    const dashedName = agent.name?.replace(/\s+/g, '-') || '';
    const newValue = `${beforeMention}@${dashedName} ${afterMention}`;

    onChange(newValue);
    setShowAgentDropdown(false);
    setMentionStartIndex(-1);
    setAgentQuery('');

    // Update highlighting for the new value
    if (stableAgents.length > 0) {
      detectMentions(newValue);
    }

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + dashedName.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [mentionStartIndex, agentQuery, value, onChange, stableAgents.length, detectMentions]);

  const handleRemoveLongText = useCallback((id: string) => {
    setLongTextDocuments(prev => prev.filter(doc => doc.id !== id));
  }, [setLongTextDocuments]);

  const handleOpenTextModal = useCallback((content: string) => {
    setModalContent(content);
  }, []);

  const handleCloseTextModal = useCallback(() => {
    setModalContent(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAgentDropdown && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAgentIndex(prev => (prev + 1) % filteredAgents.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAgentIndex(prev => prev === 0 ? filteredAgents.length - 1 : prev - 1);
        return;
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (filteredAgents[selectedAgentIndex]) {
          handleAgentSelect(filteredAgents[selectedAgentIndex]);
        }
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (filteredAgents[selectedAgentIndex]) {
          handleAgentSelect(filteredAgents[selectedAgentIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAgentDropdown(false);
        setSelectedAgentIndex(0);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSubmit();
    }
  }, [disabled, filteredAgents, handleAgentSelect, handleSubmit, selectedAgentIndex, showAgentDropdown]);

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ""; // reset for re-uploading same file
    }
  }, [setAttachedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, [setAttachedFiles]);

  const handleAutoRouteToggle = () => {
    setSetting('agent.autoRoute', (!autoRouteEnabled).toString());
  };

  // Calculate dropdown position when it should be shown
  useEffect(() => {
    if (showAgentDropdown && textareaRef.current) {
      const textarea = textareaRef.current;
      const container = textarea.closest('.max-w-4xl');

      if (container) {
        const textareaBounds = textarea.getBoundingClientRect();
        const containerBounds = container.getBoundingClientRect();

        setAgentDropdownPosition({
          top: textareaBounds.top - containerBounds.top - 10,
          left: textareaBounds.left - containerBounds.left
        });
      }
    }
  }, [showAgentDropdown, value]);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      // focus at the end of the textarea
      const endPosition = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(endPosition, endPosition);
      textareaRef.current?.focus();
    }
  }, [disabled])

  // Close agent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false);
      }
    };

    if (showAgentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAgentDropdown]);

  // Model selector logic for dialog type
  const filteredModels = models?.filter(model =>
    model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const totalPages = Math.ceil(filteredModels.length / modelsPerPage);
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * modelsPerPage,
    currentPage * modelsPerPage
  );

  const selectedModelDetails = models?.find(m => m.id === selectedModel);

  const handleSelectModel = useCallback((modelId: string) => {
    setSelectedModel(parseInt(modelId));
    setDialogOpen(false);
  }, [setSelectedModel]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const isSubmitDisabled = (!value.trim() && longTextDocuments.length === 0) || disabled;

  return (
    <div className={`${containerClassName} relative`}>
      {/* Long Text Preview Cards - Outside input field */}
      <ContentPreviewCards
        documents={longTextDocuments}
        onViewDocument={handleOpenTextModal}
        onRemoveDocument={handleRemoveLongText}
      />

      {/* Selected Text Context Display */}
      {selectedTextContext && (
        <div className="mb-3 inline-flex items-center gap-2 p-2 px-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full">
          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {selectedTextContext.wordCount} word{selectedTextContext.wordCount !== 1 ? 's' : ''} selected
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            from {selectedTextContext.messageType === 'user' ? 'your message' : 'assistant response'}
          </div>
          <button
            onClick={() => setSelectedTextContext?.(null)}
            className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-500">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={5}
          className="w-full p-4 resize-none leading-relaxed focus-visible:ring-transparent border-0 shadow-none min-h-[3rem] max-h-[12rem]"
          style={{ overflowWrap: 'anywhere' }}
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
            {highlightedMentions.length > 0 ? (
              highlightedMentions.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {highlightedMentions.map((mention, index) => (
                    <div
                      key={`${mention.agent}-${mention.start}-${index}`}
                      className="max-w-72 text-nowrap overflow-hidden inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs border border-purple-200 dark:border-purple-700"
                    >
                      <Bot className="h-3 w-3 shrink-0" />
                      <span className="min-w-0 overflow-ellipsis overflow-hidden">{mention.agent}</span>
                      <X className="h-3 w-3 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer shrink-0"
                        onClick={() => {
                          const beforeMention = value.substring(0, mention.start);
                          const afterMention = value.substring(mention.end);
                          const newValue = `${beforeMention}${afterMention}`;
                          onChange(newValue);
                          setHighlightedMentions(prev => prev.filter(m => m !== mention));
                        }} />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <>
                {/* Model Selector */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={autoRouteEnabled} variant="ghost" className="h-8 px-3 text-xs border-0 flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                      <span className="text-sm font-medium truncate max-w-[100px]">
                        {selectedModelDetails?.display_name || "Select Model"}
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
                            onClick={() => handleSelectModel(model.id.toString())}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${selectedModel === model.id
                              ? 'bg-neutral-100 dark:bg-neutral-700'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{model.display_name}</div>
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

                {/* Auto-Route Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${autoRouteEnabled
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        onClick={handleAutoRouteToggle}
                        aria-label={`Auto-routing ${autoRouteEnabled ? 'enabled' : 'disabled'}`}
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        Auto-routing: {autoRouteEnabled ? 'ON' : 'OFF'}
                        <br />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {autoRouteEnabled
                            ? 'Messages are routed to the best agent'
                            : 'All messages go to the main agent'
                          }
                        </span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            {/* Attachment Button */}
            <div>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                onClick={handleFileInputClick}
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            {/* Send/Cancel Button */}
            {showCancelButton ? (
              <Button
                onClick={onCancel}
                size="icon"
                variant="ghost"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                size="icon"
                variant="ghost"
              >
                {sendButtonContent || <Send className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Mention Dropdown */}
      {showAgentDropdown && filteredAgents.length > 0 && (
        <div
          ref={agentDropdownRef}
          className="absolute z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg max-h-[200px] overflow-y-auto w-64"
          style={{
            top: `${agentDropdownPosition.top}px`,
            left: `${agentDropdownPosition.left}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="p-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 px-2">
              Select an agent
            </div>
            <div className="space-y-1">
              {filteredAgents.map((agent, index) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${index === selectedAgentIndex
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                >
                  <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="min-w-0">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="File input"
      />

      {/* Text Viewer Modal */}
      <TextViewerModal
        isOpen={!!modalContent}
        onClose={handleCloseTextModal}
        content={modalContent || ''}
      />
    </div>
  );
}
