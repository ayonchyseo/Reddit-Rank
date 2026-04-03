import { useState, useCallback } from "react";

const BASE = "/api/reddit";

export async function fetchReddit(
  path: string,
  params: Record<string, string> = {},
) {
  const qs = new URLSearchParams({ path, ...params }).toString();
  const res = await fetch(`${BASE}?${qs}`);
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Reddit rate limit hit. Please wait 30 seconds.");
    }
    throw new Error("Reddit API error");
  }
  return res.json();
}

// Helper hook to manage loading/error states for Reddit calls
export function useReddit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <T>(promise: Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await promise;
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, error, execute };
}
