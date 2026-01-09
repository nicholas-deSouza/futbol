import { getAllTeammates } from "../db/sqlite";
import type { TeammateGraph } from "./types";

let graph: TeammateGraph | null = null;
let graphPromise: Promise<TeammateGraph> | null = null;

export async function getGraph(): Promise<TeammateGraph> {
  if (graph) return graph;

  if (graphPromise) return graphPromise;

  graphPromise = buildGraph();
  graph = await graphPromise;

  return graph;
}

async function buildGraph(): Promise<TeammateGraph> {
  console.log("Building teammate graph...");
  const startTime = Date.now();

  // Get all teammate relationships from database
  const teammates = await getAllTeammates();
  console.log(`  Loaded ${teammates.length.toLocaleString()} teammate relationships`);

  // Build adjacency list
  const graph: TeammateGraph = new Map();

  for (const { player_id, teammate_id } of teammates) {
    // Add edge from player to teammate
    if (!graph.has(player_id)) {
      graph.set(player_id, new Set());
    }
    graph.get(player_id)!.add(teammate_id);

    // Add reverse edge (undirected graph)
    if (!graph.has(teammate_id)) {
      graph.set(teammate_id, new Set());
    }
    graph.get(teammate_id)!.add(player_id);
  }

  const elapsed = Date.now() - startTime;
  console.log(`  Graph built in ${elapsed}ms`);
  console.log(`  Nodes (players): ${graph.size.toLocaleString()}`);

  // Count edges
  let edgeCount = 0;
  for (const neighbors of graph.values()) {
    edgeCount += neighbors.size;
  }
  console.log(`  Edges (teammate connections): ${(edgeCount / 2).toLocaleString()}`);

  return graph;
}

export function getGraphStats(): {
  nodeCount: number;
  loaded: boolean;
} {
  return {
    nodeCount: graph?.size || 0,
    loaded: graph !== null,
  };
}
