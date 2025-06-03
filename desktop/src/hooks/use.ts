import { useCallback, useEffect, useRef, useState } from "react";

export function use<T>({ fetcher, dependencies = [] }: {
  fetcher?: () => Promise<T>;
  dependencies?: any[];
}): {
  data: T | null;
  error: Error | null;
  isLoading: boolean,
  refetch: () => Promise<void>,
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  const dependenciesRef = useRef(dependencies);

  // Update fetcher and dependencies refs when they change
  useEffect(() => {
    fetcherRef.current = fetcher;
    dependenciesRef.current = dependencies;
  }, [fetcher, dependencies]);

  const fetch = useCallback(async () => {
    if (!fetcherRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when component mounts or when dependencies change
  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch, ...dependencies]);

  return {
    data,
    error,
    isLoading,
    refetch: fetch
  }
}