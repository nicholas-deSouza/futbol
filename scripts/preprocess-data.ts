import * as fs from "fs";
import * as path from "path";
import initSqlJs, { Database } from "sql.js";

const DATA_DIR = path.join(process.cwd(), "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const PROCESSED_DIR = path.join(DATA_DIR, "processed");
const DB_PATH = path.join(PROCESSED_DIR, "futbol.db");

interface RawPlayer {
  player_id: string;
  player_slug: string;
  player_name: string;
  player_image_url: string;
  name_in_home_country: string;
  date_of_birth: string;
  place_of_birth: string;
  country_of_birth: string;
  height: string;
  citizenship: string;
  is_eu: string;
  position: string;
  main_position: string;
  foot: string;
  current_club_id: string;
  current_club_name: string;
}

interface RawTeammate {
  player_id: string;
  teammate_player_id: string;
  teammate_player_name: string;
  ppg_played_with: string;
  joint_goal_participation: string;
  minutes_played_with: string;
}

interface RawClub {
  club_id: string;
  club_slug: string;
  club_name: string;
  logo_url: string;
  country_name: string;
}

function parseCSV<T>(filePath: string): T[] {
  console.log(`Reading ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  const results: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Handle CSV with quoted fields containing commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= headers.length - 2) {
      // Allow some flexibility
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || "";
      });
      results.push(obj as T);
    }
  }

  console.log(`  Parsed ${results.length} rows`);
  return results;
}

async function main() {
  console.log("=== Football Data Preprocessing ===\n");
  console.log("Using salimt/football-datasets from GitHub\n");

  // Check for required files
  const requiredFiles = ["players.csv", "teammates.csv", "clubs.csv"];
  for (const file of requiredFiles) {
    const filePath = path.join(RAW_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Missing required file: ${filePath}`);
      process.exit(1);
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  // Initialize SQL.js
  console.log("Initializing SQLite...");
  const SQL = await initSqlJs();
  const db: Database = new SQL.Database();

  // Create tables
  console.log("\nCreating database schema...");

  db.run(`
    CREATE TABLE players (
      player_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      country TEXT,
      image_url TEXT,
      current_club_id INTEGER,
      current_club_name TEXT,
      name_normalized TEXT
    )
  `);

  db.run(`
    CREATE TABLE clubs (
      club_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT
    )
  `);

  db.run(`
    CREATE TABLE teammates (
      player_id INTEGER,
      teammate_id INTEGER,
      games_together REAL,
      PRIMARY KEY (player_id, teammate_id)
    )
  `);

  // Create indexes
  db.run(
    "CREATE INDEX idx_players_name_normalized ON players(name_normalized)"
  );
  db.run("CREATE INDEX idx_teammates_player ON teammates(player_id)");
  db.run("CREATE INDEX idx_teammates_teammate ON teammates(teammate_id)");

  // Parse CSV files
  console.log("\nParsing CSV files...");
  const players = parseCSV<RawPlayer>(path.join(RAW_DIR, "players.csv"));
  const clubs = parseCSV<RawClub>(path.join(RAW_DIR, "clubs.csv"));
  const teammates = parseCSV<RawTeammate>(path.join(RAW_DIR, "teammates.csv"));

  // Insert clubs first
  console.log("\nInserting clubs...");
  const insertClub = db.prepare(`
    INSERT OR IGNORE INTO clubs (club_id, name, country)
    VALUES (?, ?, ?)
  `);

  let clubCount = 0;
  for (const c of clubs) {
    const id = parseInt(c.club_id);
    if (isNaN(id)) continue;

    insertClub.run([id, c.club_name, c.country_name || null]);
    clubCount++;
  }
  insertClub.free();
  console.log(`  Inserted ${clubCount} clubs`);

  // Build club name lookup
  const clubNames = new Map<number, string>();
  for (const c of clubs) {
    const id = parseInt(c.club_id);
    if (!isNaN(id)) {
      clubNames.set(id, c.club_name);
    }
  }

  // Insert players
  console.log("\nInserting players...");
  const insertPlayer = db.prepare(`
    INSERT OR IGNORE INTO players (player_id, name, position, country, image_url, current_club_id, current_club_name, name_normalized)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let playerCount = 0;
  for (const p of players) {
    const id = parseInt(p.player_id);
    if (isNaN(id)) continue;

    const normalized = p.player_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const clubId = parseInt(p.current_club_id);
    const clubName =
      p.current_club_name || clubNames.get(clubId) || null;

    insertPlayer.run([
      id,
      p.player_name,
      p.main_position || p.position || null,
      p.citizenship || null,
      p.player_image_url || null,
      isNaN(clubId) ? null : clubId,
      clubName,
      normalized,
    ]);
    playerCount++;
  }
  insertPlayer.free();
  console.log(`  Inserted ${playerCount} players`);

  // Insert teammates
  console.log("\nInserting teammate relationships...");
  const insertTeammate = db.prepare(`
    INSERT OR IGNORE INTO teammates (player_id, teammate_id, games_together)
    VALUES (?, ?, ?)
  `);

  let teammateCount = 0;
  const batchSize = 50000;
  let batch = 0;

  for (const t of teammates) {
    const playerId = parseInt(t.player_id);
    const teammateId = parseInt(t.teammate_player_id);

    if (isNaN(playerId) || isNaN(teammateId)) continue;

    const gamesStr = t.ppg_played_with || "0";
    const games = parseFloat(gamesStr) || 0;

    insertTeammate.run([playerId, teammateId, games]);
    teammateCount++;

    if (teammateCount % batchSize === 0) {
      batch++;
      console.log(
        `    Processed ${teammateCount.toLocaleString()} relationships...`
      );
    }
  }
  insertTeammate.free();
  console.log(`  Inserted ${teammateCount.toLocaleString()} teammate relationships`);

  // Save database to file
  console.log("\nSaving database...");
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  console.log(`  Database saved to: ${DB_PATH}`);
  console.log(`  Database size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // Print stats
  console.log("\n=== Database Statistics ===");
  const playerDbCount = db.exec("SELECT COUNT(*) FROM players")[0].values[0][0];
  const clubDbCount = db.exec("SELECT COUNT(*) FROM clubs")[0].values[0][0];
  const teammateDbCount = db.exec("SELECT COUNT(*) FROM teammates")[0]
    .values[0][0];

  console.log(`Players: ${playerDbCount}`);
  console.log(`Clubs: ${clubDbCount}`);
  console.log(`Teammate relationships: ${teammateDbCount}`);

  // Sample query to verify
  console.log("\n=== Sample Data ===");
  const samplePlayers = db.exec(
    "SELECT player_id, name, current_club_name FROM players WHERE name LIKE '%Messi%' LIMIT 3"
  );
  if (samplePlayers.length && samplePlayers[0].values.length) {
    console.log("Players matching 'Messi':");
    for (const row of samplePlayers[0].values) {
      console.log(`  ${row[0]}: ${row[1]} (${row[2]})`);
    }
  }

  db.close();
  console.log("\n=== Preprocessing complete! ===");
}

main().catch(console.error);
