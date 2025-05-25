"use client";

import {
  MessageSquare,
  LayoutDashboard,
  Server,
  FileText,
  GitBranch,
  Brain,
  SettingsIcon,
  Zap,
} from "lucide-react";
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

const menuItems = [
  {
    title: "Chat",
    icon: MessageSquare,
    id: "chat",
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
  },
  {
    title: "MCP Servers",
    icon: Server,
    id: "mcp-servers",
  },
  {
    title: "Prompt Management",
    icon: FileText,
    id: "prompt-management",
  },
  {
    title: "Routing Rules",
    icon: GitBranch,
    id: "routing-rules",
  },
  {
    title: "System Prompts",
    icon: Brain,
    id: "system-prompts",
  },
  {
    title: "Settings",
    icon: SettingsIcon,
    id: "settings",
  },
];

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function AppSidebar({
  activeSection,
  setActiveSection,
}: AppSidebarProps) {
  const { setOpen } = useSidebar();

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
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      setActiveSection(item.id);
                      setOpen(false);
                    }}
                    isActive={activeSection === item.id}
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
