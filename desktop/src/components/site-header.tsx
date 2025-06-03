import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useMatches, useNavigate } from "@tanstack/react-router"
import { Bell, LogOut, User } from "lucide-react"
import { Fragment, useState } from "react"
import { CommandMenu } from "./command-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"

const ROUTE_BREADCRUMB_MAP: Record<string, string[]> = {
  "/": ["Basetable", "New Chat"],
  "/chats": ["Basetable", "Chat History"],
  "/chat/$chatId": ["Basetable", "Chat"],
  "/agent": ["Basetable", "Main Agent"],
  "/agents": ["Basetable", "New Agent"],
  "/agent/$agentId": ["Basetable", "Agent"],
  "/dashboard": ["Basetable", "Dashboard"],
  "/mcp-servers": ["Basetable", "MCP Servers"],
  "/settings/_layout/appearance": ["Basetable", "Settings", "Appearance"],
  "/settings/_layout/account": ["Basetable", "Settings", "Account"],
  "/settings/_layout/security": ["Basetable", "Settings", "Security"],
  "/settings/_layout/billing": ["Basetable", "Settings", "Billing"],
  "/settings/_layout/data": ["Basetable", "Settings", "Data"],
  "/settings/_layout/privacy": ["Basetable", "Settings", "Privacy"],
}

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function SiteHeader() {
  const { user, logout } = useAuth()
  const matches = useMatches()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const dummyNotifications = [
    { id: 1, title: "Welcome to Basetable!", body: "Thanks for joining. Explore your dashboard to get started.", time: "Just now" },
    { id: 2, title: "Agent Updated", body: "Your agent 'SupportBot' was updated successfully.", time: "5 min ago" },
    { id: 3, title: "New Message", body: "You have a new message in Chat #1234.", time: "10 min ago" },
    { id: 4, title: "Billing Notice", body: "Your invoice for May is ready.", time: "1 hour ago" },
  ]

  // Find the current routeId from the last match
  const currentRoute = matches[matches.length - 1]?.routeId
  const currentRouteId = currentRoute?.endsWith("/") && currentRoute !== "/" ? currentRoute.slice(0, -1) : currentRoute
  const breadcrumbNames = ROUTE_BREADCRUMB_MAP[currentRouteId] || ["Home"]

  // Build breadcrumb paths for navigation
  let pathAccumulator = ""
  const breadcrumbPaths = breadcrumbNames.map((_, idx) => {
    // Find the route in the map that matches this breadcrumb trail up to idx
    const entry = Object.entries(ROUTE_BREADCRUMB_MAP).find(([, arr]) =>
      arr.slice(0, idx + 1).join("/") === breadcrumbNames.slice(0, idx + 1).join("/")
    )
    if (entry) {
      pathAccumulator = entry[0]
    }
    return pathAccumulator
  })

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="flex h-14 w-full items-center gap-2 px-4 justify-between">
        <Breadcrumb className={typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? "pl-20" : undefined}>
          <BreadcrumbList>
            {breadcrumbNames.map((label, i) => {
              const isLast = i === breadcrumbNames.length - 1
              const to = breadcrumbPaths[i]
              return (
                <Fragment key={to + label}>
                  <BreadcrumbItem key={to + label}>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink onClick={() => navigate({ to })} className="cursor-pointer">
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <CommandMenu />
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen(true)}>
            <Bell className="w-4 h-4" />
          </Button>
          <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
            <SheetContent side="right" className="p-0 w-80 sm:w-96">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="divide-y max-h-[80vh] overflow-y-auto">
                {dummyNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No notifications</div>
                ) : (
                  dummyNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 flex gap-3 items-start hover:bg-accent/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-1">
                        {notif.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{notif.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{notif.body}</div>
                        <div className="text-[10px] text-muted-foreground mt-2">{notif.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback>
                  {user?.name ? getUserInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56" align="end" forceMount alignOffset={-20} sideOffset={13}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
