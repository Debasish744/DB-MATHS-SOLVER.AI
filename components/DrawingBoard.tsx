
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface DrawingBoardProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({ onCapture, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = '#000000';
        context.lineWidth = 3;
        setCtx(context);
        
        // Fill white background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (ctx) ctx.closePath();
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clear = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const capture = () => {
    if (canvasRef.current) {
      onCapture(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="flex justify-between w-full mb-3 px-1">
        <h3 className="text-sm font-semibold text-slate-700">Draw your problem</h3>
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-red-500">Cancel</button>
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={250}
        className="border border-slate-300 rounded-lg cursor-crosshair bg-white touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2 mt-4 w-full">
        <button 
          onClick={clear}
          className="flex-1 py-2 px-4 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
        >
          Clear
        </button>
        <button 
          onClick={capture}
          className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Solve Drawing
        </button>
      </div>
    </div>
  );
};

export default DrawingBoard;
