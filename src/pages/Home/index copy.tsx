import { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';

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
  const [fen, setFen] = useState<string>('start'); // posição inicial
  const [evaluation, setEvaluation] = useState<string>(''); // label da IA
  const [prob, setProb] = useState<number>(0); // probabilidade
  const [suggestion, setSuggestion] = useState<string>(''); // sugestão da IA
  const [turn, setTurn] = useState<string>('white');
  const [boardSize, setBoardSize] = useState<number>(800); // tamanho inicial

  useEffect(() => {
    fetch('http://localhost:5000/state')
      .then(res => res.json())
      .then((data: StateResponse) => {
        setFen(data.fen);
        setTurn(data.turn);
      })
  }, []);

  useEffect(() => {
    // Função que atualiza o boardWidth com base na largura da tela
    const handleResize = () => {
      const height = Math.min(window.innerHeight * 0.9); // 80% da tela, máximo 600px
      setBoardSize(height);
    };

    handleResize(); // set inicial
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
    const move = sourceSquare + targetSquare;

    setSuggestion('')

    fetch('http://localhost:5000/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move }),
    })
      .then((res) => res.json())
      .then((data: MoveResponse) => {
        if (data.error) {
          // alert(data.error);
          return;
        }
        setFen(data.fen); // atualiza o tabuleiro
        setEvaluation(data.label);
        setProb(data.prob);
        if (data.result) alert('Jogo terminado! Resultado: ' + data.result);
      })
      .catch((err) => console.error(err));

    return true; // aceita o movimento no frontend
  };

  const handleReset = () => {
    fetch('http://localhost:5000/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setFen(data.fen))
      .catch((err) => console.error(err));
  };

  const handleSuggest = () => {
    fetch('http://localhost:5000/suggest', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => setSuggestion(data.suggestion))
      .catch((err) => console.error(err));
  };

  return (
    <div className=" w-screen h-screen flex flex-row justify-center m-auto pt-10 gap-5 relative z-2">
      <div className='rounded-md overflow-hidden h-fit'>
        <Chessboard position={fen} onPieceDrop={handleMove} boardWidth={boardSize} />
      </div>

      <div className='flex flex-col gap-2'>
        <div className="flex gap-4 h-fit">
          <button
            onClick={handleSuggest}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer transition"
          >
            Sugestão
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer transition"
          >
            Reset
          </button>
        </div>

        {evaluation && (
          <div className="mt-4 text-lg text-amber-50">
            Avaliação: <span className="font-bold">{evaluation}</span>{' '}
            ({(prob * 100).toFixed(2)}%)
          </div>
        )}

        {suggestion && (
          <div className="mt-2 text-lg text-amber-50">
            Sugestão: <span className="font-bold">{suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
}
