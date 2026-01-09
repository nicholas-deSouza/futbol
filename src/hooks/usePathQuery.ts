"use client";

import { useState, useCallback } from "react";
import type { PathResult } from "@/types";

interface UsePathQueryResult {
  result: PathResult | null;
  isLoading: boolean;
  error: string | null;
  findPath: (fromId: number, toId: number) => Promise<void>;
  reset: () => void;
}

export function usePathQuery(): UsePathQueryResult {
  const [result, setResult] = useState<PathResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findPath = useCallback(async (fromId: number, toId: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/path?from=${fromId}&to=${toId}`);
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to find path");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, findPath, reset };
}
