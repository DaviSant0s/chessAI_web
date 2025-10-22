// src/context/GameProvider.tsx
import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import type { GameState, OpenGame, MoveResponse } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthProvider'; // Precisamos do token

interface GameContextType {
  currentGameId: string | null;
  gameState: GameState | null;
  openGames: OpenGame[];
  evaluation: string;
  prob: number;
  suggestion: string;
  isLoading: boolean;
  error: string | null;
  loadOpenGames: () => Promise<void>;
  createGame: (playAs: 'white' | 'black') => Promise<string | null>;
  joinGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  handleMove: (sourceSquare: string, targetSquare: string) => void;
  handleSuggest: () => Promise<void>;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { token, logout } = useAuth();
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);

  // Estados da UI do Jogo
  const [evaluation, setEvaluation] = useState<string>('');
  const [prob, setProb] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Lidar com erros de API (ex: token expirado)
  const handleApiError = (err: any) => {
    setError(err.message);
    if (err.message.includes('Token') || err.message.includes('Autorização')) {
      logout();
    }
  };

  // --- Funções de Gestão de Jogo ---
  const loadOpenGames = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const games = await api.getOpenGames(token);
      setOpenGames(games);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async (playAs: 'white' | 'black') => {
    if (!token) return null;
    try {
      setIsLoading(true);
      const data = await api.createGame(playAs, token);
      setCurrentGameId(data.game_id);
      setGameState(data);
      return data.game_id;
    } catch (err: any) {
      handleApiError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await api.joinGame(gameId, token);
      setCurrentGameId(gameId);
      setGameState(data);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGame = () => {
    setCurrentGameId(null);
    setGameState(null);
    setEvaluation('');
    setProb(0);
    setSuggestion('');
  };

  // --- Polling ---
  const pollGameState = useCallback(async () => {
    if (!currentGameId || !token) return;

    try {
      const data = await api.getGameState(currentGameId, token);
      setGameState(data);
    } catch (err) {
      console.error('Erro no polling:', err);
      // Não definimos erro aqui para não incomodar o usuário
    }
  }, [currentGameId, token]);

  useEffect(() => {
    if (currentGameId && gameState?.status === 'ongoing') {
      const interval = setInterval(pollGameState, 2000);
      return () => clearInterval(interval);
    }
  }, [currentGameId, gameState?.status, pollGameState]);

  // --- Ações no Jogo ---
  // Este é um "fire-and-forget" para a UI do tabuleiro responder rápido
  const handleMove = (sourceSquare: string, targetSquare: string) => {
    if (!currentGameId || !token || gameState?.status !== 'ongoing') {
      return;
    }

    const move = sourceSquare + targetSquare;
    setSuggestion('');
    setIsLoading(true); // Feedback de carregamento
    
    api
      .makeMove(currentGameId, move, token)
      .then((data: MoveResponse) => {
        setGameState(data);
        setEvaluation(data.evaluation.label);
        setProb(data.evaluation.probability_good);
      })
      .catch((err: any) => {
        // O erro de jogada inválida será tratado pelo backend
        // Mas podemos mostrar um erro de "conexão"
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSuggest = async () => {
    if (!currentGameId || !token) return;
    try {
      setIsLoading(true);
      const data = await api.getSuggestion(currentGameId, token);
      setSuggestion(data.suggestion);
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentGameId,
    gameState,
    openGames,
    evaluation,
    prob,
    suggestion,
    isLoading,
    error,
    loadOpenGames,
    createGame,
    joinGame,
    leaveGame,
    handleMove,
    handleSuggest,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};