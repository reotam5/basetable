import { createContext, useContext, useEffect, useState } from "react"

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
  const [font, setFont] = useState<Font>(
    () => (localStorage.getItem(storageKey) as Font) || defaultFont
  )

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

  const value = {
    font,
    setFont: (font: Font) => {
      localStorage.setItem(storageKey, font)
      setFont(font)
    },
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
