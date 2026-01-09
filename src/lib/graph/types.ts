export interface PlayerNode {
  playerId: number;
  name: string;
  imageUrl?: string;
  position?: string;
  country?: string;
  currentClub?: string;
}

// Map<playerId, Set<teammateId>>
// Simple adjacency list since we don't have club/season info per edge
export type TeammateGraph = Map<number, Set<number>>;

export interface PathNode {
  playerId: number;
  parent: PathNode | null;
  direction: "forward" | "backward";
}

export interface PathResult {
  found: boolean;
  path: ConnectionStep[];
  nodesExplored: number;
  executionTimeMs: number;
}

export interface ConnectionStep {
  player: PlayerNode;
  connection: {
    club: string;
    season: string;
  } | null;
}
