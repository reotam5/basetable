import { SplashScreen } from "./splash-screen";

export function PreLoginLoadingSplash() {
  return (
    <SplashScreen
      message="Initializing..."
    />
  );
}

export function PostLoginLoadingSplash() {
  return (
    <SplashScreen
      message="Setting up your workspace..."
    />
  );
}

export function ModelDownloadSplash() {
  return (
    <SplashScreen
      message="Preparing AI models..."
    />
  );
}