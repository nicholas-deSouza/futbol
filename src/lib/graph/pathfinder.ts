import { getGraph } from "./build-graph";
import { getPlayerById } from "../db/sqlite";
import type {
  TeammateGraph,
  PathNode,
  PathResult,
  ConnectionStep,
  PlayerNode,
} from "./types";

const MAX_DEPTH = 10;
const TIMEOUT_MS = 10000;

export async function findShortestPath(
  startPlayerId: number,
  endPlayerId: number
): Promise<PathResult> {
  const startTime = Date.now();

  // Edge case: same player
  if (startPlayerId === endPlayerId) {
    const player = await getPlayerById(startPlayerId);
    if (!player) {
      return {
        found: false,
        path: [],
        nodesExplored: 0,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      found: true,
      path: [
        {
          player: {
            playerId: player.player_id,
            name: player.name,
            imageUrl: player.image_url || undefined,
            position: player.position || undefined,
            country: player.country || undefined,
            currentClub: player.current_club_name || undefined,
          },
          connection: null,
        },
      ],
      nodesExplored: 1,
      executionTimeMs: Date.now() - startTime,
    };
  }

  const graph = await getGraph();

  // Check if players exist in graph
  if (!graph.has(startPlayerId) || !graph.has(endPlayerId)) {
    return {
      found: false,
      path: [],
      nodesExplored: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Bidirectional BFS
  const result = bidirectionalBFS(graph, startPlayerId, endPlayerId, startTime);

  // If path found, fetch player details
  if (result.found && result.rawPath.length > 0) {
    const path = await buildConnectionPath(result.rawPath);
    return {
      found: true,
      path,
      nodesExplored: result.nodesExplored,
      executionTimeMs: Date.now() - startTime,
    };
  }

  return {
    found: false,
    path: [],
    nodesExplored: result.nodesExplored,
    executionTimeMs: Date.now() - startTime,
  };
}

interface BFSResult {
  found: boolean;
  rawPath: number[];
  nodesExplored: number;
}

function bidirectionalBFS(
  graph: TeammateGraph,
  startId: number,
  endId: number,
  startTime: number
): BFSResult {
  // Forward search from start
  const forwardVisited = new Map<number, PathNode>();
  const forwardQueue: number[] = [startId];
  forwardVisited.set(startId, {
    playerId: startId,
    parent: null,
    direction: "forward",
  });

  // Backward search from end
  const backwardVisited = new Map<number, PathNode>();
  const backwardQueue: number[] = [endId];
  backwardVisited.set(endId, {
    playerId: endId,
    parent: null,
    direction: "backward",
  });

  let depth = 0;

  while (
    forwardQueue.length > 0 &&
    backwardQueue.length > 0 &&
    depth < MAX_DEPTH
  ) {
    // Check timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      break;
    }

    // Expand from smaller frontier
    if (forwardQueue.length <= backwardQueue.length) {
      const meetingPoint = expandFrontier(
        graph,
        forwardQueue,
        forwardVisited,
        backwardVisited,
        "forward"
      );

      if (meetingPoint !== null) {
        return {
          found: true,
          rawPath: reconstructPath(meetingPoint, forwardVisited, backwardVisited),
          nodesExplored: forwardVisited.size + backwardVisited.size,
        };
      }
    } else {
      const meetingPoint = expandFrontier(
        graph,
        backwardQueue,
        backwardVisited,
        forwardVisited,
        "backward"
      );

      if (meetingPoint !== null) {
        return {
          found: true,
          rawPath: reconstructPath(meetingPoint, forwardVisited, backwardVisited),
          nodesExplored: forwardVisited.size + backwardVisited.size,
        };
      }
    }

    depth++;
  }

  return {
    found: false,
    rawPath: [],
    nodesExplored: forwardVisited.size + backwardVisited.size,
  };
}

function expandFrontier(
  graph: TeammateGraph,
  queue: number[],
  thisVisited: Map<number, PathNode>,
  otherVisited: Map<number, PathNode>,
  direction: "forward" | "backward"
): number | null {
  const levelSize = queue.length;

  for (let i = 0; i < levelSize; i++) {
    const currentId = queue.shift()!;
    const currentNode = thisVisited.get(currentId)!;

    const neighbors = graph.get(currentId);
    if (!neighbors) continue;

    for (const neighborId of neighbors) {
      // Check if we've found a meeting point
      if (otherVisited.has(neighborId)) {
        // Add the connecting node to this side's visited
        if (!thisVisited.has(neighborId)) {
          thisVisited.set(neighborId, {
            playerId: neighborId,
            parent: currentNode,
            direction,
          });
        }
        return neighborId;
      }

      // If not visited by this side, add to queue
      if (!thisVisited.has(neighborId)) {
        thisVisited.set(neighborId, {
          playerId: neighborId,
          parent: currentNode,
          direction,
        });
        queue.push(neighborId);
      }
    }
  }

  return null;
}

function reconstructPath(
  meetingPoint: number,
  forwardVisited: Map<number, PathNode>,
  backwardVisited: Map<number, PathNode>
): number[] {
  // Build path from start to meeting point
  const forwardPath: number[] = [];
  let node = forwardVisited.get(meetingPoint);

  while (node) {
    forwardPath.unshift(node.playerId);
    node = node.parent || undefined;
  }

  // Build path from meeting point to end (skip meeting point itself)
  const backwardPath: number[] = [];
  node = backwardVisited.get(meetingPoint);

  if (node && node.parent) {
    node = node.parent;
    while (node) {
      backwardPath.push(node.playerId);
      node = node.parent || undefined;
    }
  }

  return [...forwardPath, ...backwardPath];
}

async function buildConnectionPath(
  rawPath: number[]
): Promise<ConnectionStep[]> {
  const path: ConnectionStep[] = [];

  for (let i = 0; i < rawPath.length; i++) {
    const playerId = rawPath[i];
    const player = await getPlayerById(playerId);

    if (!player) continue;

    const playerNode: PlayerNode = {
      playerId: player.player_id,
      name: player.name,
      imageUrl: player.image_url || undefined,
      position: player.position || undefined,
      country: player.country || undefined,
      currentClub: player.current_club_name || undefined,
    };

    // For connections, we show "Teammates" since we don't have specific club/season data
    const connection =
      i > 0
        ? {
            club: "Teammates",
            season: "",
          }
        : null;

    path.push({
      player: playerNode,
      connection,
    });
  }

  return path;
}
