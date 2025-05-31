import { useAgentSearch } from "@/hooks/use-agent-search";
import { useMatches, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function AgentMenuItems() {
  const navigate = useNavigate();
  const { agents, isLoading } = useAgentSearch()
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
      {agents.map((agent) => (
        <SidebarMenuButton key={agent.id} isActive={matches?.[matches.length - 1]?.params?.agentId === agent.id} onClick={() => { navigate({ to: `/agent/${agent.id}` as any }) }}>
          <span>{agent.title}</span>
        </SidebarMenuButton>
      ))}
    </React.Fragment>
  )
}

