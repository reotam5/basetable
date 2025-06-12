"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import logo from "../../public/light_logo.png";

interface RedirectPageProps {
  /** The path for the custom URL scheme redirect (e.g., "auth/login", "payment/success") */
  redirectPath: string;
  /** The main heading text */
  title: string;
  /** The description text below the title */
  description: string;
  /** Optional icon to display above the title */
  icon?: ReactNode;
  /** Optional custom redirect message */
  redirectMessage?: string;
  /** Optional message to display after the redirect */
  afterRedirectMessage?: string;
}

export default function RedirectPage({
  redirectPath,
  title,
  description,
  icon,
  redirectMessage = "Redirecting back to app...",
}: RedirectPageProps) {
  const searchParams = useSearchParams();
  const [redirected, setRedirected] = useState(false);
  // Get all search parameters
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    params.append(key, value);
  });

  // Construct the redirect URL with parameters
  const redirectUrl = `basetable://${redirectPath}${params.toString() ? `?${params.toString()}` : ''}`;

  useEffect(() => {
    // Redirect after 3 seconds
    const redirectTimeout = setTimeout(() => {
      window.location.href = redirectUrl;
      setRedirected(true);
    }, 1000);

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [redirectUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-5">
          {/* Header with logo and brand */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-1">
              <Image src={logo} alt="Basetable logo" className="size-12" />
              <h1 className="font-medium text-foreground">Basetable</h1>
            </div>
          </div>

          {/* Main content */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              {/* Optional icon */}
              {icon && icon}

              <h2 className="text-2xl font-medium text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground text-base">
                {description}
              </p>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-2">
                {
                  !redirected &&
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
                }
                <p className="text-sm text-muted-foreground">
                  {redirected ? "You can safely close this window." : redirectMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
