import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useFont } from "@/contexts/font-context"
import { useTheme } from "@/contexts/theme-context"
import { createFileRoute } from '@tanstack/react-router'
import { CodeXml, Monitor, Moon, Sun, Type } from "lucide-react"

export const Route = createFileRoute('/__app_layout/settings/_layout/appearance')({
  component: RouteComponent,
})


export function RouteComponent() {
  const { theme, setTheme } = useTheme()
  const { font, setFont } = useFont()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Color Mode</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md h-40 bg-white border-gray-200 ${theme === "light" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setTheme("light")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
              <Sun className="w-6 h-6 mb-2 dark:text-primary-foreground" />
              <h4 className="font-medium text-gray-900">Light</h4>
              <p className="text-xs text-gray-600 text-center">Light mode</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden relative h-40 border-gray-200 ${theme === "system" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setTheme("system")}
          >
            <div className="absolute inset-0">
              <div className="w-full h-full bg-white"></div>
              <div
                className="absolute inset-0 bg-neutral-950"
                style={{
                  clipPath: 'polygon(0% 100%, 100% 0%, 100% 100%)'
                }}
              ></div>
            </div>
            <CardContent className="flex flex-col items-center justify-center p-4 relative z-10 h-full">
              <div className="bg-white/95 backdrop-blur-sm rounded-md px-3 py-2">
                <Monitor className="w-6 h-6 mb-2 mx-auto dark:text-primary-foreground" />
                <h4 className="font-medium text-gray-900 text-center">Match System</h4>
                <p className="text-xs text-gray-700 text-center">Follow system preference</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md bg-neutral-950 border-gray-700 h-40 ${theme === "dark" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setTheme("dark")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
              <Moon className="w-6 h-6 mb-2 text-gray-100" />
              <h4 className="font-medium text-gray-100">Dark</h4>
              <p className="text-xs text-gray-400 text-center">Dark mode</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Font</h3>
        <p className="text-sm text-muted-foreground mb-4">Select your preferred font style</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${font === "default" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setFont("default")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Type className="w-6 h-6 mb-2" />
              <h4 className="font-medium">Default</h4>
              <p className="text-xs text-muted-foreground text-center">Basetable default</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${font === "system" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setFont("system")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Monitor className="w-6 h-6 mb-2" />
              <h4 className="font-medium">Match System</h4>
              <p className="text-xs text-muted-foreground text-center">Follow system font</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${font === "mono" ? "ring-2 ring-primary" : ""
              }`}
            onClick={() => setFont("mono")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 font-mono">
              <CodeXml className="w-6 h-6 mb-2" />
              <h4 className="font-medium">Monospace</h4>
              <p className="text-xs text-muted-foreground text-center">Fixed-width font</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}