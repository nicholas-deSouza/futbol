"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import type { Player } from "@/types";
import styles from "./PlayerAutocomplete.module.css";

interface PlayerAutocompleteProps {
  label: string;
  placeholder: string;
  selectedPlayer: Player | null;
  onSelect: (player: Player) => void;
  onClear: () => void;
}

export function PlayerAutocomplete({
  label,
  placeholder,
  selectedPlayer,
  onSelect,
  onClear,
}: PlayerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { query, setQuery, results, isLoading } = usePlayerSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (player: Player) => {
    onSelect(player);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  if (selectedPlayer) {
    return (
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        <div className={styles.selectedPlayer}>
          <div className={styles.playerInfo}>
            {selectedPlayer.imageUrl && (
              <img
                src={selectedPlayer.imageUrl}
                alt={selectedPlayer.name}
                className={styles.playerImage}
              />
            )}
            <div className={styles.playerDetails}>
              <span className={styles.playerName}>{selectedPlayer.name}</span>
              {selectedPlayer.currentClub && (
                <span className={styles.playerClub}>
                  {selectedPlayer.currentClub}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClear}
            className={styles.clearButton}
            type="button"
            aria-label="Clear selection"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.input}
          autoComplete="off"
        />
        {isLoading && <span className={styles.spinner} />}
      </div>

      {isOpen && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((player, index) => (
            <li
              key={player.id}
              className={`${styles.dropdownItem} ${
                index === highlightedIndex ? styles.highlighted : ""
              }`}
              onClick={() => handleSelect(player)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {player.imageUrl && (
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className={styles.dropdownImage}
                />
              )}
              <div className={styles.dropdownInfo}>
                <span className={styles.dropdownName}>{player.name}</span>
                <span className={styles.dropdownMeta}>
                  {[player.position, player.currentClub]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className={styles.noResults}>No players found</div>
      )}
    </div>
  );
}
