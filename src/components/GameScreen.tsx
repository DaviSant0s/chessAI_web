// src/components/GameScreen.tsx
import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGame } from '../context/GameProvider';
import { useAuth } from '../context/AuthProvider';
import { useBoardSize } from '../hooks/useBoardSize';
import {
  RotateCcw,
  Lightbulb,
  Crown,
  Activity,
  Bot,
} from 'lucide-react';

// Componente interno para informações do jogador
const PlayerInfo = ({
  player,
  turn,
  color,
}: {
  player: string | null;
  turn: string;
  color: 'white' | 'black';
}) => (
  <div className="flex items-center gap-2">
    <div className="w-10 h-10 bg-[#403e3c] border border-[#4b4a4a] rounded-sm flex items-center justify-center">
      {turn === color ? (
        <Crown className="w-6 h-6 text-[#f0d078]" />
      ) : (
        <Bot className="w-6 h-6 text-[#f0f0f0]" />
      )}
    </div>
    <span className="text-[#f0f0f0] font-semibold">
      {player || 'Aguardando...'}
    </span>
  </div>
);

// Painel lateral de informações
const GamePanel = () => {
  const {
    gameState,
    evaluation,
    prob,
    suggestion,
    isLoading,
    handleSuggest,
    leaveGame,
  } = useGame();

  return (
    <div className="w-full lg:w-96 space-y-4 mt-12">
      {/* Status do jogo */}
      <div className="bg-[#262421] rounded-xl p-6 border border-[#3d3d3d]">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-[#f0d078]" />
          <div>
            <p className="text-xs text-[#b3b3b3] uppercase">Status</p>
            <p className="text-xl font-bold text-[#f0f0f0]">
              {gameState?.status === 'ongoing'
                ? `Turno: ${
                    gameState.turn === 'white' ? 'Brancas' : 'Pretas'
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
              <p className="text-xs text-[#b3b3b3] uppercase mb-2">Avaliação</p>
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
              <p className="text-xs text-[#b3b3b3] uppercase mb-2">Sugestão</p>
              <p className="text-xl font-bold text-[#f0f0f0]">{suggestion}</p>
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
  );
};

// Componente principal da tela de jogo
export const GameScreen = () => {
  const { user } = useAuth();
  const { gameState, handleMove, isLoading } = useGame();
  const boardSize = useBoardSize();

  const boardOrientation = useMemo<'white' | 'black'>(() => {
    if (user && gameState) {
      if (user.username === gameState.player_black) {
        return 'black';
      }
    }
    return 'white';
  }, [user, gameState]);

  // Wrapper para a função 'onPieceDrop'
  const onPieceDrop = (sourceSquare: string, targetSquare: string): boolean => {
    handleMove(sourceSquare, targetSquare);
    // Retornamos 'true' imediatamente para a UI do tabuleiro
    // O Context cuida da lógica assíncrona
    return true;
  };

  const whitePlayerInfo = (
    <PlayerInfo
      player={gameState?.player_white || null}
      turn={gameState?.turn || 'white'}
      color="white"
    />
  );
  const blackPlayerInfo = (
    <PlayerInfo
      player={gameState?.player_black || null}
      turn={gameState?.turn || 'white'}
      color="black"
    />
  );

  return (
    <div className="container mx-auto px-4 py-6 lg:py-10">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-7xl mx-auto">
        {/* TABULEIRO */}
        <div>
          {/* Jogador do Topo */}
          <div className="mb-2">
            {boardOrientation === 'white' ? blackPlayerInfo : whitePlayerInfo}
          </div>

          <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#3d3d3d]">
            <Chessboard
              position={gameState?.fen || 'start'}
              onPieceDrop={onPieceDrop}
              boardWidth={boardSize}
              arePiecesDraggable={
                !isLoading && gameState?.status === 'ongoing'
              }
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              boardOrientation={boardOrientation}
            />
          </div>

          {/* Jogador de Baixo */}
          <div className="mt-2">
            {boardOrientation === 'white' ? whitePlayerInfo : blackPlayerInfo}
          </div>
        </div>

        {/* PAINEL LATERAL */}
        <GamePanel />
      </div>
    </div>
  );
};