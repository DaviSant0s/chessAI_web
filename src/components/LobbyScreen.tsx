// src/components/LobbyScreen.tsx
import { Users, Plus } from 'lucide-react';

interface LobbyScreenProps {
  onShowCreateModal: () => void;
  onShowGamesModal: () => void;
}

export const LobbyScreen = ({
  onShowCreateModal,
  onShowGamesModal,
}: LobbyScreenProps) => {
  return (
    <div className="container mx-auto px-4 py-6 lg:py-10">
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
              onClick={onShowCreateModal}
              className="bg-[#81b64c] hover:bg-[#70a03f] text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Criar Jogo
            </button>
            <button
              onClick={onShowGamesModal}
              className="bg-[#403e3c] hover:bg-[#4b4a4a] text-[#f0f0f0] px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Ver Jogos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};