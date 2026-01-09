"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player } from "@/types";

interface UsePlayerSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: Player[];
  isLoading: boolean;
  error: string | null;
}

export function usePlayerSearch(debounceMs: number = 300): UsePlayerSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.data.players);
      } else {
        setError(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      setError("Failed to search players");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, search]);

  return { query, setQuery, results, isLoading, error };
}
