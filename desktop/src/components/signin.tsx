import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, LogIn, X } from "lucide-react";
import { useEffect, useRef } from "react";


export function SignIn({ ...props }: React.ComponentPropsWithoutRef<"div">) {
  const { login, isSigningIn, cancelAuth } = useAuth();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    window.electronAPI.window.resize.onboarding();
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="flex w-full max-w-sm flex-col gap-6" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <img src="/logo.jpeg" className="h-8 w-8 rounded-2xl" />
          </div>
          Basetable
        </a>
        <div className={"flex flex-col gap-6"} {...props}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>
                {isSigningIn
                  ? "Please complete the login process in your browser and return to this app."
                  : "After clicking ‘Login,’ you will be securely redirected to our authentication page."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    {!isSigningIn ? (
                      <Button onClick={login} className="w-full h-11" size="lg">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button disabled className="w-full h-11" size="lg">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Waiting for authentication...
                        </Button>
                        <Button
                          onClick={cancelAuth}
                          variant="outline"
                          className="w-full h-9"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
            By clicking login, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}