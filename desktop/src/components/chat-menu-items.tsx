import { useChatSearch } from "@/hooks/use-chat-search";
import { useMatches, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function ChatMenuItems() {
  const navigate = useNavigate();
  const { filteredChats, isLoading, refetch } = useChatSearch()
  const matches = useMatches<any>();

  React.useEffect(() => {
    const onChatCreated = () => refetch();
    window.addEventListener("sidebar.refresh", onChatCreated);
    return () => {
      window.removeEventListener("sidebar.refresh", onChatCreated);
    }
  }, [refetch])

  // Show skeleton loading state
  if (isLoading) {
    return (
      <React.Fragment key={"chat-menu-items-loading"}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={"chat-loading" + index} className="h-6 w-full mb-2 bg-sidebar-border dark:bg-sidebar-accent" key={index} />
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
        <SidebarMenuButton key={"chat" + item.id} isActive={matches?.[matches.length - 1]?.params?.chatId == item.id} onClick={() => { navigate({ to: `/chat/${item.id}` as any }) }}>
          <span>{item.title}</span>
        </SidebarMenuButton>
      ))}
    </React.Fragment>
  )
}
