// src/types/index.ts

export interface User {
  username: string;
  email: string;
  rating: number;
}

export interface GameState {
  game_id: string;
  fen: string;
  status: string;
  result: string | null;
  turn: string;
  player_white: string | null;
  player_black: string | null;
  last_move_at: string;
  // --- ADICIONADO ---
  rematch_requested_by: string | null;
}

export interface OpenGame {
  game_id: string;
  needs_player: string;
  created_at: string;
}

export interface MoveResponse extends GameState {
  last_move: string;
  evaluation: {
    label: string;
    probability_good: number;
  };
}