import { useTheme } from "@/contexts/theme-context";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface SplashScreenProps extends React.ComponentPropsWithoutRef<"div"> {
  message?: string;
}

export function SplashScreen({
  message = "Loading...",
  ...props
}: SplashScreenProps) {
  const { logo } = useTheme();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
  });

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted p-6"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      {...props}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 font-medium -ml-3">
          <img src={logo} className="h-14 w-14 rounded-lg" alt="Basetable Logo" />
          <span className="text-2xl text-foreground tracking-tight font-semibold">
            Basetable
          </span>
        </div>

        {/* Loading Indicator */}
        <div
          className="flex items-center gap-3"
          style={{
            animation: "splash-fade-in 0.8s ease-out"
          } as React.CSSProperties}>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">{message}</span>
        </div>
      </div>
    </div>
  );
}
