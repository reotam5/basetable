import { useChatSearch } from "@/hooks/use-chat-search";
import { useMatches, useNavigate } from "@tanstack/react-router";
import { Check, Edit, MoreHorizontal, Trash, X } from "lucide-react";
import * as React from "react";
import { AnimatedText } from "./animated-text";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function ChatMenuItems() {
  const navigate = useNavigate();
  const { filteredChats, isLoading, refetch, deleteChat } = useChatSearch()
  const matches = useMatches<any>();

  // State for inline editing
  const [editingChatId, setEditingChatId] = React.useState<number | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [loadingChatId, setLoadingChatId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const onChatCreated = () => refetch();
    window.addEventListener("sidebar.refresh", onChatCreated);
    return () => {
      window.removeEventListener("sidebar.refresh", onChatCreated);
    }
  }, [refetch])

  React.useEffect(() => {
    const cleanup = window.electronAPI.chat.onTitleUpdate((chatId: number) => {
      refetch();
      setLoadingChatId(chatId)
    });

    return () => cleanup()
  }, [refetch])

  // Handle starting edit mode
  const startEditing = (chatId: number, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // Handle canceling edit
  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  // Handle saving the edited title
  const saveTitle = async (chatId: number) => {
    if (!editingTitle.trim()) return;

    setIsUpdating(true);
    try {
      await window.electronAPI.chat.update(chatId, { title: editingTitle.trim() });
      setEditingChatId(null);
      setEditingTitle("");
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));
    } catch (error) {
      console.error("Failed to update chat title:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle keyboard events for edit mode
  const handleKeyDown = (e: React.KeyboardEvent, chatId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle(chatId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Handle delete click
  const handleDeleteClick = (chat: { id: number; title: string }, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if Shift key is held down
    if (e.shiftKey) {
      // Skip confirmation dialog and delete immediately
      confirmDeleteWithoutDialog(chat);
    } else {
      setChatToDelete(chat);
      setDeleteDialogOpen(true);
    }
  };

  // Delete without confirmation dialog (when Shift+Click)
  const confirmDeleteWithoutDialog = async (chat: { id: number; title: string }) => {
    setIsDeleting(true);
    try {
      // Check if we're currently viewing the chat being deleted
      const currentChatId = matches?.[matches.length - 1]?.params?.chatId;
      const isCurrentChat = currentChatId && Number(currentChatId) === chat.id;

      await deleteChat(chat.id);

      // If we're deleting the currently viewed chat, navigate to home
      if (isCurrentChat) {
        navigate({ to: "/" as any });
      }

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!chatToDelete) return;

    setIsDeleting(true);
    try {
      // Check if we're currently viewing the chat being deleted
      const currentChatId = matches?.[matches.length - 1]?.params?.chatId;
      const isCurrentChat = currentChatId && Number(currentChatId) === chatToDelete.id;

      await deleteChat(chatToDelete.id);

      // If we're deleting the currently viewed chat, navigate to home
      if (isCurrentChat) {
        navigate({ to: "/chats" as any });
      }

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));

      setDeleteDialogOpen(false);
      setChatToDelete(null);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Show skeleton loading state
  if (isLoading) {
    return (
      <React.Fragment key={"chat-menu-items-loading"}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={"chat-loading" + index} className="h-6 w-full mb-2 bg-sidebar-border dark:bg-sidebar-accent" />
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment key={"chat-menu-items"}>
      {filteredChats.length > 0 && (
        <div key={"chat-divider"} className="ml-2 text-xs text-muted-foreground mt-2">
          Recents
        </div>
      )}
      {filteredChats.map((item) => (
        <SidebarMenuItem key={"chat" + item.id}>
          <SidebarMenuButton
            isActive={matches?.[matches.length - 1]?.params?.chatId == item.id}
            onClick={() => editingChatId !== item.id && navigate({ to: `/chat/${item.id}` as any })}
          >
            {editingChatId === item.id ? (
              <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  className="h-6 text-sm flex-1 min-w-0"
                  autoFocus
                  disabled={isUpdating}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => saveTitle(item.id)}
                  disabled={isUpdating || !editingTitle.trim()}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={cancelEditing}
                  disabled={isUpdating}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              item.title ? (
                <span className="truncate">
                  {
                    loadingChatId === item.id ? (
                      <AnimatedText text={item.title} />
                    ) : (
                      item.title
                    )
                  }
                </span>
              ) : (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
              )
            )}
          </SidebarMenuButton>

          {editingChatId !== item.id && item.title && (
            <SidebarMenuAction showOnHover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <MoreHorizontal className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(item.id, item.title);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteClick({ id: item.id, title: item.title }, e)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuAction>
          )}
        </SidebarMenuItem>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This action cannot be undone.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Tip: Hold Shift while clicking delete to skip this confirmation.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}
