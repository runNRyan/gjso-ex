'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'rect' | 'circle';
  rotation: number;
}

const COLORS = [
  '#1E5C52', '#1E5C52', '#1E5C52',
  '#FFFFFF', '#FFFFFF',
  '#F5F0E8', '#EDE7D9',
  '#2a7a6d', '#163f38',
];

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 2.5,
      duration: Math.random() * 2 + 2.5,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: `${piece.x}%`,
              top: '-20px',
              width: `${piece.size}px`,
              height: piece.shape === 'rect' ? `${piece.size * 0.45}px` : `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '1px',
              transform: `rotate(${piece.rotation}deg)`,
              border: piece.color === '#FFFFFF' ? '1px solid #1E5C52' : 'none',
              animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}
