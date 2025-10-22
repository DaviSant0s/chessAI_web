// src/hooks/useBoardSize.ts
import { useState, useEffect } from 'react';

export const useBoardSize = () => {
  const [boardSize, setBoardSize] = useState<number>(600);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        setBoardSize(Math.min(width - 32, height * 0.5));
      } else if (width < 1024) {
        setBoardSize(Math.min(width * 0.6, height * 0.7));
      } else {
        setBoardSize(Math.min(600, height * 0.75));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return boardSize;
};