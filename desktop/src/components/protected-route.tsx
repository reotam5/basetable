import { SignIn } from "@/components/signin";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "@tanstack/react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasCompletedOnboarding, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!hasCompletedOnboarding) {
    navigate({ to: '/' });
    return <SignIn />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
