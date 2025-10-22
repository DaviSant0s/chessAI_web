// src/components/Header.tsx
import { useAuth } from '../context/AuthProvider';
import { Brain, Crown, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="relative z-20 bg-[#262421] border-b border-[#3d3d3d] shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-[#81b64c]" />
          <h1 className="text-2xl font-bold text-[#f0f0f0]">Chess AI</h1>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="bg-[#302e2b] border border-[#3d3d3d] rounded-lg px-3 py-2 flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#f0d078]" />
              <span className="text-[#f0f0f0] font-semibold text-sm">
                {user.username}
              </span>
              <span className="text-[#81b64c] text-sm">({user.rating})</span>
            </div>
          )}
          <button
            onClick={logout}
            className="bg-[#c94545] hover:bg-[#b33838] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};