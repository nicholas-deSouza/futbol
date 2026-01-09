export interface Player {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  country?: string;
  imageUrl?: string;
  currentClub?: string;
}

export interface PlayerSearchResult {
  players: Player[];
  total: number;
}
