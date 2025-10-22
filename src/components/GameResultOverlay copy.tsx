// src/components/GameResultOverlay.tsx
import { RotateCcw, Trophy } from 'lucide-react';
import { useGame } from '../context/GameProvider';
import { useAuth } from '../context/AuthProvider'; // Precisamos saber quem é o jogador

export const GameResultOverlay = () => {
  const { gameState, leaveGame } = useGame();
  const { user } = useAuth();

  // Se não houver resultado, o jogo não acabou. Não renderize nada.
  if (!gameState?.result) {
    return null;
  }

  let title = '';
  let description = '';
  let iconColor = 'text-[#f0d078]'; // Dourado para troféu

  // 1. Determina o Título (Quem venceu?)
  switch (gameState.result) {
    case '1-0':
      title = 'Vitória das Brancas!';
      // Muda a cor do troféu se o jogador logado perdeu
      if (user?.username === gameState.player_black) {
        iconColor = 'text-red-500';
      }
      break;
    case '0-1':
      title = 'Vitória das Pretas!';
      // Muda a cor do troféu se o jogador logado perdeu
      if (user?.username === gameState.player_white) {
        iconColor = 'text-red-500';
      }
      break;
    case '1/2-1/2':
      title = 'Empate!';
      iconColor = 'text-[#b3b3b3]'; // Prata/cinza para empate
      break;
    default:
      title = 'Jogo Finalizado!';
  }

  // 2. Determina a Descrição (Por quê?)
  switch (gameState.status) {
    case 'checkmate':
      description = 'O rei adversário está em checkmate.';
      break;
    case 'stalemate':
      description = 'O jogo empatou por afogamento (stalemate).';
      break;
    case 'draw':
      description = 'O jogo empatou por acordo ou material insuficiente.';
      break;
    case 'resignation':
      description = 'O jogo terminou por desistência.';
      break;
    default:
      // Fallback
      description = `Resultado final: ${gameState.result}`;
  }

  return (
    // O 'z-40' o coloca abaixo dos modais (z-50), mas acima do resto
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
        
        <Trophy className={`w-20 h-20 mx-auto mb-6 ${iconColor}`} />
        
        <h2 className="text-3xl font-bold text-[#f0f0f0] mb-2">{title}</h2>
        <p className="text-lg text-[#b3b3b3] mb-8">{description}</p>
        
        <button
          onClick={leaveGame} // 'leaveGame' já nos leva de volta ao lobby
          className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Voltar para o Lobby
        </button>
      </div>
    </div>
  );
};