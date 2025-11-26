// src/services/api.ts
import type { User, GameState, OpenGame, MoveResponse } from '../types';

const BASE_URL = 'https://chess-api3.onrender.com';
// const BASE_URL = 'http://127.0.0.1:5000';

// Função de base para chamadas de API
const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  token: string | null = null
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro na requisição');
  }

  // Retorna JSON, ou nada se for um 204 No Content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  }
  return {};
};

// --- Funções de Autenticação ---
export const registerUser = (formData: any) =>
  apiCall('/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

export const loginUser = (formData: any): Promise<{ access_token: string }> =>
  apiCall('/login', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

export const getProfile = (token: string): Promise<User> =>
  apiCall('/profile', {}, token);

// --- Funções de Jogo ---
export const getOpenGames = (token: string): Promise<OpenGame[]> =>
  apiCall('/games', {}, token);

export const createGame = (
  playAs: 'white' | 'black',
  token: string
): Promise<GameState> =>
  apiCall(
    '/create_game',
    {
      method: 'POST',
      body: JSON.stringify({ play_as: playAs }),
    },
    token
  );

export const joinGame = (gameId: string, token: string): Promise<GameState> =>
  apiCall(
    '/join_game',
    {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    },
    token
  );

export const getGameState = (
  gameId: string,
  token: string
): Promise<GameState> => apiCall(`/game_state/${gameId}`, {}, token);

export const makeMove = (
  gameId: string,
  move: string,
  token: string
): Promise<MoveResponse> =>
  apiCall(
    '/move',
    {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId, move }),
    },
    token
  );

export const getSuggestion = (
  gameId: string,
  token: string
): Promise<{ suggestion: string }> =>
  apiCall(
    '/suggest',
    {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    },
    token
  );

  // Edicao comeca aqui
  export const requestRematch = (
  gameId: string,
  token: string
): Promise<GameState> =>
  apiCall(
    '/request_rematch',
    {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    },
    token
  );

export const acceptRematch = (
  gameId: string,
  token: string
): Promise<GameState> =>
  apiCall(
    '/accept_rematch',
    {
      method: 'POST',
      body: JSON.stringify({ game_id: gameId }),
    },
    token
  );
// edicao termina aqui