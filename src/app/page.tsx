"use client";

import { useState } from "react";
import { PlayerAutocomplete } from "@/components/search";
import { ConnectionPath } from "@/components/path";
import { usePathQuery } from "@/hooks";
import type { Player } from "@/types";
import styles from "./page.module.css";

export default function Home() {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const { result, isLoading, error, findPath, reset } = usePathQuery();

  const handleFindConnection = async () => {
    if (!player1 || !player2) return;
    await findPath(player1.id, player2.id);
  };

  const handleReset = () => {
    setPlayer1(null);
    setPlayer2(null);
    reset();
  };

  const canSearch = player1 && player2 && !isLoading;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>The Separation Game</h1>
        <p className={styles.subtitle}>
          Find the connection between any two soccer players through their club teammates
        </p>
      </header>

      <main className={styles.main}>
        <div className={styles.searchSection}>
          <div className={styles.searchInputs}>
            <PlayerAutocomplete
              label="First Player"
              placeholder="Search for a player..."
              selectedPlayer={player1}
              onSelect={setPlayer1}
              onClear={() => {
                setPlayer1(null);
                reset();
              }}
            />

            <div className={styles.separator}>
              <span className={styles.separatorIcon}>↔</span>
            </div>

            <PlayerAutocomplete
              label="Second Player"
              placeholder="Search for another player..."
              selectedPlayer={player2}
              onSelect={setPlayer2}
              onClear={() => {
                setPlayer2(null);
                reset();
              }}
            />
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleFindConnection}
              disabled={!canSearch}
              className={styles.searchButton}
            >
              {isLoading ? (
                <>
                  <span className={styles.buttonSpinner} />
                  Searching...
                </>
              ) : (
                "Find Connection"
              )}
            </button>

            {(player1 || player2 || result) && (
              <button onClick={handleReset} className={styles.resetButton}>
                Reset
              </button>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        {result && (
          <div className={styles.resultSection}>
            <ConnectionPath result={result} />
          </div>
        )}

        {!result && !isLoading && (
          <div className={styles.exampleSection}>
            <h3>How it works</h3>
            <p>
              Enter two players and find the shortest path connecting them through shared club teammates.
              Only players who actually appeared in matches count (not just roster members).
            </p>
            <div className={styles.example}>
              <strong>Example:</strong> Wayne Rooney → Di Maria (Manchester United) → Neymar (PSG)
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Data from{" "}
          <a
            href="https://www.kaggle.com/datasets/davidcariboo/player-scores"
            target="_blank"
            rel="noopener noreferrer"
          >
            Transfermarkt
          </a>
        </p>
      </footer>
    </div>
  );
}
