import { use } from "@/hooks/use";
import { useMatches, useNavigate } from "@tanstack/react-router";
import { Bot, Plus } from "lucide-react";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

export function AgentMenuItems() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = use({ fetcher: window.electronAPI.agent.getAll })
  const mainAgent = data?.find((agent: any) => agent.is_main);
  const subbAgents = data?.filter((agent: any) => !agent.is_main);
  const matches = useMatches<any>();
  const currentMatch = matches[matches.length - 1];
  const routePattern = (currentMatch?.fullPath?.endsWith('/') && currentMatch?.fullPath.length > 1) ? currentMatch?.fullPath.slice(0, -1) : currentMatch?.fullPath;

  React.useEffect(() => {
    const onAgentCreated = () => refetch();
    window.addEventListener("sidebar.refresh", onAgentCreated);
    return () => {
      window.removeEventListener("sidebar.refresh", onAgentCreated);
    }
  }, [refetch])

  return (
    <React.Fragment key={"chat-menu-items"}>
      <SidebarMenuButton isActive={routePattern === "/agent"} onClick={() => { navigate({ to: `/agent` }) }}>
        <Bot />
        <span>{mainAgent?.name ?? "Main Agent"}</span>
      </SidebarMenuButton>

      <SidebarMenuButton isActive={routePattern === "/agents"} onClick={() => { navigate({ to: `/agents` }) }}>
        <Plus />
        <span>New Agent</span>
      </SidebarMenuButton>

      {
        isLoading && !(data?.length > 0) && (
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
              <SidebarMenuButton key={agent.id} isActive={agent.id == matches?.[matches.length - 1]?.params?.agentId} onClick={() => { navigate({ to: `/agent/${agent.id}` as any }) }}>
                <span>{agent.name}</span>
              </SidebarMenuButton>
            ))}
          </>
        )
      }
    </React.Fragment>
  )
}

