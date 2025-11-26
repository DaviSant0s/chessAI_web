import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback,
  useRef
} from 'react';
// 1. IMPORTE O 'io' E O TIPO 'Socket'
import { io, type Socket } from 'socket.io-client';
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
  handleMove: (move: string) => void; // Agora aceita a string de jogada completa
  handleSuggest: () => Promise<void>;
  clearError: () => void;

  // --- INÍCIO DA ADIÇÃO ---
  handleRequestRematch: () => void;
  handleAcceptRematch: () => void;
  // --- FIM DA ADIÇÃO ---
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// 2. DEFINA A URL DO SEU BACKEND
const SOCKET_URL = 'https://chess-api3.onrender.com';

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

  // 3. ARMAZENE O SOCKET EM UM 'useRef' PARA EVITAR RECONEXÕES
  // Usamos useRef para que o objeto do socket persista
  // durante o ciclo de vida do componente sem causar re-renderizações.
  const socketRef = useRef<Socket | null>(null);

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

  // Correção 1 (Orientação)
  const createGame = async (playAs: 'white' | 'black') => {
    if (!token) return null;
    try {
      setIsLoading(true);
      const data = await api.createGame(playAs, token);

      // 🌟 ADICIONE ESTA LINHA: Salva o estado do jogo (GameState)
      setGameState(data);

      setCurrentGameId(data.game_id);
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
    // 4. (OPCIONAL) EMITA UM EVENTO DE 'leave_game'
    if (socketRef.current && currentGameId) {
      socketRef.current.emit('leave_game', { game_id: currentGameId });
    }

    setCurrentGameId(null);
    setGameState(null);
    setEvaluation('');
    setProb(0);
    setSuggestion('');
  };

  // 5. MANTENHA A FUNÇÃO DE POLLING, VAMOS USÁ-LA UMA VEZ
  const fetchGameState = useCallback(async (gameId: string) => {
    if (!token) return;
    try {
      const data = await api.getGameState(gameId, token);
      setGameState(data);
    } catch (err) {
      console.error('Erro ao buscar estado inicial:', err);
    }
  }, [token]);

  // 6. NOVO useEffect PARA GERENCIAR A CONEXÃO DO SOCKET
  useEffect(() => {
    // Só conecta se tivermos um token e não houver socket
    if (token && !socketRef.current) {
      // Conecta ao servidor de socket
      // (Você pode passar o token aqui para autenticação
      // se proteger os handlers de socket, mas por agora é simples)
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        path: '/socket.io/',
        // Exemplo de como enviar o token (se necessário no futuro)
        // auth: { token }
      });
      
      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('Socket.IO conectado:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO desconectado');
      });

      // Cleanup: Desconecta quando o provider é desmontado (ex: logout)
      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else if (!token && socketRef.current) {
      // Se o usuário deslogar, desconecta o socket
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [token]);

  // 7. SUBSTITUA O useEffect DO POLLING POR ESTE
  // Este é o coração da mudança.
  useEffect(() => {
    const socket = socketRef.current;

    // Se não tivermos socket ou gameId, não faz nada
    if (!socket || !currentGameId) {
      return;
    }

    // 1. Define o listener para ATUALIZAÇÕES
    const handleGameUpdate = (data: GameState) => {
      console.log('Socket: Recebido game_update');
      setGameState(data);
      
      // Se a jogada tiver avaliação (veio do /move), atualiza
      if ((data as MoveResponse).evaluation) {
        const moveData = data as MoveResponse;
        setEvaluation(moveData.evaluation.label);
        setProb(moveData.evaluation.probability_good);
      }
    };
    
    socket.on('game_update', handleGameUpdate);

    // 2. Entra na sala do jogo
    socket.emit('join_game', { game_id: currentGameId });
    
    // 3. Busca o estado ATUAL do jogo (apenas uma vez)
    // Isso garante que o estado está sincronizado
    // no momento em que entramos.
    fetchGameState(currentGameId);

    // 4. Função de Cleanup
    return () => {
      console.log('Socket: Limpando listeners e saindo da sala');
      socket.off('game_update', handleGameUpdate);
      // (Opcional) socket.emit('leave_game', { game_id: currentGameId });
    };
    
  }, [currentGameId, fetchGameState]); // Depende de currentGameId e fetchGameState


  // --- Ações no Jogo ---
  // 8. O 'handleMove' FICA (QUASE) IDÊNTICO!
  // Ele ainda é o "trigger" que inicia a atualização.
  const handleMove = (move: string) => { 
    if (!currentGameId || !token || gameState?.status !== 'ongoing') {
      return;
    }
    
    setSuggestion('');
    setIsLoading(true); 
    
    api
      .makeMove(currentGameId, move, token)
      .then((data: MoveResponse) => {
        // O JOGADOR QUE FEZ A JOGADA ATUALIZA O ESTADO IMEDIATAMENTE
        // PELA RESPOSTA HTTP.
        // OS OUTROS JOGADORES VÃO ATUALIZAR PELO EVENTO 'game_update'
        setGameState(data);
        setEvaluation(data.evaluation.label);
        setProb(data.evaluation.probability_good);
      })
      .catch((err: any) => {
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
    } catch (err: any)
      {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- INÍCIO DAS NOVAS FUNÇÕES ---
  const handleRequestRematch = () => {
    if (!currentGameId || !token) return;
    
    setIsLoading(true);
    api.requestRematch(currentGameId, token)
       // Atualiza o estado local imediatamente pela resposta HTTP
       // O oponente receberá a mesma atualização via Socket.IO
      .then(data => setGameState(data)) 
      .catch(handleApiError)
      .finally(() => setIsLoading(false));
  };
  
  const handleAcceptRematch = () => {
    if (!currentGameId || !token) return;

    setIsLoading(true);
    api.acceptRematch(currentGameId, token)
      // O Socket.IO notificará a todos que o jogo "resetou"
      .then(data => {
        setGameState(data);
        // Limpa os estados de avaliação/sugestão do jogo anterior
        setEvaluation('');
        setProb(0);
        setSuggestion('');
      }) 
      .catch(handleApiError)
      .finally(() => setIsLoading(false));
  };
  // --- FIM DAS NOVAS FUNÇÕES ---

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

    // --- INÍCIO DA ADIÇÃO ---
    handleRequestRematch,
    handleAcceptRematch,
    // --- FIM DA ADIÇÃO ---
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