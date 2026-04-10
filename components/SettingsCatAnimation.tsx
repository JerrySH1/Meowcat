import React, { useRef, useEffect } from 'react';

interface SettingsCatAnimationProps {
  meowText: string;
}

const SettingsCatAnimation: React.FC<SettingsCatAnimationProps> = ({ meowText }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frameRef.current++;
      const f = frameRef.current;
      ctx.clearRect(0, 0, 300, 200);
      
      ctx.save();
      ctx.translate(150, 150);
      const scale = 1 + Math.sin(f * 0.05) * 0.02;
      ctx.scale(scale, scale);

      // Tail Wag
      ctx.beginPath();
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const tailWag = Math.sin(f * 0.1) * 20;
      ctx.moveTo(35, 10);
      ctx.bezierCurveTo(60, 10, 60 + tailWag, -40, 35, -30);
      ctx.stroke();

      // Body Base
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 45, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ears (White)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-20, -30); ctx.lineTo(-35, -60); ctx.lineTo(-5, -40);
      ctx.fill(); ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(20, -30); ctx.lineTo(35, -60); ctx.lineTo(5, -40);
      ctx.fill(); ctx.stroke();

      // Face (Squinting Happy Eyes)
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 3;
      
      // Left Eye
      ctx.beginPath();
      ctx.moveTo(-25, -10); ctx.lineTo(-15, -20); ctx.lineTo(-5, -10);
      ctx.stroke();
      // Right Eye
      ctx.beginPath();
      ctx.moveTo(5, -10); ctx.lineTo(15, -20); ctx.lineTo(25, -10);
      ctx.stroke();

      // Blush
      ctx.fillStyle = 'rgba(255, 182, 193, 0.6)'; 
      ctx.beginPath(); ctx.arc(-25, 5, 8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(25, 5, 8, 0, Math.PI*2); ctx.fill();

      // Mouth
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-2, 2); ctx.lineTo(2, 2); ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 2); ctx.quadraticCurveTo(-5, 8, -10, 5);
      ctx.moveTo(0, 2); ctx.quadraticCurveTo(5, 8, 10, 5);
      ctx.stroke();

      // Meow Bubble
      if (f % 200 < 60) {
        ctx.fillStyle = '#2d2d2d';
        ctx.font = '24px "Chewy"';
        // Add minimal outline for better readability
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeText(meowText, 50, -60);
        ctx.fillText(meowText, 50, -60);
      }

      ctx.restore();
      requestAnimationFrame(render);
    };
    render();
  }, [meowText]);

  return <canvas ref={canvasRef} width={300} height={200} className="mx-auto" />;
};

export default SettingsCatAnimation;
