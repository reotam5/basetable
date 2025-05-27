import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useMatches, useNavigate } from "@tanstack/react-router";
import {
    Brain,
    FileText,
    GitBranch,
    LayoutDashboard,
    MessageSquare,
    Server,
    SettingsIcon
} from "lucide-react";

const menuItems: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    id: FileRouteTypes["id"][];
}[] = [
        {
            title: "Chat",
            icon: MessageSquare,
            id: ["/", "/chat/"],
        },
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            id: ["/dashboard/"],
        },
        {
            title: "MCP Servers",
            icon: Server,
            id: ["/mcp-servers/"],
        },
        {
            title: "Prompt Management",
            icon: FileText,
            id: ["/prompt-management/"],
        },
        {
            title: "Routing Rules",
            icon: GitBranch,
            id: ["/routing-rules/"],
        },
        {
            title: "System Prompts",
            icon: Brain,
            id: ["/system-prompts/"],
        },
        {
            title: "Settings",
            icon: SettingsIcon,
            id: ["/settings/"],
        },
    ];

export function AppSidebar() {
    const navigate = useNavigate();
    const { setOpen } = useSidebar();
    const matches = useMatches()
    const currentMatch = matches[matches.length - 1];
    const route_pattern = currentMatch.routeId;

    return (
        <Sidebar
            className="border-r border-gray-200 bg-white"
            onMouseLeave={() => setOpen(false)}
        >
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">Workspace</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-gray-600 text-sm font-medium">
                        AI Control Center
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.id.at(0)}>
                                    <SidebarMenuButton
                                        onClick={() => {
                                            navigate({ to: item.id.at(0) as any })
                                            setOpen(false);
                                        }}
                                        isActive={item.id.includes(route_pattern)}
                                        className="w-full justify-start"
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}