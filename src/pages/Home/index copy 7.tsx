import { useEffect, useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  Brain,
  RotateCcw,
  Lightbulb,
  Crown,
  Activity,
  Bot,
  LogIn,
  LogOut,
  UserPlus,
  Users,
  Play,
  X,
  Plus,
  Loader2,
} from 'lucide-react';

// ============= TIPOS =============
interface User {
  username: string;
  email: string;
  rating: number;
}

interface GameState {
  game_id: string;
  fen: string;
  status: string;
  result: string | null;
  turn: string;
  player_white: string | null;
  player_black: string | null;
  last_move_at: string;
}

interface OpenGame {
  game_id: string;
  needs_player: string;
  created_at: string;
}

interface MoveResponse extends GameState {
  last_move: string;
  evaluation: {
    label: string;
    probability_good: number;
  };
}

// ============= COMPONENTE PRINCIPAL =============
export default function ChessApp() {
  // Estados de autenticação
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Estados do jogo
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playAs, setPlayAs] = useState<'white' | 'black'>('white');

  // Estados da interface
  const [evaluation, setEvaluation] = useState<string>('');
  const [prob, setProb] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<string>('');
  const [boardSize, setBoardSize] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // ============= FUNÇÕES DE API =============
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`http://localhost:5000${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response.json();
  };

  // ============= AUTENTICAÇÃO =============
  const handleAuth = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (authMode === 'register') {
        await apiCall('/register', {
          method: 'POST',
          body: JSON.stringify(authForm),
        });
        setAuthMode('login');
        setError('Registro bem-sucedido! Faça login.');
      } else {
        const data = await apiCall('/login', {
          method: 'POST',
          body: JSON.stringify({
            username: authForm.username,
            password: authForm.password,
          }),
        });
        console.log(data.access_token)
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setShowAuthModal(false);
        setAuthForm({ username: '', email: '', password: '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentGameId(null);
    setGameState(null);
    localStorage.removeItem('token');
  };

  // Carregar perfil do usuário
  useEffect(() => {
    if (token) {
      apiCall('/profile')
        .then(setUser)
        .catch(() => handleLogout());
    }
  }, [token]);

  // ============= GESTÃO DE JOGOS =============
  const loadOpenGames = async () => {
    try {
      const games = await apiCall('/games');
      setOpenGames(games);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createGame = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/create_game', {
        method: 'POST',
        body: JSON.stringify({ play_as: playAs }),
      });
      setCurrentGameId(data.game_id);
      setShowCreateModal(false);
      startPolling(data.game_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      setIsLoading(true);
      const data = await apiCall('/join_game', {
        method: 'POST',
        body: JSON.stringify({ game_id: gameId }),
      });
      setCurrentGameId(gameId);
      setGameState(data);
      setShowGamesModal(false);
      startPolling(gameId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============= POLLING =============
  const pollGameState = useCallback(
    async (gameId: string) => {
      try {
        const data = await apiCall(`/game_state/${gameId}`);
        setGameState(data);
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    },
    [token] // Removido apiCall, pois é definida no escopo do componente
  );

  const startPolling = (gameId: string) => {
    // Busca imediata ao iniciar
    pollGameState(gameId);
    
    const interval = setInterval(() => {
      pollGameState(gameId);
    }, 2000); // Poll a cada 2 segundos

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (currentGameId) {
      const cleanup = startPolling(currentGameId);
      return cleanup;
    }
  }, [currentGameId, pollGameState]);

  // ============= JOGADAS =============

  // A função agora declara que retorna 'boolean', não 'Promise<boolean>'
  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (!currentGameId || !gameState || gameState.status !== 'ongoing') {
      // Retorna 'false' se a jogada for inválida (sincronamente)
      return false;
    }

    const move = sourceSquare + targetSquare;
    setSuggestion('');
    setIsLoading(true);

    // Inicia a chamada da API, mas não a "espera"
    apiCall('/move', {
      method: 'POST',
      body: JSON.stringify({ game_id: currentGameId, move }),
    })
      .then((data: MoveResponse) => {
        // Bloco .then() (sucesso)
        // Este código só executa quando a API responder com sucesso
        setGameState(data);
        setEvaluation(data.evaluation.label);
        setProb(data.evaluation.probability_good);
      })
      .catch((err: any) => {
        // Bloco .catch() (erro)
        // Este código só executa se a API falhar
        setError(err.message);
      })
      .finally(() => {
        // Bloco .finally()
        // Executa sempre (sucesso ou erro)
        setIsLoading(false);
      });

    // A função *sempre* retorna 'true' aqui (imediatamente)
    // Isso sinaliza que a *tentativa* de jogada foi iniciada,
    // mas *não* que ela foi bem-sucedida.
    return true;
  };

  const handleSuggest = async () => {
    if (!currentGameId) return;

    try {
      setIsLoading(true);
      const data = await apiCall('/suggest', {
        method: 'POST',
        body: JSON.stringify({ game_id: currentGameId }),
      });
      setSuggestion(data.suggestion);
    } catch (err: any) {
      setError(err.message);
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

  // ============= RESPONSIVIDADE =============
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        setBoardSize(Math.min(width - 32, height * 0.5));
      } else if (width < 1024) {
        setBoardSize(Math.min(width * 0.6, height * 0.7));
      } else {
        setBoardSize(Math.min(600, height * 0.75));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============= RENDER =============
  if (!token) {
    return (
      <div className="w-full h-screen bg-[#302e2b] flex items-center justify-center p-4">
        <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-10 h-10 text-[#81b64c]" />
            <h1 className="text-3xl font-bold text-[#f0f0f0]">Chess AI</h1>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  authMode === 'login'
                    ? 'bg-[#81b64c] text-white'
                    : 'bg-[#403e3c] text-[#b3b3b3]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  authMode === 'register'
                    ? 'bg-[#81b64c] text-white'
                    : 'bg-[#403e3c] text-[#b3b3b3]'
                }`}
              >
                Registrar
              </button>
            </div>

            <input
              type="text"
              placeholder="Username"
              value={authForm.username}
              onChange={(e) =>
                setAuthForm({ ...authForm, username: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
            />

            {authMode === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
              />
            )}

            <input
              type="password"
              placeholder="Senha"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={isLoading}
              className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Registrar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // =================== LÓGICA DE ORIENTAÇÃO ======================
  // =================================================================
  // Determina a cor do jogador logado
  let boardOrientation: 'white' | 'black' = 'white'; // Padrão
  if (user && gameState) {
    if (user.username === gameState.player_black) {
      boardOrientation = 'black';
    }
    // Se user.username === gameState.player_white, já é 'white' (padrão)
    // Se não for nenhum (espectador), também fica 'white' (padrão)
  }
  // =================================================================
  // =================================================================


  return (
    <div className="w-full h-screen overflow-x-hidden bg-[#302e2b]">
      {/* HEADER */}
      <header className="relative z-20 bg-[#262421] border-b border-[#3d3d3d] shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#81b64c]" />
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Chess AI</h1>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="bg-[#302e2b] border border-[#3d3d3d] rounded-lg px-3 py-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#f0d078]" />
                <span className="text-[#f0f0f0] font-semibold text-sm">
                  {user.username}
                </span>
                <span className="text-[#81b64c] text-sm">({user.rating})</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-[#c94545] hover:bg-[#b33838] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* MODAIS */}
      {showGamesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#f0f0f0]">
                Jogos Disponíveis
              </h2>
              <button
                onClick={() => setShowGamesModal(false)}
                className="text-[#b3b3b3] hover:text-[#f0f0f0]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {openGames.length === 0 ? (
              <p className="text-[#b3b3b3] text-center py-8">
                Nenhum jogo disponível no momento
              </p>
            ) : (
              <div className="space-y-3">
                {openGames.map((game) => (
                  <div
                    key={game.game_id}
                    className="bg-[#403e3c] border border-[#4b4a4a] rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[#f0f0f0] font-semibold">
                        ID: {game.game_id}
                      </p>
                      <p className="text-[#b3b3b3] text-sm">
                        Precisa de jogador:{' '}
                        {game.needs_player === 'white' ? 'Brancas' : 'Pretas'}
                      </p>
                    </div>
                    <button
                      onClick={() => joinGame(game.game_id)}
                      disabled={isLoading}
                      className="bg-[#81b64c] hover:bg-[#70a03f] text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      Entrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#f0f0f0]">Criar Jogo</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#b3b3b3] hover:text-[#f0f0f0]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[#b3b3b3] mb-2">Jogar como:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPlayAs('white')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      playAs === 'white'
                        ? 'bg-[#81b64c] text-white'
                        : 'bg-[#403e3c] text-[#b3b3b3]'
                    }`}
                  >
                    Brancas
                  </button>
                  <button
                    onClick={() => setPlayAs('black')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      playAs === 'black'
                        ? 'bg-[#81b64c] text-white'
                        : 'bg-[#403e3c] text-[#b3b3b3]'
                    }`}
                  >
                    Pretas
                  </button>
                </div>
              </div>

              <button
                onClick={createGame}
                disabled={isLoading}
                className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Criar Jogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {!currentGameId ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 text-center">
              <Users className="w-16 h-16 text-[#81b64c] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#f0f0f0] mb-2">
                Bem-vindo ao Chess AI!
              </h2>
              <p className="text-[#b3b3b3] mb-6">
                Crie um novo jogo ou entre em um jogo existente
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Criar Jogo
                </button>
                <button
                  onClick={() => {
                    loadOpenGames();
                    setShowGamesModal(true);
                  }}
                  className="bg-[#403e3c] hover:bg-[#4b4a4a] text-[#f0f0f0] px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Ver Jogos
                </button>
              </div>
            </div>
          </div>
        ) : (
          // =================== ALTERAÇÃO AQUI ===================
          // Usamos uma IIFE para declarar variáveis dentro da expressão ternária
          (() => {
            // Bloco de info do jogador BRANCO
            const whitePlayerInfo = (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#403e3c] border border-[#4b4a4a] rounded-sm flex items-center justify-center">
                  {gameState?.turn === 'white' ? (
                    <Crown className="w-6 h-6 text-[#f0d078]" />
                  ) : (
                    <Bot className="w-6 h-6 text-[#f0f0f0]" />
                  )}
                </div>
                <span className="text-[#f0f0f0] font-semibold">
                  {gameState?.player_white || 'Aguardando...'}
                </span>
              </div>
            );

            // Bloco de info do jogador PRETO
            const blackPlayerInfo = (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#403e3c] border border-[#4b4a4a] rounded-sm flex items-center justify-center">
                  {gameState?.turn === 'black' ? (
                    <Crown className="w-6 h-6 text-[#f0d078]" />
                  ) : (
                    <Bot className="w-6 h-6 text-[#f0f0f0]" />
                  )}
                </div>
                <span className="text-[#f0f0f0] font-semibold">
                  {gameState?.player_black || 'Aguardando...'}
                </span>
              </div>
            );

            // Agora retornamos o layout
            return (
              <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-7xl mx-auto">
                {/* TABULEIRO */}
                <div>
                  {/* JOGADOR DO TOPO */}
                  <div className="mb-2">
                    {/* Se orientação for 'white', topo é preto. Se for 'black', topo é branco. */}
                    {boardOrientation === 'white'
                      ? blackPlayerInfo
                      : whitePlayerInfo}
                  </div>

                  <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#3d3d3d]">
                    <Chessboard
                      position={gameState?.fen || 'start'}
                      onPieceDrop={handleMove}
                      boardWidth={boardSize}
                      arePiecesDraggable={
                        !isLoading && gameState?.status === 'ongoing'
                      }
                      customDarkSquareStyle={{ backgroundColor: '#769656' }}
                      customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                      boardOrientation={boardOrientation}
                    />
                  </div>

                  {/* JOGADOR DE BAIXO */}
                  <div className="mt-2">
                    {/* Se orientação for 'white', baixo é branco. Se for 'black', baixo é preto. */}
                    {boardOrientation === 'white'
                      ? whitePlayerInfo
                      : blackPlayerInfo}
                  </div>
                </div>

                {/* PAINEL LATERAL */}
                <div className="w-full lg:w-96 space-y-4 mt-12">
                  {/* Status do jogo */}
                  <div className="bg-[#262421] rounded-xl p-6 border border-[#3d3d3d]">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-[#f0d078]" />
                      <div>
                        <p className="text-xs text-[#b3b3b3] uppercase">
                          Status
                        </p>
                        <p className="text-xl font-bold text-[#f0f0f0]">
                          {gameState?.status === 'ongoing'
                            ? `Turno: ${
                                gameState.turn === 'white'
                                  ? 'Brancas'
                                  : 'Pretas'
                              }`
                            : gameState?.status === 'waiting'
                            ? 'Aguardando jogador'
                            : gameState?.result || 'Finalizado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Avaliação */}
                  {evaluation && (
                    <div className="bg-[#262421] rounded-xl p-6 border border-[#81b64c]">
                      <div className="flex items-start gap-3">
                        <Activity className="w-6 h-6 text-[#81b64c] mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-[#b3b3b3] uppercase mb-2">
                            Avaliação
                          </p>
                          <p className="text-2xl font-bold text-[#f0f0f0] mb-1">
                            {evaluation}
                          </p>
                          <div className="w-full bg-[#1a1917] rounded-full h-2">
                            <div
                              className="h-full bg-[#81b64c] rounded-full transition-all duration-500"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                          <p className="text-sm text-[#b3b3b3] mt-2">
                            Confiança:{' '}
                            <span className="font-semibold text-[#81b64c]">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sugestão */}
                  {suggestion && (
                    <div className="bg-[#262421] rounded-xl p-6 border border-[#769656]">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-6 h-6 text-[#f0d078] mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-[#b3b3b3] uppercase mb-2">
                            Sugestão
                          </p>
                          <p className="text-xl font-bold text-[#f0f0f0]">
                            {suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="space-y-3">
                    <button
                      onClick={handleSuggest}
                      disabled={isLoading || gameState?.status !== 'ongoing'}
                      className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="w-5 h-5" />
                      Sugestão
                    </button>

                    <button
                      onClick={leaveGame}
                      className="w-full bg-[#c94545] hover:bg-[#b33838] text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Sair do Jogo
                    </button>
                  </div>
                </div>
              </div>
            );
          })() // Fim da IIFE
          // =================== FIM DA ALTERAÇÃO ===================
        )}
      </div>

      {/* Notificação de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          {error}
        </div>
      )}
    </div>
  );
}
