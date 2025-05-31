import { useChatSearch } from "@/hooks/use-chat-search";
import { useMatches, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function ChatMenuItems() {
  const navigate = useNavigate();
  const { filteredChats, isLoading } = useChatSearch()
  const matches = useMatches<any>();

  // Show skeleton loading state
  if (isLoading) {
    return (
      <React.Fragment key={"chat-menu-items-loading"}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-6 w-full mb-2 bg-sidebar-border dark:bg-sidebar-accent" key={index} />
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment key={"chat-menu-items"}>
      {filteredChats.map((item) => (
        <SidebarMenuButton key={item.title} isActive={matches?.[matches.length - 1]?.params?.chatId === item.id} onClick={() => { navigate({ to: `/chat/${item.id}` as any }) }}>
          <span>{item.title}</span>
        </SidebarMenuButton>
      ))}
    </React.Fragment>
  )
}
