import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/theme-context";
import type { FileRouteTypes } from "@/routeTree.gen";
import { useMatches, useNavigate } from "@tanstack/react-router";
import {
    Bot,
    Cable,
    LayoutDashboard,
    LucideIcon,
    MessageSquare,
    MessagesSquare,
    Pin,
    PinOff,
    Plus,
    SettingsIcon,
    ShieldUser
} from "lucide-react";
import * as React from "react";
import { AgentMenuItems } from "./agent-menu-items";
import { ChatMenuItems } from "./chat-menu-items";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const data: {
    title: string;
    icon: LucideIcon;
    url: FileRouteTypes["fullPaths"][];
    items?: {
        title?: string;
        url?: FileRouteTypes["fullPaths"][];
        icon?: LucideIcon;
        onRender?: (_: { ChatMenuItems: React.ReactNode, AgentMenuItems: React.ReactNode }) => React.ReactNode;
    }[];
}[] = [
        {
            title: "Chat",
            url: ["/", "/chats", "/chat/$chatId"],
            icon: MessageSquare,
            items: [
                {
                    title: "New Chat",
                    url: ["/"],
                    icon: Plus,
                },
                {
                    title: "Chats",
                    url: ["/chats"],
                    icon: MessagesSquare,
                },
                {
                    onRender: ({ ChatMenuItems }) => ChatMenuItems,
                }
            ]
        },
        {
            title: "Agents",
            url: ["/agent", "/agents", "/agent/$agentId"],
            icon: Bot,
            items: [
                {
                    onRender: ({ AgentMenuItems }) => AgentMenuItems
                }
            ]
        },
        {
            title: "Admin",
            url: ["/dashboard", "/mcp-servers", "/settings/appearance", "/settings/account", "/settings/security", "/settings/billing", "/settings/data", "/settings/privacy"],
            icon: ShieldUser,
            items: [
                {
                    title: "Dashboard",
                    url: ["/dashboard"],
                    icon: LayoutDashboard,
                },
                {
                    title: "MCP Servers",
                    url: ["/mcp-servers"],
                    icon: Cable,
                },
                {
                    title: "Settings",
                    url: ["/settings/appearance", "/settings/account", "/settings/security", "/settings/billing", "/settings/data", "/settings/privacy"],
                    icon: SettingsIcon,
                },
            ]
        },
    ]
const appStateStore = window.store.createStore({ name: 'app-state' });


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { logo } = useTheme();
    const navigate = useNavigate();
    const { setOpen: _setOpen, open: _open, setOpenMobile: _setOpenMobile } = useSidebar();
    const matches = useMatches();
    const currentMatch = matches[matches.length - 1];
    const routePattern = (currentMatch?.fullPath?.endsWith('/') && currentMatch?.fullPath.length > 1) ? currentMatch?.fullPath.slice(0, -1) : currentMatch?.fullPath;
    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
    const [hoveredItemBackup, setHoveredItemBackup] = React.useState<string | null>(null);
    const subMenues = (hoveredItemBackup ? data.find(item => item.title === hoveredItemBackup)?.items : data.find((item) => item.url.includes(routePattern as any))?.items) ?? [];
    const [isPinned, _setIsPinned] = React.useState(appStateStore.get('isSidebarPinned') ?? true);
    const setIsPinned = (value: boolean) => {
        _setIsPinned(value);
        appStateStore.set('isSidebarPinned', value);
    }
    const open = isPinned || _open;
    const setOpen = (value: boolean) => {
        _setOpen(isPinned ? true : value);
        _setOpenMobile(isPinned ? true : value);
    };
    const isMounted = React.useRef(false);

    React.useEffect(() => {
        if (isMounted.current) return;
        isMounted.current = true;
        _setOpen(isPinned);
    }, [isPinned, _setOpen]);

    React.useEffect(() => {
        const parentItem = data.find((item) => item.url.includes(routePattern as any));
        setHoveredItemBackup(parentItem?.title ?? null);
        setHoveredItem(parentItem?.title ?? null);
    }, [routePattern]);

    return (
        <div
            className={`relative ${isPinned ? "flex mr-[272px]" : "mr-[72px]"}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => {
                setOpen(false)
                setHoveredItem(isPinned ? data.find((item) => item.url.includes(routePattern as any))?.title ?? null : null);
                setHoveredItemBackup(isPinned ? data.find((item) => item.url.includes(routePattern as any))?.title ?? null : hoveredItemBackup);
            }}
            {...props}
        >
            <Sidebar
                className={`w-[72px] z-50 fixed`}
                collapsible="none"
            >
                <SidebarHeader className="mb-3 mt-2">
                    <a className="flex items-center justify-center cursor-pointer" onClick={() => navigate({ to: '/' })}>
                        <img src={logo} className="rounded-2xl size-11" />
                    </a>
                </SidebarHeader>
                <SidebarContent className="overflow-visible">
                    <SidebarGroup>
                        <SidebarMenu>
                            {data.map((item) => (
                                <div
                                    className={"px-[10px] -mx-[10px]"}
                                    key={item.title}
                                    onMouseEnter={() => {
                                        if (open) return;
                                        setHoveredItem(item.title)
                                        setHoveredItemBackup(item.title);
                                    }}
                                >
                                    <SidebarMenuItem style={{ height: 'fit-content' }}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.url.includes(routePattern as any) || hoveredItem === item.title}
                                            className="group bg-transparent hover:bg-transparent data-[active=true]:bg-transparent active:bg-transparent"
                                            onClick={() => {
                                                navigate({ to: item.url[0] as any });
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-2 h-full cursor-pointer text-accent-foreground select-none">
                                                <div
                                                    onMouseEnter={() => {
                                                        if (!open) return;
                                                        setHoveredItem(item.title)
                                                        setHoveredItemBackup(item.title);
                                                    }}
                                                    className="group-data-[active=true]:bg-sidebar-accent p-[6px] -m-[6px] rounded-sm"
                                                >
                                                    <item.icon className="group-data-[active=true]:text-sidebar-accent-foreground" />
                                                </div>
                                                <span className="font-normal text-xs">{item.title}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </div>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>


            <div className={`fixed top-[calc(3.5rem+1px)] left-[72px] z-40 h-full`} style={{ pointerEvents: open ? 'auto' : 'none' }}>
                <Sidebar
                    className="relative w-[201px] duration-75"
                    collapsible={"offcanvas"}
                >
                    <SidebarHeader className="pr-[20px] pt-4 text-sm ml-[7px]">
                        <div className="flex items-center justify-between">
                            <div>
                                {hoveredItemBackup}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsPinned(!isPinned)}>
                                {isPinned ? <PinOff /> : <Pin />}
                            </Button>
                        </div>
                        <Separator />
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarMenu>
                                {subMenues.map((item) => (
                                    item.onRender ? (item.onRender({ ChatMenuItems: <ChatMenuItems key={"chat-menu-items"} />, AgentMenuItems: <AgentMenuItems key={"agent-menu-items"} /> })) : (
                                        <SidebarMenuButton key={item.title} isActive={item.url?.includes(routePattern as any)} onClick={() => { navigate({ to: item.url?.[0] as any }) }}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    )
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
            </div>
        </div>
    )
}