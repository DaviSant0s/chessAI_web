// src/components/modals/OpenGamesModal.tsx
import { useEffect } from 'react';
import { useGame } from '../../context/GameProvider';
import { X } from 'lucide-react';

interface OpenGamesModalProps {
  onClose: () => void;
}

export const OpenGamesModal = ({ onClose }: OpenGamesModalProps) => {
  const { openGames, isLoading, loadOpenGames, joinGame } = useGame();

  useEffect(() => {
    // Carrega os jogos quando o modal abre
    loadOpenGames();
  }, []);

  const handleJoin = (gameId: string) => {
    joinGame(gameId).then(() => {
      onClose(); // Fecha o modal se entrar no jogo com sucesso
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#f0f0f0]">
            Jogos Disponíveis
          </h2>
          <button
            onClick={onClose}
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
                    ID: {game.game_id.substring(0, 8)}...
                  </p>
                  <p className="text-[#b3b3b3] text-sm">
                    Precisa de jogador:{' '}
                    {game.needs_player === 'white' ? 'Brancas' : 'Pretas'}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin(game.game_id)}
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
  );
};