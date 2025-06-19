import { use } from "@/hooks/use";
import { useMatches, useNavigate } from "@tanstack/react-router";
import { Bot, Check, Edit, MoreHorizontal, Plus, Save, Trash, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { AnimatedText } from "./animated-text";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function AgentMenuItems() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = use({ fetcher: window.electronAPI.agent.getAll })
  const mainAgent = data?.find((agent) => agent.is_main);
  const subbAgents = data?.filter((agent) => !agent.is_main) || [];
  const matches = useMatches<any>();
  const currentMatch = matches[matches.length - 1];
  const routePattern = (currentMatch?.fullPath?.endsWith('/') && currentMatch?.fullPath.length > 1) ? currentMatch?.fullPath.slice(0, -1) : currentMatch?.fullPath;

  // State for inline editing
  const [editingAgentId, setEditingAgentId] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [loadingAgentId, setLoadingAgentId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const onAgentCreated = () => refetch();
    window.addEventListener("sidebar.refresh", onAgentCreated);
    return () => {
      window.removeEventListener("sidebar.refresh", onAgentCreated);
    }
  }, [refetch])

  React.useEffect(() => {
    const cleanup = window.electronAPI.agent.onNameUpdate((agentId: number) => {
      refetch();
      setLoadingAgentId(agentId);
    });

    return () => cleanup();
  }, [refetch])

  // Handle starting edit mode
  const startEditing = (agentId: number, currentName: string) => {
    setEditingAgentId(agentId);
    setEditingName(currentName);
  };

  // Handle canceling edit
  const cancelEditing = () => {
    setEditingAgentId(null);
    setEditingName("");
  };

  // Handle saving the edited name
  const saveName = async (agentId: number) => {
    if (!editingName.trim()) return;

    setIsUpdating(true);
    try {
      await window.electronAPI.agent.update(agentId, { name: editingName.trim() });
      setEditingAgentId(null);
      setEditingName("");
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));
      toast("Agent updated", {
        icon: <Save className="h-4 w-4" />,
        description: "Successfully updated agent.",
      })
    } catch (error) {
      console.error("Failed to update agent name:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle keyboard events for edit mode
  const handleKeyDown = (e: React.KeyboardEvent, agentId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName(agentId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Handle delete click
  const handleDeleteClick = (agent: { id: number; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    try {
      // Check if we're currently viewing the agent being deleted
      const currentAgentId = matches?.[matches.length - 1]?.params?.agentId;
      const isCurrentAgent = currentAgentId && Number(currentAgentId) === agentToDelete.id;

      await window.electronAPI.agent.delete(agentToDelete.id);

      if (isCurrentAgent) {
        const nextAgentIndex = subbAgents.findIndex(agent => agent.id === agentToDelete.id) + 1;
        // If there is a next agent, navigate to it, otherwise go to previous or main agent
        if (nextAgentIndex < subbAgents.length) {
          navigate({ to: `/agent/${subbAgents[nextAgentIndex].id}` as any });
        } else {
          const previousAgentIndex = subbAgents.findIndex(agent => agent.id === agentToDelete.id) - 1;
          if (previousAgentIndex >= 0) {
            navigate({ to: `/agent/${subbAgents[previousAgentIndex].id}` as any });
          } else {
            navigate({ to: "/agent" as any });
          }
        }
      }

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent("sidebar.refresh"));

      setDeleteDialogOpen(false);
      setAgentToDelete(null);
      toast("Agent deleted", {
        icon: <Trash2 className="h-4 w-4" />,
        description: "Successfully deleted agent.",
      })
    } catch (error) {
      console.error("Failed to delete agent:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setAgentToDelete(null);
  };

  return (
    <React.Fragment key={"agent-menu-items"}>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={routePattern === "/agent"} onClick={() => { navigate({ to: `/agent` }) }}>
          <Bot />
          <span>{mainAgent?.name ?? "Main Agent"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton isActive={routePattern === "/agents"} onClick={() => { navigate({ to: `/agents` }) }}>
          <Plus />
          <span>New Agent</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {
        isLoading && (!data || !(data.length > 0)) && (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="h-6 w-full mb-2 bg-sidebar-border dark:bg-sidebar-accent" key={index} />
          ))
        )
      }

      {
        subbAgents?.length > 0 && (
          <>
            <div className="ml-2 text-xs text-muted-foreground mt-2">
              Your agents
            </div>

            {subbAgents?.map((agent) => (
              <SidebarMenuItem key={agent.id}>
                <SidebarMenuButton
                  isActive={agent.id == matches?.[matches.length - 1]?.params?.agentId}
                  onClick={() => editingAgentId !== agent.id && navigate({ to: `/agent/${agent.id}` as any })}
                >
                  {editingAgentId === agent.id ? (
                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, agent.id)}
                        className="h-6 text-sm flex-1 min-w-0"
                        autoFocus
                        disabled={isUpdating}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => saveName(agent.id)}
                        disabled={isUpdating || !editingName.trim()}
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
                    agent.name?.length ? (
                      <span className="truncate">
                        {
                          loadingAgentId === agent.id ? (
                            <AnimatedText text={agent.name} />
                          ) : (
                            agent.name
                          )
                        }
                      </span>
                    ) : (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                    )
                  )}
                </SidebarMenuButton>

                {(editingAgentId !== agent.id && !!agent.name?.length) && (
                  <SidebarMenuAction showOnHover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MoreHorizontal className="h-3 w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(agent.id, agent.name);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick({ id: agent.id, name: agent.name }, e)}
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
          </>
        )
      }

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{agentToDelete?.name}"? This action cannot be undone.
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

