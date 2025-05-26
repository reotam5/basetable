import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { LogIn, Loader2, Shield, X } from "lucide-react";

export function SignIn() {
  const { login, isLoading, cancelAuth } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {isLoading
                  ? "Opening authentication page in your browser. Please complete the login process and return to this app."
                  : "You'll be redirected to our secure login page to authenticate with Auth0"}
              </p>
              {isLoading && (
                <p className="text-xs text-gray-500 mb-2">
                  If the browser didn't open automatically, please check your
                  browser or try again.
                </p>
              )}
            </div>

            {!isLoading ? (
              <Button onClick={login} className="w-full h-11" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In with Auth0
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

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
