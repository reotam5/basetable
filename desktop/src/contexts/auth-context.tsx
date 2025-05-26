import React, { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    auth: {
      openAuthUrl(): void;
      onAuthCallback(
        callback: (data: {
          token?: string;
          id_token?: string;
          state?: string;
          error?: string;
        }) => void,
      ): () => void;
    };
    store: {
      createStore(options: any): {
        get: (key: string) => unknown;
        set: (key: string, value: unknown) => void;
        delete: (key: string) => void;
        clear: () => void;
      };
    };
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  cancelAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const authStore =
  typeof window !== "undefined" && window.store
    ? window.store.createStore({ name: "auth-store" })
    : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load stored auth data on mount
  useEffect(() => {
    if (!authStore) return;

    const storedToken = authStore.get("token") as string | null;
    const storedUser = authStore.get("user") as User | null;

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Listen for auth callbacks from Electron
  useEffect(() => {
    if (!window.auth) return;

    const cleanup = window.auth.onAuthCallback((data) => {
      console.log(data);
      if (data.token) {
        setToken(data.token);

        // Decode JWT to get user info (simplified - in production, validate the token)
        let userData: User | null = null;
        try {
          if (data.id_token) {
            const payload = JSON.parse(atob(data.id_token.split(".")[1]));
            userData = {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
            };

            setUser(userData);
          }

          // Store auth data
          if (authStore) {
            authStore.set("token", data.token);
            authStore.set("user", userData);
          }

          console.log("Authentication successful:", userData);
        } catch (error) {
          console.error("Failed to decode token:", error);
        }
      }
      setIsLoading(false);
    });

    return cleanup;
  }, []);

  const login = () => {
    console.log("Login button clicked");
    console.log("window.auth available:", !!window.auth);
    setIsLoading(true);

    window.auth.openAuthUrl();
    // Keep loading state active while waiting for auth callback
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (authStore) {
      authStore.delete("token");
      authStore.delete("user");
    }
  };

  const cancelAuth = () => {
    console.log("Auth cancelled by user");
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    cancelAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
