import { SignIn } from "@/components/signin";
import { useAuth } from "@/contexts/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasCompletedOnboarding, isAuthenticated } = useAuth();

  if (!hasCompletedOnboarding) {
    return <SignIn />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
