import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './index.css'; // Certifique-se de que seu TailwindCSS está importado
import { AuthProvider } from './context/AuthProvider';
import { GameProvider } from './context/GameProvider';

import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
     <AuthProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </AuthProvider>
    </StrictMode>
  </BrowserRouter>
);
