import { useEffect, useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  Brain,
  RotateCcw,
  Lightbulb,
  Crown,
  Activity,
  Bot,
  User as UserIcon,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

// --- INTERFACES ---
interface GameState {
  game_id: string;
  fen: string;
  status: string;
  result: string | null;
  turn: 'white' | 'black';
  player_white: string | null;
  player_black: string | null;
  last_move_at: string | null;
}

interface MoveResponse extends GameState {
  last_move: string;
  evaluation: {
    label: string;
    probability_good: number;
  };
}

interface SuggestionResponse {
  suggestion: string;
  fen: string;
}

// --- Hook customizado useInterval ---
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// --- COMPONENTE DE JOGO PRINCIPAL ---

interface HomeProps {
  token: string;
}

function Home({ token }: HomeProps) {
  // --- ESTADO DO JOGO ---
  const [gameId, setGameId] = useState<string | null>(
    localStorage.getItem('gameId')
  );
  const [fen, setFen] = useState<string>('start');
  const [turn, setTurn] = useState<string>('white');
  const [status, setStatus] = useState<string>('waiting'); // Estado de status adicionado
  const [playerWhite, setPlayerWhite] = useState<string | null>(null);
  const [playerBlack, setPlayerBlack] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [lastMoveAt, setLastMoveAt] = useState<string | null>(null);

  // --- ESTADO DA UI ---
  const [evaluation, setEvaluation] = useState<string>('');
  const [prob, setProb] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<string>('');
  const [boardSize, setBoardSize] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isBotActive, setIsBotActive] = useState<boolean>(false);

  // Cabeçalhos de autenticação
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // --- EFEITOS (LIFECYCLE) ---

  // Efeito de redimensionamento
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 640) setBoardSize(Math.min(width - 32, height * 0.5));
      else if (width < 1024) setBoardSize(Math.min(width * 0.6, height * 0.7));
      else setBoardSize(Math.min(600, height * 0.75));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para buscar o estado atual do jogo
  const fetchGameState = async () => {
    if (!gameId || isPolling) return;
    setIsPolling(true);
    try {
      const res = await fetch(`${API_URL}/game_state/${gameId}`, {
        method: 'GET',
        headers: authHeaders,
      });

      // Verificação de erro movida para cá
      if (!res.ok) {
        if (res.status === 404 || res.status === 401) {
          console.error('Jogo não encontrado ou não autorizado. Limpando gameId.');
          setGameId(null);
          localStorage.removeItem('gameId');
        }
        throw new Error('Falha ao buscar estado do jogo');
      }

      const data: GameState = await res.json();

      if (data.fen !== fen) {
        setFen(data.fen);
        setTurn(data.turn);
        setStatus(data.status); // Atualiza o status
        setPlayerWhite(data.player_white);
        setPlayerBlack(data.player_black);
        setGameResult(data.result);
        setLastMoveAt(data.last_move_at);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolling(false);
    }
  };

  // Efeito de carregamento inicial
  useEffect(() => {
    if (gameId) {
      fetchGameState();
    }
  }, [gameId]);

  // --- POLLING ---
  useInterval(
    () => {
      if (gameId && !gameResult && !isLoading && status === 'ongoing') { // Agora 'status' existe
        fetchGameState();
      }
    },
    3000
  );

  // --- FUNÇÕES DE AÇÃO ---

  // Jogada do Robô
  const triggerBotMove = async () => {
    if (!gameId) return;

    try {
      const suggestionRes = await fetch(`${API_URL}/suggest`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ game_id: gameId }),
      });
      const suggestionData: SuggestionResponse = await suggestionRes.json();
      const botMoveUci = suggestionData.suggestion;

      if (botMoveUci) {
        const moveRes = await fetch(`${API_URL}/move`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ game_id: gameId, move: botMoveUci }),
        });
        const botMoveData: MoveResponse = await moveRes.json();

        setFen(botMoveData.fen);
        setTurn(botMoveData.turn);
        setStatus(botMoveData.status); // Atualiza o status
        setEvaluation(botMoveData.evaluation.label);
        setProb(botMoveData.evaluation.probability_good);
        if (botMoveData.result) setGameResult(botMoveData.result);
      }
    } catch (err) {
      console.error('Erro na jogada do robô:', err);
    }
  };

  // Jogada do usuário
  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (isLoading || gameResult) return false;

    const move = sourceSquare + targetSquare;
    setSuggestion('');
    setIsLoading(true);

    fetch(`${API_URL}/move`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ game_id: gameId, move: move }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => { throw new Error(err.error || 'Jogada inválida')});
        }
        return res.json();
      })
      .then((data: MoveResponse) => {
        setFen(data.fen);
        setTurn(data.turn);
        setStatus(data.status); // Atualiza o status
        setEvaluation(data.evaluation.label);
        setProb(data.evaluation.probability_good);

        if (data.result) {
          setGameResult(data.result);
          return;
        }

        if (isBotActive) {
          return new Promise((resolve) => setTimeout(resolve, 500)).then(() =>
            triggerBotMove()
          );
        }
      })
      .catch((err: any) => {
        console.error('Ocorreu um erro durante a jogada:', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return true;
  };

  // Cria um novo jogo
  const handleCreateGame = (botMode: boolean) => {
    setIsLoading(true);
    setGameId(null);
    setGameResult(null);
    setEvaluation('');
    setProb(0);
    setStatus('waiting'); // Reseta o status

    fetch(`${API_URL}/create_game`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ play_as: 'white' })
    })
      .then((res) => res.json())
      .then((data: GameState) => {
        setGameId(data.game_id);
        setFen(data.fen);
        setTurn(data.turn);
        setStatus(data.status); // Define o novo status
        setPlayerWhite(data.player_white);
        setPlayerBlack(data.player_black);
        setGameResult(null);
        localStorage.setItem('gameId', data.game_id);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Pede uma sugestão
  const handleSuggest = () => {
    if (!gameId || isLoading) return;

    setIsLoading(true);
    fetch(`${API_URL}/suggest`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ game_id: gameId })
    })
      .then((res) => res.json())
      .then((data: SuggestionResponse) => setSuggestion(data.suggestion))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Toggle Bot
  const toggleBotPlay = () => {
    const newBotState = !isBotActive;
    setIsBotActive(newBotState);
    handleCreateGame(newBotState);
  };

  // --- RENDERIZAÇÃO ---

  // Tela de "Criar Jogo"
  if (!gameId) {
    return (
      <div className="w-full h-screen bg-[#302e2b] flex flex-col items-center justify-center text-white p-4">
        <Brain className="w-24 h-24 text-[#81b64c] mb-8" />
        <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Chess AI</h1>
        <p className="text-lg text-gray-400 mb-8 text-center">
          Você precisa de um jogo para começar.
        </p>
        <button
          onClick={() => handleCreateGame(isBotActive)}
          disabled={isLoading}
          className="bg-[#81b64c] hover:bg-[#70a03f] text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-3 text-lg"
        >
          {isLoading ? 'Criando...' : 'Criar Novo Jogo'}
        </button>
      </div>
    );
  }

  // Tela Principal do Jogo
  return (
    <div className=" w-full min-h-screen overflow-x-hidden  bg-[#302e2b]">
      <header className="relative z-20 bg-[#262421] border-b border-[#3d3d3d] shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#81b64c]" />
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Chess AI</h1>
          </div>
        </div>
      </header>

      {/* Pop-up de Resultado do Jogo */}
      {gameResult && (
        <div className="fixed top-5 z-21 left-0 right-0 mx-auto max-w-xs animate-in slide-in-from-top-5 duration-500">
          <div className="bg-[#262421] border-2 border-[#81b64c] rounded-xl p-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#81b64c]/20 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-[#f0d078]" />
                </div>
              </div>
              <div className="flex-grow">
                <h2 className="font-bold text-[#f0f0f0]">
                  {gameResult === '1-0'
                    ? 'Brancas Vencem!'
                    : gameResult === '0-1'
                    ? 'Pretas Vencem!'
                    : 'Empate!'}
                </h2>
                <button
                  onClick={() => handleCreateGame(isBotActive)}
                  className="mt-2 text-sm text-[#81b64c] hover:text-[#a1e65c] font-semibold"
                >
                  Jogar novamente
                </button>
              </div>
            </div>
          </div>
        </div> // <-- DIV DE FECHAMENTO CORRIGIDA
      )}

      {/* Conteúdo Principal */}
      <div className="relative z-10 container mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-7xl mx-auto">
          <div className="">
            {/* Jogador Preto */}
            <div className="flex items-start justify-start gap-2 mb-2">
              <div className="w-[40px] h-[40px] overflow-hidden bg-[#403e3c] border border-[#4b4a4a] rounded-sm  flex items-center justify-center">
                <UserIcon color="#f0f0f0" />
              </div>
              <span className="text-[#f0f0f0] font-semibold text-sm">
                {playerBlack || (isBotActive ? 'Bot' : 'Esperando Oponente...')}
              </span>
            </div>

            {/* Tabuleiro */}
            <div className="w-full lg:w-auto flex justify-center">
              <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#3d3d3d]">
                <Chessboard
                  position={fen}
                  onPieceDrop={handleMove}
                  boardWidth={boardSize}
                  arePiecesDraggable={!isLoading && !gameResult}
                  customBoardStyle={{ borderRadius: '0px' }}
                  customDarkSquareStyle={{ backgroundColor: '#769656' }}
                  customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                />
              </div>
            </div>

            {/* Jogador Branco */}
            <div className="flex items-start justify-start gap-2 mt-2">
              <div className="w-[40px] h-[40px] overflow-hidden bg-[#403e3c] border border-[#4b4a4a] rounded-sm  flex items-center justify-center">
                 <UserIcon color="#f0f0f0" />
              </div>
              <span className="text-[#f0f0f0] font-semibold text-sm">
                {playerWhite || 'Esperando Oponente...'}
              </span>
            </div>
          </div>

          {/* Painel Lateral */}
          <div className="w-full lg:w-96 space-y-4 mt-[48px]">
            {/* Indicador de Turno */}
            <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#3d3d3d] shadow-xl">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[#f0d078]" />
                <div>
                  <p className="text-xs text-[#b3b3b3] uppercase tracking-wide">
                    Turno Atual
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-[#f0f0f0]">
                    {turn === 'white' ? 'Brancas' : 'Pretas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Avaliação */}
            {evaluation && (
              <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#81b64c] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Activity className="w-6 h-6 text-[#81b64c] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#b3b3b3] uppercase tracking-wide mb-2">
                      Avaliação
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-[#f0f0f0] mb-1 break-words">
                      {evaluation}
                    </p>
                    <div className="w-full bg-[#1a1917] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#81b64c] transition-all duration-500 rounded-full"
                        style={{ width: `${prob * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-[#b3b3b3] mt-2">
                      Confiança (Boa):{' '}
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
              <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#769656] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-[#769656] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#b3b3b3] uppercase tracking-wide mb-2">
                      Sugestão
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-[#f0f0f0] mb-1 break-words">
                      {suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="space-y-3">
              <button
                onClick={toggleBotPlay}
                disabled={isLoading}
                className={`group relative w-full ${
                  isBotActive
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#4a4a4a] hover:bg-[#5a5a5a]'
                } hover:-translate-y-0.5 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Bot className="w-5 h-5" />
                <span className="text-sm lg:text-base">
                  {isBotActive ? 'Jogando com Robô' : 'Jogar com Robô'}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSuggest}
                  disabled={isLoading || !!gameResult}
                  className="group relative bg-[#81b64c] hover:bg-[#70a03f] hover:-translate-y-0.5 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <Bot className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lightbulb className="w-5 h-5" />
                  )}
                  <span className="text-sm lg:text-base">Sugestão</span>
                </button>

                <button
                  onClick={() => handleCreateGame(isBotActive)}
                  disabled={isLoading}
                  className="group relative bg-[#c94545] hover:bg-[#b33838] hover:-translate-y-0.5 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <Bot className="w-5 h-5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                  <span className="text-sm lg:text-base">Novo Jogo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE "PAI" PARA AUTENTICAÇÃO ---
export default function AuthWrapper() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = isRegistering ? `${API_URL}/register` : `${API_URL}/login`;
    const body = isRegistering
      ? JSON.stringify({ username, email, password })
      : JSON.stringify({ username, password });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      if (isRegistering) {
        setIsRegistering(false);
        alert('Registro com sucesso! Por favor, faça o login.');
      } else {
        setToken(data.access_token);
        localStorage.setItem('authToken', data.access_token);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <div className="w-full h-screen bg-[#302e2b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#262421] p-8 rounded-2xl shadow-2xl border border-[#3d3d3d]">
          <div className="flex justify-center mb-6">
            <Brain className="w-16 h-16 text-[#81b64c]" />
          </div>
          <h2 className="text-center text-3xl font-bold text-white mb-2">
            {isRegistering ? 'Criar Conta' : 'Login'}
          </h2>
          <p className="text-center text-gray-400 mb-6">
            Para jogar o Chess AI
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-[#302e2b] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#81b64c]"
            />
            {isRegistering && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#302e2b] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#81b64c]"
              />
            )}
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#302e2b] border border-[#3d3d3d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#81b64c]"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white p-3 rounded-lg font-semibold text-lg transition-all"
            >
              {isRegistering ? 'Registrar' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white"
            >
              {isRegistering
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Registre-se'}
            </button>
          </form>
        </div> {/* <-- DIV DE FECHAMENTO CORRIGIDA */}
      </div>
    );
  }

  // Se o token existir, renderiza o componente de Jogo
  return <Home token={token} />;
}