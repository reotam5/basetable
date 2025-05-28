import { AppSidebar } from "@/components/app-sidebar";
import { Header } from '@/components/header';
import { ProtectedRoute } from "@/components/protected-route";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: Root,
})

function MainContent() {
  const { setOpen } = useSidebar()

  return (
    <>
      <div className="fixed top-0 left-0 w-2 h-full z-50 hover:bg-blue-100/20" onMouseEnter={() => setOpen(true)} />
      <div className="fixed top-0 left-0 h-full z-40">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col w-full">
        <Header />
        <main className="flex-1 p-6 w-full">
          <Outlet />
        </main>
      </div>
    </>
  )
}

function Root() {
  return (
    <>
      <ProtectedRoute>
        <div className="min-h-screen w-full" style={{ backgroundColor: "#fbf8f1" }}>
          <SidebarProvider defaultOpen={false}>
            <div className="relative flex min-h-screen w-full">
              <MainContent />
            </div>
          </SidebarProvider>
        </div>
      </ProtectedRoute>
      <TanStackRouterDevtools />
    </>
  )
}