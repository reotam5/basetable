import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ChatInputProvider } from '@/contexts/chat-input-context'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { CSSProperties } from 'react'

const appStateStore = window.store.createStore({ name: 'app-state' });

export const Route = createFileRoute('/__app_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ChatInputProvider>
      <div>
        <SidebarProvider
          className="flex flex-col min-h-screen"
          defaultOpen={appStateStore.get('isSidebarPinned') ?? true}
          style={{
            "--sidebar-width-icon": "0px",
            "--sidebar-width": "200px",
            "--sidebar-width-mobile": "200px",
          } as CSSProperties}
        >
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <div className="flex-1">
              <div className="max-w-[1216px] mx-auto w-full min-h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </ChatInputProvider>
  )
}
