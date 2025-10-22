// src/components/GameResultOverlay.tsx
import { RotateCcw, Trophy } from 'lucide-react';
import { useGame } from '../context/GameProvider';
import { useAuth } from '../context/AuthProvider'; // Precisamos saber quem é o jogador

export const GameResultOverlay = () => {
  const { gameState, leaveGame } = useGame();
  const { user } = useAuth(); // Pegamos o usuário logado

  // Se não houver resultado, ou não soubermos quem é o usuário,
  // não renderize nada.
  if (!gameState?.result || !user) {
    return null;
  }

  // ================== LÓGICA DE PERSONALIZAÇÃO ==================
  
  const username = user.username;
  const whitePlayer = gameState.player_white;
  const blackPlayer = gameState.player_black;
  const result = gameState.result;

  // 1. Determina o resultado para o usuário
  let userOutcome: 'win' | 'loss' | 'draw' | 'spectator' = 'spectator';

  if (result === '1-0') { // Vitória das Brancas
    if (username === whitePlayer) userOutcome = 'win';
    else if (username === blackPlayer) userOutcome = 'loss';
  } else if (result === '0-1') { // Vitória das Pretas
    if (username === blackPlayer) userOutcome = 'win';
    else if (username === whitePlayer) userOutcome = 'loss';
  } else if (result === '1/2-1/2') { // Empate
    // Se o jogador estava jogando, é 'draw', senão é 'spectator'
    if (username === whitePlayer || username === blackPlayer) {
      userOutcome = 'draw';
    }
  }

  // 2. Define o Título e a Cor do Ícone
  let title = '';
  let iconColor = 'text-[#f0d078]'; // Dourado (Vitória)

  switch (userOutcome) {
    case 'win':
      title = 'Você Venceu!';
      iconColor = 'text-[#f0d078]'; // Dourado
      break;
    case 'loss':
      title = 'Você Perdeu!';
      iconColor = 'text-red-500'; // Vermelho
      break;
    case 'draw':
      title = 'Empate!';
      iconColor = 'text-[#b3b3b3]'; // Prata
      break;
    case 'spectator':
      // Lógica antiga para quem está assistindo
      if (result === '1-0') title = 'Vitória das Brancas!';
      else if (result === '0-1') title = 'Vitória das Pretas!';
      else title = 'Empate!';
      break;
  }

  // 3. Define a Descrição (agora mais neutra)
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
  // ================== FIM DA LÓGICA ==================


  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* O ícone e a cor agora são dinâmicos */}
        <Trophy className={`w-20 h-20 mx-auto mb-6 ${iconColor}`} />
        
        {/* O título agora é personalizado */}
        <h2 className="text-3xl font-bold text-[#f0f0f0] mb-2">{title}</h2>
        
        {/* A descrição é neutra */}
        <p className="text-lg text-[#b3b3b3] mb-8">{description}</p>
        
        <button
          onClick={leaveGame}
          className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Voltar para o Lobby
        </button>
      </div>
    </div>
  );
};