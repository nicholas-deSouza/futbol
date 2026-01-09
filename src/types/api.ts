import type { PlayerSearchResult } from "./player";
import type { PathResult } from "./path";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SearchApiResponse = ApiResponse<PlayerSearchResult>;
export type PathApiResponse = ApiResponse<PathResult>;
