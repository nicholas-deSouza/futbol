import { NextRequest, NextResponse } from "next/server";
import { findShortestPath } from "@/lib/graph";
import type { PathApiResponse, PathResult } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json<PathApiResponse>(
        {
          success: false,
          error: "Missing 'from' or 'to' parameter",
        },
        { status: 400 }
      );
    }

    const fromId = parseInt(fromParam);
    const toId = parseInt(toParam);

    if (isNaN(fromId) || isNaN(toId)) {
      return NextResponse.json<PathApiResponse>(
        {
          success: false,
          error: "Invalid player ID",
        },
        { status: 400 }
      );
    }

    const result = await findShortestPath(fromId, toId);

    const pathResult: PathResult = {
      found: result.found,
      degrees: result.found ? result.path.length - 1 : 0,
      path: result.path.map((step) => ({
        player: {
          id: step.player.playerId,
          name: step.player.name,
          imageUrl: step.player.imageUrl,
          position: step.player.position,
          country: step.player.country,
        },
        connection: step.connection,
      })),
      stats: {
        nodesExplored: result.nodesExplored,
        executionTimeMs: result.executionTimeMs,
      },
    };

    return NextResponse.json<PathApiResponse>({
      success: true,
      data: pathResult,
    });
  } catch (error) {
    console.error("Path finding error:", error);
    return NextResponse.json<PathApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to find path",
      },
      { status: 500 }
    );
  }
}
