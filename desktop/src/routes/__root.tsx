import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { FontProvider } from "@/contexts/font-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from "react";

export const Route = createRootRoute({
  component: Root,
})

let initialized = false;

function Root() {
  // handles navigation from main process
  const navigate = useNavigate();
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      window.electronAPI.window.initialized();
    }
    const cleanup = window.electronAPI.window.onNavigate((url) => {
      navigate({ to: url })
    })
    return () => cleanup();
  }, [navigate]);

  return (
    <>
      <AuthProvider>
        <ThemeProvider storageKey='ui-theme' defaultTheme='system'>
          <FontProvider>
            <Outlet />
            <Toaster />
          </FontProvider>
        </ThemeProvider>
      </AuthProvider>
      <TanStackRouterDevtools />
    </>
  )
}