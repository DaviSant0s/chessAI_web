// src/App.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useGame } from '../../context/GameProvider';
import { AuthScreen } from '../../components/AuthScreen';
import { LobbyScreen } from '../../components/LobbyScreen';
import { GameScreen } from '../../components/GameScreen';
import { Header } from '../../components/Header';
import { CreateGameModal } from '../../components/modals/CreateGameModal';
import { OpenGamesModal } from '../../components/modals/OpenGamesModal';
import { GameResultOverlay } from '../../components/GameResultOverlay';

export default function Home() {
  const { token } = useAuth();
  const { currentGameId, error, clearError } = useGame(); // Pega o erro do Jogo

  // Estado dos Modais
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Se não estiver logado, mostre a tela de Auth
  if (!token) {
    return <AuthScreen />;
  }

  // Se estiver logado
  return (
    <div className="w-full h-screen overflow-x-hidden bg-[#302e2b]">
      <Header />

      <main>
        {currentGameId ? (
          <GameScreen />
        ) : (
          <LobbyScreen
            onShowCreateModal={() => setShowCreateModal(true)}
            onShowGamesModal={() => setShowGamesModal(true)}
          />
        )}
      </main>

      {/* Modais */}
      {showGamesModal && (
        <OpenGamesModal onClose={() => setShowGamesModal(false)} />
      )}
      {showCreateModal && (
        <CreateGameModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Este componente cuida de si mesmo. 
        Ele só vai aparecer se 'gameState.result' existir.
      */}
      <GameResultOverlay />

      {/* Notificação de erro global (do GameProvider) */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          {error}
          <button onClick={clearError} className="ml-4 font-bold">X</button>
        </div>
      )}
    </div>
  );
}