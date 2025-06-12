import RedirectPage from "../../components/redirect-page";

export default function AuthPage() {
  return (
    <RedirectPage
      redirectPath="auth/login"
      title="Sign in complete"
      description="You have successfully signed in to your Basetable account."
    />
  );
}