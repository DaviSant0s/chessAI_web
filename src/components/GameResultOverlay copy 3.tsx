// src/components/GameResultOverlay.tsx
import { useState, useEffect } from 'react'; // Importe useState e useEffect
import { RotateCcw, Trophy, X, RefreshCw } from 'lucide-react'; // Importe X e RefreshCw
import { useGame } from '../context/GameProvider';
import { useAuth } from '../context/AuthProvider'; 

export const GameResultOverlay = () => {
  const { gameState, leaveGame } = useGame();
  const { user } = useAuth();
  
  // Estado local para controlar se o modal está visível
  const [isVisible, setIsVisible] = useState(true);

  // Efeito para reexibir o modal caso um *novo* jogo termine
  useEffect(() => {
    if (gameState?.result) {
      setIsVisible(true);
    }
  }, [gameState?.result]); // Depende do 'result'

  // Se não houver resultado, ou o usuário fechou o modal, não mostre nada
  if (!gameState?.result || !isVisible || !user) {
    return null;
  }

  // --- Lógica de Personalização (mesma de antes) ---
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
    case 'spectator':
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
      description = 'O jogo empatou por afogamento (stalemate).';
      break;
    case 'draw':
      description = 'Empate por material insuficiente ou acordo.';
      break;
    case 'resignation':
      description = 'O jogo terminou por desistência.';
      break;
    default:
      description = `Resultado final: ${gameState.result}`;
  }
  // --- Fim da Lógica de Personalização ---

  // Função placeholder para revanche
  const handleRematch = () => {
    // 1. FECHAR O MODAL
    setIsVisible(false);
    
    // 2. LÓGICA DE BACK-END (NÃO IMPLEMENTADA)
    // - O ideal seria enviar uma notificação para a API
    // - A API notificaria o oponente (via polling)
    // - Se o oponente aceitasse, a API criaria um novo jogo
    //   e retornaria o novo game_id para ambos os jogadores
    console.log("Pedido de revanche enviado (simulação front-end)");
    alert("Função de revanche ainda não implementada no back-end.");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      {/* Adicionado 'relative' para posicionar o 'X' */}
      <div className="relative bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* BOTÃO DE FECHAR (NOVO) */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-[#b3b3b3] hover:text-[#f0f0f0] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <Trophy className={`w-20 h-20 mx-auto mb-6 ${iconColor}`} />
        
        <h2 className="text-3xl font-bold text-[#f0f0f0] mb-2">{title}</h2>
        <p className="text-lg text-[#b3b3b3] mb-8">{description}</p>
        
        {/* BOTÕES DE AÇÃO (MODIFICADO) */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Botão de Revanche */}
          <button
            onClick={handleRematch}
            className="flex-1 bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Revanche
          </button>
          
          {/* Botão de Sair */}
          <button
            onClick={leaveGame}
            className="flex-1 bg-[#403e3c] hover:bg-[#4b4a4a] text-[#f0f0f0] px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Sair para o Lobby
          </button>
        </div>

      </div>
    </div>
  );
};