import { useSettings } from "@/hooks/use-settings"
import { createContext, useContext, useEffect } from "react"

export type Font = "default" | "system" | "mono"

type FontProviderProps = {
  children: React.ReactNode
  defaultFont?: Font
  storageKey?: string
}

type FontProviderState = {
  font: Font
  setFont: (font: Font) => void
}

const initialState: FontProviderState = {
  font: "default",
  setFont: () => null,
}

const FontProviderContext = createContext<FontProviderState>(initialState)

export function FontProvider({
  children,
  defaultFont = "default",
  storageKey = "basetable-font",
  ...props
}: FontProviderProps) {
  const { settings: [font], setSetting, refetch } = useSettings({ keys: ["appearance.font"], defaults: { "appearance.font": localStorage.getItem(storageKey) || defaultFont } })
  const setFont = (font) => {
    setSetting("appearance.font", font)
    localStorage.setItem(storageKey, font)
  }


  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing font classes
    root.classList.remove("font-default", "font-system", "font-mono")

    if (font === "system") {
      root.classList.add("font-system")
      root.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    } else if (font === "mono") {
      root.classList.add("font-mono")
      root.style.fontFamily = "'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
    } else {
      root.classList.add("font-default")
      root.style.fontFamily = "'Open Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
    }
  }, [font])

  useEffect(() => {
    const cleanup = window.electronAPI.db.onSettingsImported(() => {
      refetch()
    })
    return () => {
      cleanup()
    }
  })

  const value = {
    font,
    setFont
  }

  return (
    <FontProviderContext.Provider {...props} value={value}>
      {children}
    </FontProviderContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontProviderContext)

  if (context === undefined)
    throw new Error("useFont must be used within a FontProvider")

  return context
}
