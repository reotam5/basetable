import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  exp?: number;
}

interface AuthContextType {
  user: User | null;
  isSigningIn?: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding?: boolean;
  login: () => void;
  logout: () => void;
  cancelAuth: () => void;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const store = window.store.createStore({ name: "app-state" });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isSilentlySigningIn = useRef<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(!!store.get("onboarding-complete"));
  const setHasCompletedOnboarding = (value: boolean) => {
    setHasCompletedOnboardingState(value);
    store.set("onboarding-complete", value);
  };


  useEffect(() => {
    const onLoginComplete = ([{ accessToken, profile }]) => {
      setIsSigningIn(false);
      setUser({
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        exp: profile.exp,
      });
      setToken(accessToken);
      setHasCompletedOnboarding(true);
    }
    const cleanup = window.electronAPI.auth.onLoginComplete(onLoginComplete);
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (hasCompletedOnboarding && !user && !isSilentlySigningIn.current) {
      isSilentlySigningIn.current = true;
      window.electronAPI.auth.login(true).then(({ accessToken, profile }) => {
        isSilentlySigningIn.current = false;
        setUser({
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          exp: profile.exp,
        });
        setToken(accessToken);
      });
    }
  }, [hasCompletedOnboarding, user]);

  const login = () => {
    setIsSigningIn(true);
    // login will first try to use refresh token. 
    // If that fails, it will open the login window.
    // The onLoginComplete event will be triggered when the login is complete.
    window.electronAPI.auth.login();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setHasCompletedOnboarding(false);
    window.electronAPI.auth.logout();
  };

  const cancelAuth = () => {
    console.log("Auth cancelled by user");
    setIsSigningIn(false);
  };

  const getToken = async () => {
    if (token && user && user.exp && user.exp > Date.now() / 1000) {
      return token; // Return cached token if it's still valid
    }
    // If token is not valid or not available, get it from the API
    // this will also refresh the token if needed
    return await window.electronAPI.auth.accessToken();
  }

  return (
    <AuthContext.Provider value={{
      user,
      isSigningIn,
      isAuthenticated: !!user && !!token,
      hasCompletedOnboarding: hasCompletedOnboarding,
      login,
      logout,
      cancelAuth,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
