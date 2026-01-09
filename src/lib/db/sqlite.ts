import * as fs from "fs";
import * as path from "path";

// Dynamic import for sql.js to work in Next.js server components
let SQL: any = null;
let db: any = null;
let dbPromise: Promise<any> | null = null;

const DB_PATH = path.join(process.cwd(), "data", "processed", "futbol.db");
const WASM_PATH = path.join(
  process.cwd(),
  "node_modules",
  "sql.js",
  "dist",
  "sql-wasm.wasm"
);

async function initSQL() {
  if (SQL) return SQL;

  // Use dynamic import
  const initSqlJs = (await import("sql.js")).default;

  // Load the wasm file from the local file system
  const wasmBinary = fs.readFileSync(WASM_PATH);

  SQL = await initSqlJs({
    wasmBinary,
  });

  return SQL;
}

export async function getDatabase(): Promise<any> {
  if (db) return db;

  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const SQL = await initSQL();

    if (!fs.existsSync(DB_PATH)) {
      throw new Error(
        `Database not found at ${DB_PATH}. Please run 'npm run preprocess' first.`
      );
    }

    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    return db;
  })();

  return dbPromise;
}

export interface PlayerRow {
  player_id: number;
  name: string;
  position: string | null;
  country: string | null;
  image_url: string | null;
  current_club_id: number | null;
  current_club_name: string | null;
}

export interface TeammateRow {
  player_id: number;
  teammate_id: number;
  games_together: number;
}

export async function searchPlayers(
  query: string,
  limit: number = 10
): Promise<PlayerRow[]> {
  const db = await getDatabase();

  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const stmt = db.prepare(`
    SELECT player_id, name, position, country, image_url, current_club_id, current_club_name
    FROM players
    WHERE name_normalized LIKE ?
    ORDER BY
      CASE WHEN name_normalized LIKE ? THEN 0 ELSE 1 END,
      LENGTH(name)
    LIMIT ?
  `);

  stmt.bind([`%${normalized}%`, `${normalized}%`, limit]);

  const results: PlayerRow[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as unknown as PlayerRow;
    results.push(row);
  }
  stmt.free();

  return results;
}

export async function getPlayerById(
  playerId: number
): Promise<PlayerRow | null> {
  const db = await getDatabase();

  const stmt = db.prepare(`
    SELECT player_id, name, position, country, image_url, current_club_id, current_club_name
    FROM players
    WHERE player_id = ?
  `);

  stmt.bind([playerId]);

  let result: PlayerRow | null = null;
  if (stmt.step()) {
    result = stmt.getAsObject() as unknown as PlayerRow;
  }
  stmt.free();

  return result;
}

export async function getAllTeammates(): Promise<TeammateRow[]> {
  const db = await getDatabase();

  const results = db.exec(`
    SELECT player_id, teammate_id, games_together
    FROM teammates
  `);

  if (!results.length) return [];

  return results[0].values.map((row: any) => ({
    player_id: row[0] as number,
    teammate_id: row[1] as number,
    games_together: row[2] as number,
  }));
}
