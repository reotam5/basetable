import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/auth-context';
import "./globals.css";

// Import the generated route tree
import { ThemeProvider } from './contexts/theme-context';
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  history: createHashHistory()
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <ThemeProvider storageKey='ui-theme' defaultTheme='system'>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </StrictMode>,
  )
}