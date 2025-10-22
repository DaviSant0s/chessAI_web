// src/components/modals/CreateGameModal.tsx
import { useState } from 'react';
import { useGame } from '../../context/GameProvider';
import { X, Plus, Loader2 } from 'lucide-react';

interface CreateGameModalProps {
  onClose: () => void;
}

export const CreateGameModal = ({ onClose }: CreateGameModalProps) => {
  const { createGame, isLoading } = useGame();
  const [playAs, setPlayAs] = useState<'white' | 'black'>('white');

  const handleCreate = () => {
    createGame(playAs).then((gameId) => {
      if (gameId) {
        onClose(); // Fecha o modal se o jogo for criado
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#f0f0f0]">Criar Jogo</h2>
          <button
            onClick={onClose}
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
            onClick={handleCreate}
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
  );
};