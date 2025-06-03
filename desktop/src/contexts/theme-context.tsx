import { useSettings } from "@/hooks/use-settings";
import { createContext, useContext, useEffect, useState } from "react";
import DarkLogo from "/dark_logo.png";
import LightLogo from "/light_logo.png";

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void,
  logo?: string
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  logo: DarkLogo,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [logo, setLogo] = useState<string>()
  const { settings: [theme], setSetting, refetch } = useSettings({ keys: ["appearance.theme"], defaults: { "appearance.theme": localStorage.getItem(storageKey) || defaultTheme } })
  const setTheme = (theme: Theme) => {
    localStorage.setItem(storageKey, theme)
    setSetting("appearance.theme", theme)
  }

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      setLogo(systemTheme === "dark" ? DarkLogo : LightLogo)
      return
    }

    setLogo(theme === "dark" ? DarkLogo : LightLogo)
    root.classList.add(theme)
  }, [theme])


  useEffect(() => {
    const cleanup = window.electronAPI.db.onSettingsImported(() => {
      refetch()
    })
    return () => {
      cleanup()
    }
  })

  const value = {
    theme,
    setTheme,
    logo,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}