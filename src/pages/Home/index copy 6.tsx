import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  Brain,
  RotateCcw,
  Lightbulb,
  Crown,
  Activity,
  Bot,
} from 'lucide-react';
import imageBot from '../../assets/f900bba2-8a59-11ea-9b00-77e384ff7d49.3f025953.384x384o.89a5f2a1cb5c.png';

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
  const [gameResult, setGameResult] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:5000/state')
      .then((res) => res.json())
      .then((data: StateResponse) => {
        setFen(data.fen);
        setTurn(data.turn);
      })
      .catch((err) => console.error(err));
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
        if (data.result) setGameResult(data.result);
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
        setGameResult('');
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
    <div className=" w-full h-screen overflow-x-hidden overflow-y-hidden bg-[#302e2b]">
      <header className="relative z-20 bg-[#262421] border-b border-[#3d3d3d] shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#81b64c]" />
            <h1 className="text-2xl font-bold text-[#f0f0f0]">Chess AI</h1>
          </div>

          <div className="flex items-center gap-3 bg-[#302e2b] border border-[#3d3d3d] rounded-lg px-3 py-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e8e8e8] flex items-center justify-center">
              <img src={imageBot} alt="" />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[#f0f0f0] font-semibold text-sm">
                Jimmy
              </span>
            </div>
          </div>
        </div>
      </header>
      <div className="relative z-10 container mx-auto px-4 py-6 lg:py-10">

        {/* Game Result Modal */}
        {gameResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#262421] border-2 border-[#81b64c] rounded-2xl p-6 lg:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#81b64c]/20 flex items-center justify-center">
                    <Crown className="w-10 h-10 lg:w-12 lg:h-12 text-[#f0d078]" />
                  </div>
                </div>
                <p className="text-lg lg:text-xl text-[#b3b3b3] font-semibold mb-6">
                  Resultado
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#f0f0f0] mb-7">
                  {gameResult === '1-0' ? 'Brancas Vencem!' : 
                   gameResult === '0-1' ? 'Pretas Vencem!' : 
                   gameResult === '1/2-1/2' ? 'Empate!' :
                   'Jogo Finalizado!'}
                </h2>
                <button
                  onClick={handleReset}
                  className="bg-[#81b64c] hover:bg-[#70a03f] text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 w-full cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-7xl mx-auto">
          <div className="">
            {/* Player Info */}
            <div className="flex items-start justify-start gap-2 mb-2">
              <div className="w-[40px] h-[40px] overflow-hidden bg-[#403e3c] border border-[#4b4a4a] rounded-sm  flex items-center justify-center">
                <Bot color="#f0f0f0" />
              </div>
              <span className="text-[#f0f0f0] font-semibold text-sm">Bot</span>
            </div>

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

            {/* Player Info */}
            <div className="flex items-start justify-start gap-2 mt-2">
              <div className="w-[40px] h-[40px] overflow-hidden bg-[#403e3c] border border-[#4b4a4a] rounded-sm  flex items-center justify-center">
                <img src={imageBot} alt="" />
              </div>
              <span className="text-[#f0f0f0] font-semibold text-sm">
                Jimmy
              </span>
            </div>
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-96 space-y-4 mt-[48px]">
            {/* Turn indicator */}
            <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#3d3d3d] shadow-xl">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[#f0d078]" />
                <div>
                  <p className="text-xs text-[#b3b3b3] uppercase tracking-wide">
                    Turno Atual
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-[#f0f0f0]">
                    {turn === 'white' ? 'Brancas' : 'Pretas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Evaluation */}
            {evaluation && (
              <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#81b64c] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Activity className="w-6 h-6 text-[#81b64c] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#b3b3b3] uppercase tracking-wide mb-2">
                      Avaliação
                    </p>
                    <p className="text-xl lg:text-2xl font-bold text-[#f0f0f0] mb-1 break-words">
                      {evaluation}
                    </p>
                    <div className="w-full bg-[#1a1917] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#81b64c] transition-all duration-500 rounded-full"
                        style={{ width: `${prob * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-[#b3b3b3] mt-2">
                      Confiança:{' '}
                      <span className="font-semibold text-[#81b64c]">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion */}
            {suggestion && (
              <div className="bg-[#262421] backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-[#769656] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-[#f0d078] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#b3b3b3] uppercase tracking-wide mb-2">
                      Sugestão
                    </p>
                    <p className="text-lg lg:text-xl font-bold text-[#f0f0f0] break-words">
                      {suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSuggest}
                disabled={isLoading}
                className="group relative bg-[#81b64c] hover:bg-[#70a03f] hover:-translate-y-0.5 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg hover:shadow-[#81b64c]/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lightbulb className="w-5 h-5" />
                <span className="text-sm lg:text-base">Sugestão</span>
                {isLoading && (
                  <div className="absolute inset-0 bg-[#81b64c]/50 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={isLoading}
                className="group relative bg-[#c94545] hover:bg-[#b33838] hover:-translate-y-0.5 text-white px-4 lg:px-6 py-3 lg:py-4 rounded-xl font-semibold shadow-lg hover:shadow-[#c94545]/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-sm lg:text-base">Resetar</span>
                {isLoading && (
                  <div className="absolute inset-0 bg-[#c94545]/50 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
