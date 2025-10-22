// src/components/GameResultOverlay.tsx
import { useState, useEffect } from 'react';
import { Trophy, X } from 'lucide-react'; // Importamos o 'X'
import { useGame } from '../context/GameProvider';
import { useAuth } from '../context/AuthProvider';

export const GameResultOverlay = () => {
  const { gameState } = useGame();
  const { user } = useAuth();
  
  // Estado para o usuário poder fechar o toast
  const [isVisible, setIsVisible] = useState(false);

  // Quando um resultado de jogo aparecer, mostre o toast
  useEffect(() => {
    if (gameState?.result) {
      setIsVisible(true);
    }
  }, [gameState?.result]);

  // Não renderize nada se não houver resultado, 
  // usuário não logado, ou se o usuário fechou
  if (!isVisible || !gameState?.result || !user) {
    return null;
  }

  // --- Lógica de Personalização (Exatamente a mesma de antes) ---
  const username = user.username;
  const whitePlayer = gameState.player_white;
  const blackPlayer = gameState.player_black;
  const result = gameState.result;

  let userOutcome: 'win' | 'loss' | 'draw' | 'spectator' = 'spectator';

  if (result === '1-0') {
    if (username === whitePlayer) userOutcome = 'win';
    else if (username === blackPlayer) userOutcome = 'loss';
  } else if (result === '0-1') {
    if (username === blackPlayer) userOutcome = 'win';
    else if (username === whitePlayer) userOutcome = 'loss';
  } else if (result === '1/2-1/2') {
    if (username === whitePlayer || username === blackPlayer) {
      userOutcome = 'draw';
    }
  }

  let title = '';
  let iconColor = 'text-[#f0d078]';

  switch (userOutcome) {
    case 'win':
      title = 'Você Venceu!';
      iconColor = 'text-[#f0d078]';
      break;
    case 'loss':
      title = 'Você Perdeu!';
      iconColor = 'text-red-500';
      break;
    case 'draw':
      title = 'Empate!';
      iconColor = 'text-[#b3b3b3]';
      break;
    default: // Espectador
      if (result === '1-0') title = 'Vitória das Brancas!';
      else if (result === '0-1') title = 'Vitória das Pretas!';
      else title = 'Empate!';
      break;
  }

  let description = '';
  switch (gameState.status) {
    case 'checkmate':
      description = 'O jogo terminou em checkmate.';
      break;
    case 'stalemate':
      description = 'O jogo empatou por afogamento.';
      break;
    case 'draw':
      description = 'Empate por material insuficiente.';
      break;
    case 'resignation':
      description = 'O jogo terminou por desistência.';
      break;
    default:
      description = `Resultado final: ${gameState.result}`;
  }
  // --- Fim da Lógica ---

  // ================== NOVO RENDER (TOAST) ==================
  return (
    // Posicionado no canto, discreto, sem backdrop
    <div className="fixed top-20 right-4 z-40 w-full max-w-sm bg-[#262421] border border-[#3d3d3d] rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
      {/* Botão de Fechar */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-[#b3b3b3] hover:text-[#f0f0f0] transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Conteúdo Informativo (sem botões) */}
      <div className="flex items-start gap-4">
        <Trophy className={`w-10 h-10 ${iconColor} mt-1`} />
        <div>
          <h2 className="text-xl font-bold text-[#f0f0f0] mb-1">{title}</h2>
          <p className="text-sm text-[#b3b3b3]">{description}</p>
        </div>
      </div>
    </div>
  );
};