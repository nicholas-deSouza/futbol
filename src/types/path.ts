import type { Player } from "./player";

export interface EdgeInfo {
  clubId: number;
  clubName: string;
  season: string;
}

export interface ConnectionStep {
  player: Player;
  connection: {
    club: string;
    season: string;
  } | null;
}

export interface PathResult {
  found: boolean;
  degrees: number;
  path: ConnectionStep[];
  stats: {
    nodesExplored: number;
    executionTimeMs: number;
  };
}
