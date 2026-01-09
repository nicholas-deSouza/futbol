import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/db/sqlite";
import type { Player, SearchApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limitParam = searchParams.get("limit");

    if (!query || query.length < 2) {
      return NextResponse.json<SearchApiResponse>({
        success: true,
        data: { players: [], total: 0 },
      });
    }

    const limit = limitParam ? parseInt(limitParam) : 10;
    const rows = await searchPlayers(query, Math.min(limit, 20));

    const players: Player[] = rows.map((row) => ({
      id: row.player_id,
      name: row.name,
      firstName: row.first_name || undefined,
      lastName: row.last_name || undefined,
      position: row.position || undefined,
      country: row.country || undefined,
      imageUrl: row.image_url || undefined,
      currentClub: row.current_club_name || undefined,
    }));

    return NextResponse.json<SearchApiResponse>({
      success: true,
      data: { players, total: players.length },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json<SearchApiResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to search players",
      },
      { status: 500 }
    );
  }
}
