import { useAuth } from "@/contexts/auth-context";
import { SignIn } from "@/components/signin";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <>{children}</>;
}
