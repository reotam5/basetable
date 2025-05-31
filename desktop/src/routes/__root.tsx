import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FontProvider } from "@/contexts/font-context";
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: Root,
})

const appStateStore = window.store.createStore({ name: 'app-state' });

function Root() {
  return (
    <>
      <FontProvider>
        <ProtectedRoute>
          <div>
            <SidebarProvider
              className="flex flex-col min-h-screen"
              defaultOpen={appStateStore.get('isSidebarPinned') ?? true}
              style={{
                "--sidebar-width-icon": "0px",
                "--sidebar-width": "200px",
                "--sidebar-width-mobile": "200px",
              } as React.CSSProperties}
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
        </ProtectedRoute>
      </FontProvider>
      <TanStackRouterDevtools />
    </>
  )
}