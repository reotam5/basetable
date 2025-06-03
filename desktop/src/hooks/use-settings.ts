import { useAuth } from "@/contexts/auth-context";
import { useCallback, useEffect, useRef, useState } from "react";

type ISettingsParam = {
  keys: string[];
  defaults?: Record<string, any>;
}

export function useSettings({ keys, defaults = {} }: ISettingsParam) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const loaded = useRef(false);

  const setSetting = async (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (isAuthenticated) await window.electronAPI.settings.set(key, value);
  }

  const getSetting = async (key: string) => {
    if (!isAuthenticated) return defaults[key] || null;
    return await window.electronAPI.settings.get(key);
  }

  const fetch = useCallback(async () => {
    await Promise.all(keys.map(async (key) => {
      const value = await window.electronAPI.settings.get(key);
      if (value === null && defaults[key] !== undefined) {
        await window.electronAPI.settings.set(key, defaults[key]);
      }
      setSettings((prev) => ({ ...prev, [key]: value === null ? defaults[key] : value }));
    }));
    setIsLoading(false);
  }, [keys, defaults]);

  useEffect(() => {
    if (loaded.current) return;
    if (!isAuthenticated) return;
    loaded.current = true;
    fetch()
  }, [fetch, isAuthenticated]);

  return {
    settings: keys.map(key => settings[key]),
    setSetting,
    getSetting,
    isLoading,
    refetch: fetch,
  };
}