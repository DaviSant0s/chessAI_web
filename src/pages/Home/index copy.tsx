import { useState } from "react";
import { Chessboard } from "react-chessboard";

interface EvaluationResponse {
  evaluation: string;
  prob: number;
  move?: string;
}

export default function Home() {
  const [fen, setFen] = useState<string>("start"); // posição inicial
  const [evaluation, setEvaluation] = useState<string>(""); // label da IA
  const [prob, setProb] = useState<number>(0);         // probabilidade
  const [suggestion, setSuggestion] = useState<string>(""); // sugestão da IA

  const handleMove = async (sourceSquare: string, targetSquare: string): Promise<boolean> => {
    const move = sourceSquare + targetSquare;

    try {
      // envia a jogada para a API para avaliação
      const res = await fetch("http://localhost:5000/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move })
      });
      const data: EvaluationResponse = await res.json();

      // atualiza avaliação e sugestão
      setEvaluation(data.evaluation);
      setProb(data.prob);
      if (data.move) setSuggestion(data.move);

      // aqui você poderia atualizar a FEN caso o backend retorne
      // setFen(data.fen);

    } catch (err) {
      console.error("Erro ao avaliar jogada:", err);
    }

    return true; // aceita o movimento no frontend
  };

  const handleReset = async () => {
    try {
      const res = await fetch("http://localhost:5000/reset", { method: "POST" });
      const data = await res.json();
      setFen(data.fen);
      setEvaluation("");
      setProb(0);
      setSuggestion("");
    } catch (err) {
      console.error("Erro ao resetar o jogo:", err);
    }
  };

  const handleSuggest = async () => {
    try {
      const res = await fetch("http://localhost:5000/suggest", { method: "POST" });
      const data = await res.json();
      setSuggestion(data.move);
    } catch (err) {
      console.error("Erro ao pegar sugestão:", err);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 gap-6">
      <Chessboard
        position={fen}
        onPieceDrop={handleMove}
        boardWidth={900}
      />

      <div className="flex gap-4">
        <button
          onClick={handleSuggest}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sugestão
        </button>
        <button
          onClick={handleReset}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reset
        </button>
      </div>

      {evaluation && (
        <div className="mt-4 text-lg">
          Avaliação da IA: <span className="font-bold">{evaluation}</span> (Prob.: {(prob * 100).toFixed(2)}%)
        </div>
      )}

      {suggestion && (
        <div className="mt-2 text-lg">
          Sugestão da IA: <span className="font-bold">{suggestion}</span>
        </div>
      )}
    </div>
  );
}