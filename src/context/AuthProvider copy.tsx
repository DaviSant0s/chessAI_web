// src/context/AuthProvider.tsx
import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (formData: any) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar perfil do usuário se o token existir
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      api
        .getProfile(token)
        .then(setUser)
        .catch(() => {
          // Token inválido
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (formData: any) => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await api.loginUser(formData);
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
    } catch (err: any) {
      setError(err.message);
      throw err; // Propaga o erro para o componente
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: any) => {
    try {
      setError(null);
      setIsLoading(true);
      await api.registerUser(formData);
      // Opcional: fazer login automaticamente ou redirecionar
    } catch (err: any) {
      setError(err.message);
      throw err; // Propaga o erro
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  const clearError = () => setError(null);

  const value = {
    token,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook customizado para consumir o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};