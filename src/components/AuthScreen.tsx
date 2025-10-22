// src/components/AuthScreen.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { Brain, LogIn, UserPlus, Loader2 } from 'lucide-react';

export const AuthScreen = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleAuth = async () => {
    clearError();
    try {
      if (authMode === 'register') {
        await register(authForm);
        // Sucesso!
        setAuthMode('login');
        // Você pode mostrar uma mensagem de sucesso aqui
      } else {
        await login({
          username: authForm.username,
          password: authForm.password,
        });
        // O login bem-sucedido mudará o 'token' no contexto,
        // e o App.tsx nos levará para a próxima tela.
      }
    } catch (err) {
      // Erro já está sendo tratado no contexto
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full h-screen bg-[#302e2b] flex items-center justify-center p-4">
      <div className="bg-[#262421] border border-[#3d3d3d] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain className="w-10 h-10 text-[#81b64c]" />
          <h1 className="text-3xl font-bold text-[#f0f0f0]">Chess AI</h1>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setAuthMode('login');
                clearError();
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-[#81b64c] text-white'
                  : 'bg-[#403e3c] text-[#b3b3b3]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                clearError();
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                authMode === 'register'
                  ? 'bg-[#81b64c] text-white'
                  : 'bg-[#403e3c] text-[#b3b3b3]'
              }`}
            >
              Registrar
            </button>
          </div>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={authForm.username}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
          />

          {authMode === 'register' && (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={authForm.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={authForm.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#403e3c] border border-[#4b4a4a] rounded-lg text-[#f0f0f0] focus:outline-none focus:border-[#81b64c]"
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full bg-[#81b64c] hover:bg-[#70a03f] text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : authMode === 'login' ? (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Registrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};