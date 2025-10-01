import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Brain, RotateCcw, Lightbulb, Crown, Activity } from 'lucide-react';

interface MoveResponse {
  fen: string;
  result?: string | null;
  error?: string;
  label: string;
  prob: number;
}

interface StateResponse {
  fen: string;
  turn: string;
}

export default function Home() {
  const [fen, setFen] = useState<string>('start');
  const [evaluation, setEvaluation] = useState<string>('');
  const [prob, setProb] = useState<number>(0);
  const [suggestion, setSuggestion] = useState<string>('');
  const [turn, setTurn] = useState<string>('white');
  const [boardSize, setBoardSize] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://localhost:5000/state')
      .then(res => res.json())
      .then((data: StateResponse) => {
        setFen(data.fen);
        setTurn(data.turn);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width < 640) {
        // Mobile
        setBoardSize(Math.min(width - 32, height * 0.5));
      } else if (width < 1024) {
        // Tablet
        setBoardSize(Math.min(width * 0.6, height * 0.7));
      } else {
        // Desktop
        setBoardSize(Math.min(600, height * 0.75));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    const move = sourceSquare + targetSquare;
    setSuggestion('');
    setIsLoading(true);

    fetch('http://localhost:5000/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move }),
    })
      .then((res) => res.json())
      .then((data: MoveResponse) => {
        if (data.error) {
          return;
        }
        setFen(data.fen);
        setEvaluation(data.label);
        setProb(data.prob);
        setTurn(turn === 'white' ? 'black' : 'white');
        if (data.result) alert('Jogo terminado! Resultado: ' + data.result);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));

    return true;
  };

  const handleReset = () => {
    setIsLoading(true);
    fetch('http://localhost:5000/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        setFen(data.fen);
        setEvaluation('');
        setProb(0);
        setSuggestion('');
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const handleSuggest = () => {
    setIsLoading(true);
    fetch('http://localhost:5000/suggest', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => setSuggestion(data.suggestion))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      
      <div className="relative z-10 container mx-auto px-4 py-6 lg:py-10">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="w-8 h-8 lg:w-12 lg:h-12 text-purple-400" />
            <h1 className="text-3xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Chess AI
            </h1>
          </div>
          <p className="text-slate-300 text-sm lg:text-base">Jogue xadrez com análise de IA em tempo real</p>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Chess board */}
          <div className="w-full lg:w-auto flex justify-center">
            <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-[#3d3d3d]">
              <Chessboard 
                position={fen} 
                onPieceDrop={handleMove} 
                boardWidth={boardSize}
                customBoardStyle={{
                  borderRadius: '0px',
                }}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-96 space-y-4">
            {/* Turn indicator */}
            <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Turno Atual</p>
                  <p className="text-xl lg:text-2xl font-bold text-white">
                    {turn === 'white' ? 'Brancas' : 'Pretas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Evaluation */}
            {evaluation && (
              <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-purple-500/30 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Activity className="w-6 h-6 text-purple-300 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-200 uppercase tracking-wide mb-2">Avaliação da IA</p>
                    <p className="text-xl lg:text-2xl font-bold text-white mb-1 break-words">{evaluation}</p>
                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                        style={{ width: `${prob * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-purple-200 mt-2">
                      Confiança: <span className="font-semibold">{(prob * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion */}
            {suggestion && (
              <div className="bg-gradient-to-br from-blue-900/60 to-cyan-900/60 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-blue-500/30 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-yellow-300 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-200 uppercase tracking-wide mb-2">Sugestão da IA</p>
                    <p className="text-lg lg:text-xl font-bold text-white break-words">{suggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSuggest}
                disabled={isLoading}
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-5 h-5" />
                <span className="text-sm lg:text-base">Sugestão</span>
                {isLoading && (
                  <div className="absolute inset-0 bg-blue-600/50 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={isLoading}
                className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg hover:shadow-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-sm lg:text-base">Resetar</span>
                {isLoading && (
                  <div className="absolute inset-0 bg-red-600/50 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>

            {/* Info card */}
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-4 border border-slate-700/30 text-center">
              <p className="text-xs lg:text-sm text-slate-400">
                Clique em uma peça e depois no destino para fazer sua jogada
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}