import React, { useEffect, useRef, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MOBILE_CANVAS_WIDTH, 
  MOBILE_CANVAS_HEIGHT,
  CAT_RADIUS, 
  BATHTUB, 
  MOBILE_BATHTUB,
  LITTER_BOX,
  MOBILE_LITTER_BOX,
  FOOD_BOWL,
  MOBILE_FOOD_BOWL,
  MAX_HP, 
  CATCH_DISTANCE,
  TRANSLATIONS,
  ITEMS_DATA,
  LevelData
} from '../constants';
import { CatEntity, Particle, Point, CatType, Language, GameOverReason, GameItem, CatState, ItemType } from '../types';
import { audio } from '../services/audioService';
import { generateCatThought } from '../services/geminiService';

interface GameEngineProps {
  onGameOver: (message: string, reason: GameOverReason) => void;
  onWin: (timeElapsed: number) => void;
  levelData: LevelData;
  language: Language;
  isMobile: boolean;
}

interface OwnerMessage {
  id: number;
  type: 'bath' | 'ouch';
  index: number;
  x: number;
  y: number;
}

interface PawPrint {
  x: number;
  y: number;
  angle: number;
  life: number;
}

// Vibrant Crayon Colors
const CRAYON = {
  black: '#2d2d2d',
  red: '#ff6b6b',
  blue: '#4dabf7',
  orange: '#ffa94d',
  skin: '#ffc9c9',
  green: '#69db7c',
  wood: '#d4a373',
  wall: '#f8f9fa'
};

const GameEngine: React.FC<GameEngineProps> = ({ onGameOver, onWin, levelData, language, isMobile }) => {
  const { catType, difficulty: temperament } = levelData;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // For elements escaping the box
  const hpRef = useRef<number>(MAX_HP);
  const [currentHp, setCurrentHp] = useState(MAX_HP);
  const [catThought, setCatThought] = useState<string>("");
  const [bathEmote, setBathEmote] = useState<string | null>(null);
  const [ownerMessages, setOwnerMessages] = useState<OwnerMessage[]>([]);
  
  const winSequenceRef = useRef<number>(0); // 0: playing, >0: animating bath
  const tubBrokenSequenceRef = useRef<number>(0); // 0: intact, >0: animating break
  
  // New States for Features
  const [isWindowOpen, setIsWindowOpen] = useState<boolean>(false);
  const isWindowOpenRef = useRef<boolean>(false); // Ref for loop access
  const windowOpenSequenceRef = useRef<number>(0); // Animation timer for cat flying out
  const pettingModeRef = useRef<boolean>(false); // Intermediate mode before calling onWin
  const pettingTimerRef = useRef<number>(0);
  
  // Game Timer state
  const startTimeRef = useRef<number>(Date.now());
  const finalTimeRef = useRef<number>(0);

  // Bath Exit (Rolling Out) State
  const bathExitSequenceRef = useRef<number>(0);
  const bathExitStartRef = useRef<Point>({x: 0, y: 0});

  // Game Dimensions based on Mobile state
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 720, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1280 
  });
  
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const GAME_WIDTH = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
  const GAME_HEIGHT = isMobile 
    ? Math.max(MOBILE_CANVAS_HEIGHT, Math.floor(MOBILE_CANVAS_WIDTH * (windowSize.height / windowSize.width))) 
    : CANVAS_HEIGHT;
    
  const CURRENT_BATHTUB = isMobile ? {
      ...MOBILE_BATHTUB,
      y: GAME_HEIGHT - (MOBILE_CANVAS_HEIGHT - MOBILE_BATHTUB.y)
  } : BATHTUB;
  
  const CURRENT_LITTER_BOX = isMobile ? {
      ...MOBILE_LITTER_BOX,
      y: GAME_HEIGHT - (MOBILE_CANVAS_HEIGHT - MOBILE_LITTER_BOX.y)
  } : LITTER_BOX;
  
  const CURRENT_FOOD_BOWL = isMobile ? MOBILE_FOOD_BOWL : FOOD_BOWL;
  
  // Game State
  const catRef = useRef<CatEntity>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: 0,
    vy: 0,
    mode: 'idle',
    angle: 0,
    scale: isMobile ? 1.5 : 1, // Start bigger on mobile
    state: levelData.stateSequence[0] || 'normal',
    hunger: 0, // Deprecated but kept for type compatibility
    dirtiness: 0, // Deprecated
    grumpiness: 0 // Deprecated
  });

  const taskQueueRef = useRef<CatState[]>([...levelData.stateSequence]);
  const angryTimerRef = useRef<number>(0);
  const ANGRY_LIMIT = 600 + (levelData.difficulty * 60); // Frames before getting angry (approx 10s + level*1s)

  const itemsRef = useRef<GameItem[]>([]);
  const dragTargetRef = useRef<{ type: 'cat' | 'item', id?: number, offsetX: number, offsetY: number } | null>(null);
  
  const handRef = useRef<Point & { vx: number, vy: number, isGrabbing: boolean }>({ x: 100, y: 100, vx: 0, vy: 0, isGrabbing: false });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Touch State
  const touchRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    startX: number;
    startY: number;
    startTime: number;
    isPinching: boolean;
    tapDetected: boolean;
  }>({
    active: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    startTime: 0,
    isPinching: false,
    tapDetected: false
  });
  
  const particlesRef = useRef<Particle[]>([]);
  const bubblesRef = useRef<Particle[]>([]); // Specific for bath
  const heartsRef = useRef<Particle[]>([]); // Specific for petting
  const pawPrintsRef = useRef<PawPrint[]>([]);
  const plantTrimmedRef = useRef<boolean>(false);

  const cloudXRef = useRef<number>(0); // Cloud position for window
  const lastThoughtTime = useRef<number>(0);
  const lastDamageTime = useRef<number>(0); // Cooldown for taking damage
  const lastEatTime = useRef<number>(0);
  const manicTimer = useRef<number>(0);
  const frameCount = useRef<number>(0);
  
  // Rolling ending state
  const isRollingAwayRef = useRef<boolean>(false);

  const scrubProgressRef = useRef<number>(0);

  // Initialize Items
  useEffect(() => {
    const newItems: GameItem[] = [];
    levelData.availableItems.forEach((type, index) => {
        // Scatter items randomly but away from the tub and cat start
        for(let i=0; i<2; i++) { // Give 2 of each item to start
            newItems.push({
                id: Date.now() + index * 100 + i,
                type,
                category: ITEMS_DATA[type].category,
                x: 100 + Math.random() * (GAME_WIDTH - 200),
                y: (isMobile ? 200 : 100) + Math.random() * (GAME_HEIGHT - (isMobile ? 400 : 300)),
                isDragging: false,
                width: 60,
                height: 60
            });
        }
    });
    itemsRef.current = newItems;
    
    // Reset Cat State
    taskQueueRef.current = [...levelData.stateSequence];
    catRef.current.state = taskQueueRef.current[0] || 'normal';
    angryTimerRef.current = 0;
    scrubProgressRef.current = 0;
    
  }, [levelData, GAME_WIDTH, GAME_HEIGHT]);

  // Clear cat thought when language changes to avoid stale text
  useEffect(() => {
    setCatThought("");
  }, [language]);

  // Sync isWindowOpenRef
  useEffect(() => {
      isWindowOpenRef.current = isWindowOpen;
  }, [isWindowOpen]);

  // --- Crayon Drawing Helpers ---
  const drawCrayonLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number = 3) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = width * 2;
    const jitter1 = () => (Math.random() - 0.5) * 1.0; 
    ctx.moveTo(x1 + jitter1(), y1 + jitter1());
    ctx.lineTo(x2 + jitter1(), y2 + jitter1());
    ctx.stroke();
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 1;
    const jitter2 = () => (Math.random() - 0.5) * 0.8; 
    ctx.moveTo(x1 + jitter2(), y1 + jitter2());
    ctx.lineTo(x2 + jitter2(), y2 + jitter2());
    ctx.stroke();
  };

  const drawScribbleFill = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, clean: boolean = false) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (!clean) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<6; i++) {
            const angle = i * (Math.PI * 2 / 6);
            const dist = r * 0.7; 
            const ax = x + Math.cos(angle) * dist + (i%2===0 ? 2 : -2);
            const ay = y + Math.sin(angle) * dist;
            const bx = x + Math.cos(angle + 2) * (dist * 0.5);
            const by = y + Math.sin(angle + 2) * (dist * 0.5);
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
        }
        ctx.stroke();
    }
    ctx.restore();
  };

  // --- Scene Drawing ---
  const drawItems = (ctx: CanvasRenderingContext2D) => {
    itemsRef.current.forEach(item => {
      const { x, y, width, height, type, isDragging } = item;
      const data = ITEMS_DATA[type];
      
      ctx.save();
      ctx.translate(x, y);
      if (isDragging) {
        ctx.scale(1.2, 1.2);
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 10;
      }

      // Draw Item Base
      ctx.fillStyle = data.color;
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 2;
      
      if (type === 'fish') {
         // Detailed Fish
         ctx.fillStyle = '#3498db';
         ctx.beginPath();
         ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
         ctx.fill(); ctx.stroke();
         // Tail
         ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(35, -10); ctx.lineTo(35, 10); ctx.closePath();
         ctx.fill(); ctx.stroke();
         // Fins
         ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, -22); ctx.lineTo(10, -15); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(5, 22); ctx.lineTo(10, 15); ctx.stroke();
         // Eye & Mouth
         ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-15, -5, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-15, -5, 1, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.moveTo(-25, 5); ctx.lineTo(-15, 5); ctx.stroke();
      } else if (type === 'bun') {
         // Steamed Bun
         ctx.fillStyle = '#fff';
         ctx.beginPath();
         ctx.arc(0, 5, 20, Math.PI, 0); // Top half
         ctx.bezierCurveTo(20, 15, -20, 15, -20, 5); // Bottom curve
         ctx.fill(); ctx.stroke();
         // Fold lines
         ctx.strokeStyle = '#ddd';
         ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(5, -5, 0, 5); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-5, 0, -10, 5); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(5, 0, 10, 5); ctx.stroke();
      } else if (type === 'pizza') {
         // Pizza Slice
         ctx.fillStyle = '#f1c40f'; // Cheese
         ctx.beginPath();
         ctx.moveTo(0, 25); ctx.lineTo(20, -20); ctx.quadraticCurveTo(0, -25, -20, -20); ctx.closePath();
         ctx.fill(); ctx.stroke();
         // Crust
         ctx.fillStyle = '#e67e22';
         ctx.beginPath();
         ctx.moveTo(20, -20); ctx.quadraticCurveTo(0, -25, -20, -20); ctx.quadraticCurveTo(0, -35, 20, -20);
         ctx.fill(); ctx.stroke();
         // Pepperoni
         ctx.fillStyle = '#c0392b';
         ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(-5, 10, 3, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(8, -10, 3, 0, Math.PI*2); ctx.fill();
      } else if (type === 'brush') {
         // Oval Scrub Brush
         ctx.rotate(0.2);
         
         // Helper for rounded rect
         const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
             ctx.beginPath();
             ctx.moveTo(x + r, y);
             ctx.lineTo(x + w - r, y);
             ctx.quadraticCurveTo(x + w, y, x + w, y + r);
             ctx.lineTo(x + w, y + h - r);
             ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
             ctx.lineTo(x + r, y + h);
             ctx.quadraticCurveTo(x, y + h, x, y + h - r);
             ctx.lineTo(x, y + r);
             ctx.quadraticCurveTo(x, y, x + r, y);
             ctx.closePath();
         };

         // Bristles (Bottom)
         ctx.fillStyle = '#fdf5e6'; // Off-white
         roundRect(-25, 5, 50, 15, 2);
         ctx.fill(); ctx.stroke();
         
         // Wood Base (Top)
         ctx.fillStyle = '#d7ccc8'; // Light wood
         roundRect(-28, -10, 56, 20, 8);
         ctx.fill(); ctx.stroke();
         
         // Strap
         ctx.fillStyle = '#8d6e63'; // Darker strap
         ctx.beginPath();
         ctx.moveTo(-20, -5); 
         ctx.quadraticCurveTo(0, -25, 20, -5);
         ctx.lineTo(20, 5);
         ctx.quadraticCurveTo(0, -15, -20, 5);
         ctx.fill(); ctx.stroke();
      } else if (type === 'scissors') {
         // Scissors
         ctx.rotate(0.5);
         ctx.strokeStyle = '#95a5a6';
         ctx.lineWidth = 4;
         // Blades
         ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, -25); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -25); ctx.stroke();
         // Handles
         ctx.strokeStyle = '#e74c3c';
         ctx.beginPath(); ctx.arc(-10, 10, 8, 0, Math.PI*2); ctx.stroke();
         ctx.beginPath(); ctx.arc(10, 10, 8, 0, Math.PI*2); ctx.stroke();
         // Pivot
         ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
      } else if (type === 'toy') {
         // Mouse Toy
         ctx.fillStyle = '#89CFF0'; // Baby Blue
         ctx.strokeStyle = '#5DADE2'; // Darker Blue
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI*2);
         ctx.fill(); ctx.stroke();
         // Ears
         ctx.beginPath(); ctx.arc(-10, -15, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         ctx.beginPath(); ctx.arc(10, -15, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
         // Tail
         ctx.strokeStyle = '#5DADE2';
         ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(10, 30, 5, 40); ctx.stroke();
      } else if (type === 'catnip') {
         // Catnip Bag
         ctx.fillStyle = '#27ae60';
         ctx.beginPath();
         ctx.rect(-15, -20, 30, 35);
         ctx.fill(); ctx.stroke();
         // Label
         ctx.fillStyle = '#fff';
         ctx.fillRect(-10, -10, 20, 15);
         ctx.fillStyle = '#27ae60';
         ctx.font = '10px Arial';
         ctx.fillText('🌿', -6, 2);
         // Tie
         ctx.strokeStyle = '#f1c40f';
         ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, -15); ctx.stroke();
      } else if (type === 'yarn') {
         // Yarn Ball
         ctx.fillStyle = '#e91e63'; // Pinkish red
         ctx.strokeStyle = '#c2185b';
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(0, 0, 20, 0, Math.PI * 2);
         ctx.fill(); ctx.stroke();
         // Yarn threads
         ctx.beginPath();
         ctx.moveTo(-15, -10); ctx.quadraticCurveTo(0, -20, 15, -10);
         ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, -10, 18, 0);
         ctx.moveTo(-15, 10); ctx.quadraticCurveTo(0, 0, 15, 10);
         ctx.moveTo(-5, -18); ctx.quadraticCurveTo(-15, 0, -5, 18);
         ctx.moveTo(5, -18); ctx.quadraticCurveTo(15, 0, 5, 18);
         ctx.stroke();
         // Loose thread
         ctx.beginPath();
         ctx.moveTo(15, 10); ctx.quadraticCurveTo(30, 20, 25, 35);
         ctx.stroke();
      }
      
      // Label removed as requested
      // ctx.fillStyle = '#2d2d2d';
      // ctx.font = '12px "Chewy"';
      // ctx.textAlign = 'center';
      // ctx.fillText(data.label, 0, height/2 + 15);

      ctx.restore();
    });
  };

  const drawRoom = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.beginPath();
    ctx.strokeStyle = '#f0e6d2';
    ctx.lineWidth = 2;
    for(let i = 0; i < GAME_HEIGHT; i+= 60) {
        ctx.moveTo(0, i + (Math.random()*0.5));
        ctx.lineTo(GAME_WIDTH, i + (Math.random()*0.5));
    }
    ctx.stroke();
    const rugX = GAME_WIDTH / 2;
    const rugY = isMobile ? GAME_HEIGHT / 2 : GAME_HEIGHT / 2 + 100;
    ctx.save();
    ctx.translate(rugX, rugY);
    ctx.rotate(isMobile ? Math.PI / 2 : 0.1); 
    ctx.beginPath();
    ctx.ellipse(0, 0, 300, 150, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffec99';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = CRAYON.orange;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 250, 120, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffc078';
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    pawPrintsRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.life * 0.6;
        ctx.fillStyle = '#d4a373'; 
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath(); ctx.arc(-6, -6, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -9, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -6, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    });
    ctx.restore();

    ctx.save();
    const winX = isMobile ? 50 : 100;
    const winY = isMobile ? 350 : 180;
    ctx.translate(winX, winY);
    
    // Window drawing
    ctx.fillStyle = isWindowOpen ? '#87CEEB' : '#dbe4ff';
    ctx.fillRect(0, 0, 200, 200);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 200, 200);
    ctx.clip(); 
    cloudXRef.current += 0.5;
    if (cloudXRef.current > 280) cloudXRef.current = -120;
    const cx = cloudXRef.current;
    const cy = 80 + Math.sin(frameCount.current * 0.02) * 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40, 30, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 30, cy - 10, 25, 25, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - 45, cy - 25); ctx.lineTo(cx - 50, cy - 45); ctx.lineTo(cx - 30, cy - 30);
    ctx.moveTo(cx - 20, cy - 30); ctx.lineTo(cx - 10, cy - 45); ctx.lineTo(cx - 5, cy - 25);
    ctx.ellipse(cx + 40, cy, 15, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = CRAYON.wood;
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, 200, 200);
    if (isWindowOpen) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeStyle = CRAYON.wood;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-40, 10); ctx.lineTo(-40, 190); ctx.lineTo(0, 200);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(200, 0); ctx.lineTo(240, 10); ctx.lineTo(240, 190); ctx.lineTo(200, 200);
        ctx.fill(); ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(100, 0); ctx.lineTo(100, 200);
        ctx.moveTo(0, 100); ctx.lineTo(200, 100);
        ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const plantX = isMobile ? 300 : GAME_WIDTH - 100;
    const plantY = isMobile ? 450 : 180;
    ctx.translate(plantX, plantY);
    
    if (plantTrimmedRef.current) {
        ctx.fillStyle = CRAYON.green;
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(20, 60); ctx.lineTo(-20, 60);
        ctx.beginPath();
        ctx.arc(0, -30, 35, 0, Math.PI*2); 
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(-30, -50); ctx.lineTo(-40, -80); ctx.lineTo(-10, -60); ctx.fill();
        ctx.beginPath(); ctx.moveTo(30, -50); ctx.lineTo(40, -80); ctx.lineTo(10, -60); ctx.fill();
        ctx.fillStyle = '#f1c40f'; 
        ctx.strokeStyle = '#e67e22'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -60); 
        ctx.lineTo(-25, -85); ctx.lineTo(-8, -70);
        ctx.lineTo(0, -90); 
        ctx.lineTo(8, -70); ctx.lineTo(25, -85); 
        ctx.lineTo(15, -60);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillStyle = CRAYON.green;
        ctx.beginPath();
        ctx.ellipse(0, -40, 30, 60, 0.5, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, -30, 30, 60, -0.5, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-20, -20, 30, 60, 0.2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.fillStyle = CRAYON.red;
    ctx.beginPath();
    ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(20, 60); ctx.lineTo(-20, 60);
    ctx.fill();
    ctx.strokeStyle = CRAYON.black;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  const drawFoodBowl = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(CURRENT_FOOD_BOWL.x, CURRENT_FOOD_BOWL.y);
    if (isMobile) ctx.scale(1.4, 1.4); 
    ctx.fillStyle = '#FFB7B2'; 
    ctx.beginPath();
    ctx.ellipse(0, 10, 35, 15, 0, 0, Math.PI * 2); 
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 15, 0, 0, Math.PI * 2); 
    ctx.fillStyle = '#FFDAC1'; 
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8d6e63'; 
    ctx.beginPath();
    ctx.ellipse(0, 2, 25, 10, 0, 0, Math.PI * 2); 
    ctx.fill();
    ctx.fillStyle = '#5d4037';
    const pebbleOffsets = [
        {x: -10, y: -2}, {x: 10, y: -2}, {x: 0, y: 0}, {x: -5, y: 5}, {x: 5, y: 5},
        {x: -15, y: 2}, {x: 15, y: 2}
    ];
    pebbleOffsets.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Chewy"';
    ctx.fillText("YUM", -12, 15);
    ctx.restore();
  };

  const drawLitterBox = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const { x, y, width, height } = CURRENT_LITTER_BOX;
    
    // Toilet Shape Base (White Ceramic)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#bdc3c7'; // Light grey outline
    ctx.lineWidth = 2;
    
    // Draw base
    ctx.beginPath();
    ctx.roundRect(x, y + 20, width, height - 20, 20);
    ctx.fill();
    ctx.stroke();

    // Draw Rim
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.roundRect(x - 5, y + 15, width + 10, 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw "Litter" (Sand) inside
    ctx.fillStyle = '#d7ccc8'; // Sand color
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height/2 + 10, width/2 - 15, height/3, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Grains
    ctx.fillStyle = '#a1887f';
    for(let i=0; i<10; i++) {
        const rx = (Math.random() - 0.5) * (width - 40);
        const ry = (Math.random() - 0.5) * (height - 60);
        ctx.beginPath(); ctx.arc(x + width/2 + rx, y + height/2 + 10 + ry, 2, 0, Math.PI*2); ctx.fill();
    }

    // Tank (Back part)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(x + width/2 - 40, y - 40, 80, 60, 10);
    ctx.fill();
    ctx.stroke();
    
    // Flush Handle
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.arc(x + width/2 + 30, y - 30, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width/2 + 30, y - 30);
    ctx.lineTo(x + width/2 + 45, y - 30);
    ctx.stroke();

    ctx.restore();
  };

  const drawBathtub = (ctx: CanvasRenderingContext2D, isBroken: boolean = false) => {
    ctx.save();
    const { x, y, width, height } = CURRENT_BATHTUB;
    const pipeX = x + width - 40;
    const pipeTop = y - 120;
    ctx.beginPath();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.moveTo(pipeX + 20, y + height); 
    ctx.lineTo(pipeX + 20, pipeTop);
    ctx.quadraticCurveTo(pipeX + 20, pipeTop - 30, pipeX - 20, pipeTop - 30);
    ctx.stroke();
    ctx.save();
    ctx.translate(pipeX - 30, pipeTop - 30);
    ctx.rotate(0.4);
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(30, 10); ctx.lineTo(25, 20); ctx.lineTo(-5, 0);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d'; 
    ctx.beginPath();
    ctx.ellipse(28, 15, 5, 12, 0.5, 0, Math.PI*2);
    ctx.fill();
    if (winSequenceRef.current > 0 && !isBroken) {
        const showerX = 28;
        const showerY = 15;
        ctx.strokeStyle = '#a5d8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<5; i++) {
             ctx.moveTo(showerX + (i*4-8), showerY);
             ctx.lineTo(showerX + (i*6-12) - 20, showerY + 200);
        }
        ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = CRAYON.black;
    ctx.lineWidth = 4;
    drawCrayonLine(ctx, x + 20, y + height, x + 20, y + height + 20, CRAYON.black);
    drawCrayonLine(ctx, x + width - 20, y + height, x + width - 20, y + height + 20, CRAYON.black);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 20);
    ctx.fill();
    ctx.strokeStyle = CRAYON.blue;
    ctx.lineWidth = 4;
    ctx.stroke();
    if (isBroken) {
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 40, y + 10);
        ctx.lineTo(x + 70, y + 80);
        ctx.lineTo(x + 50, y + 140);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width - 40, y + 10);
        ctx.lineTo(x + width - 70, y + 80);
        ctx.lineTo(x + width - 50, y + 140);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width/2, y + height/2);
        ctx.lineTo(x + width/2 - 20, y + height/2 - 20);
        ctx.moveTo(x + width/2, y + height/2);
        ctx.lineTo(x + width/2 + 20, y + height/2 - 20);
        ctx.moveTo(x + width/2, y + height/2);
        ctx.lineTo(x + width/2 + 20, y + height/2 + 30);
        ctx.stroke();
    } else {
        ctx.save();
        ctx.clip();
        const waterLevel = y + 40 + Math.sin(frameCount.current * 0.05) * 5;
        ctx.fillStyle = '#a5d8ff';
        ctx.fillRect(x, waterLevel, width, height);
        ctx.strokeStyle = '#74c0fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = x + 10; i < x + width - 10; i += 20) {
            const waveY = waterLevel + 15 + Math.sin(i * 0.15 + frameCount.current * 0.1) * 6;
            ctx.moveTo(i, waveY);
            ctx.lineTo(i + 12, waveY);
        }
        ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle = CRAYON.blue;
    ctx.font = '30px "Chewy"';
    ctx.fillText("BATH", x + 75, y + height - 20);
    ctx.restore();
  };

  const drawHand = (ctx: CanvasRenderingContext2D, x: number, y: number, isGrabbing: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    if (isMobile) ctx.scale(1.5, 1.5); 
    ctx.fillStyle = CRAYON.skin;
    ctx.strokeStyle = CRAYON.black;
    ctx.lineWidth = 3;
    
    if (isGrabbing) {
        // Closed Fist Animation
        ctx.beginPath();
        ctx.roundRect(-20, -15, 40, 35, 10);
        ctx.fill();
        ctx.stroke();
        
        // Knuckles
        ctx.beginPath();
        ctx.moveTo(-10, -15); ctx.lineTo(-10, 20);
        ctx.moveTo(0, -15); ctx.lineTo(0, 20);
        ctx.moveTo(10, -15); ctx.lineTo(10, 20);
        ctx.stroke();

        // Thumb tucked in
        ctx.beginPath();
        ctx.moveTo(-20, 5); ctx.quadraticCurveTo(0, 15, 20, 5);
        ctx.stroke();
    } else {
        // Open Hand
        ctx.rotate(-0.2);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const fingerOffsets = [-18, -6, 6, 18];
        fingerOffsets.forEach(off => {
            ctx.beginPath();
            ctx.ellipse(off, -25, 8, 18, 0, 0, Math.PI * 2);
            ctx.fillStyle = CRAYON.skin;
            ctx.fill();
            ctx.stroke();
        });
        ctx.beginPath();
        ctx.ellipse(-30, 10, 10, 18, -0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
  };

  const drawCat = (ctx: CanvasRenderingContext2D, cat: CatEntity) => {
    ctx.save();
    ctx.translate(cat.x, cat.y);
    if (winSequenceRef.current > 0) {
        ctx.rotate(Math.sin(frameCount.current * 0.5) * 0.2);
    } else if (isRollingAwayRef.current || windowOpenSequenceRef.current > 0 || bathExitSequenceRef.current > 0) {
        ctx.rotate(frameCount.current * 0.2); 
    } else if (cat.mode === 'caught') {
        const swing = Math.sin(frameCount.current * 0.2) * 0.1;
        ctx.rotate(swing);
    } else if (cat.mode === 'run') {
        const lean = Math.atan2(cat.vy, cat.vx);
        ctx.rotate(lean * 0.2);
    } else if (pettingModeRef.current) {
        ctx.rotate(Math.PI / 2);
    } else {
        ctx.scale(1, 1 + Math.sin(frameCount.current * 0.1) * 0.02);
    }

    const isManic = cat.mode === 'manic';
    let bodyColor: string | CanvasGradient = '#fff';
    let strokeColor = CRAYON.black;
    let eyeColor = CRAYON.black;
    
    if (!isManic) {
        switch(catType) {
            case 'white': bodyColor = '#fff'; break;
            case 'black': bodyColor = '#2d2d2d'; strokeColor = '#1a1a1a'; eyeColor = '#fff'; break;
            case 'tuxedo': bodyColor = '#2d2d2d'; strokeColor = '#1a1a1a'; eyeColor = '#fff'; break;
            case 'calico': bodyColor = '#fff'; break;
            case 'siamese': bodyColor = '#fdf5e6'; break;
            case 'devon': bodyColor = '#a0a0a0'; break;
            case 'orange': bodyColor = '#ffb74d'; strokeColor = '#d35400'; break;
            case 'sphynx': bodyColor = '#f5cba7'; strokeColor = '#d35400'; break;
            case 'tabby': bodyColor = '#bdc3c7'; strokeColor = '#2c3e50'; break;
            case 'maine_coon': 
                const grad = ctx.createLinearGradient(-30, -30, 30, 30);
                grad.addColorStop(0, '#3e2723');
                grad.addColorStop(0.5, '#795548');
                grad.addColorStop(1, '#d7ccc8');
                bodyColor = grad;
                strokeColor = '#3e2723';
                break;
        }
    } else {
        bodyColor = '#ffcccc'; strokeColor = CRAYON.red; eyeColor = '#ffff00';
    }
    
    ctx.save();
    ctx.scale(cat.scale, cat.scale);
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    if (catType === 'siamese' && !isManic) ctx.strokeStyle = '#4b3621'; 
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    if (cat.mode === 'caught') {
        ctx.moveTo(30, 20); ctx.quadraticCurveTo(40, 60, 30, 80);
    } else if (isManic) {
        ctx.moveTo(35, 10); ctx.lineTo(55, -20); ctx.lineTo(75, 10); 
    } else if (cat.mode === 'idle' || winSequenceRef.current > 0 || pettingModeRef.current) {
        const wag = Math.sin(frameCount.current * 0.15) * 20;
        ctx.moveTo(35, 10); ctx.bezierCurveTo(60, 10, 60 + wag, -40, 35, -30);
    } else {
        ctx.moveTo(35, 10); ctx.lineTo(70, 0);
    }
    ctx.stroke();

    ctx.lineWidth = 4;
    let legColor = strokeColor;
    if (catType === 'siamese' && !isManic) legColor = '#4b3621'; 
    const drawLeg = (x1: number, y1: number, x2: number, y2: number) => {
        drawCrayonLine(ctx, x1, y1, x2, y2, legColor, 4);
    };

    if (winSequenceRef.current > 0) {
        const splash = Math.sin(frameCount.current * 0.8) * 5;
        drawLeg(-20, 20, -30, 30 + splash);
        drawLeg(20, 20, 30, 30 - splash);
    } else if (cat.mode === 'run' || cat.mode === 'manic' || windowOpenSequenceRef.current > 0 || bathExitSequenceRef.current > 0) {
        const legOffset = Math.sin(frameCount.current * 0.8) * 12;
        drawLeg(-20, 20, -25 + legOffset, 45);
        drawLeg(20, 20, 25 - legOffset, 45);
    } else if (cat.mode === 'caught') {
        drawLeg(-15, 25, -20, 55); drawLeg(15, 25, 20, 55); 
    } else if (pettingModeRef.current) {
        drawLeg(-15, 25, -20, 35); drawLeg(15, 25, 20, 35);
    } else {
        drawLeg(-15, 25, -15, 45); drawLeg(15, 25, 15, 45);
    }

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (isManic) {
        for (let i = 0; i < Math.PI * 2; i += 0.4) {
            const r = CAT_RADIUS + (Math.random() * 4);
            const bx = Math.cos(i) * r;
            const by = Math.sin(i) * r * 0.8;
            ctx.lineTo(bx, by);
        }
    } else {
        if (catType === 'devon' || catType === 'sphynx') {
            ctx.ellipse(0, 0, CAT_RADIUS * 0.9, CAT_RADIUS * 0.8, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(0, 0, CAT_RADIUS, CAT_RADIUS * 0.85, 0, 0, Math.PI * 2);
        }
    }
    ctx.closePath();
    ctx.fill();

    if (!isManic) {
        if (catType === 'tuxedo') {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, 12, 22, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (catType === 'calico') {
            drawScribbleFill(ctx, -15, -12, 12, CRAYON.orange, true); 
            drawScribbleFill(ctx, 18, 10, 10, '#2d2d2d');
            drawScribbleFill(ctx, 10, -15, 8, CRAYON.orange);
        } else if (catType === 'orange' || catType === 'tabby') {
             const stripeColor = catType === 'orange' ? '#d35400' : '#2c3e50';
             ctx.strokeStyle = stripeColor;
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.moveTo(-10, -25); ctx.lineTo(-10, -15);
             ctx.moveTo(0, -28); ctx.lineTo(0, -18);
             ctx.moveTo(10, -25); ctx.lineTo(10, -15);
             ctx.stroke();
             ctx.beginPath();
             ctx.moveTo(-25, -5); ctx.lineTo(-15, -5);
             ctx.moveTo(-28, 5); ctx.lineTo(-18, 5);
             ctx.moveTo(25, -5); ctx.lineTo(15, -5);
             ctx.moveTo(28, 5); ctx.lineTo(18, 5);
             ctx.stroke();
        } else if (catType === 'sphynx') {
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(-10, -25); ctx.quadraticCurveTo(0, -20, 10, -25);
            ctx.moveTo(-12, -20); ctx.quadraticCurveTo(0, -15, 12, -20);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    let earColor = bodyColor;
    if (!isManic) {
        if (catType === 'siamese') earColor = '#4b3621';
        if (catType === 'black' || catType === 'tuxedo') earColor = '#2d2d2d';
        if (catType === 'maine_coon') earColor = '#3e2723'; // Dark ears for Maine Coon
    }
    ctx.fillStyle = earColor;
    ctx.beginPath();
    if ((catType === 'devon' || catType === 'sphynx' || catType === 'maine_coon') && !isManic) {
        // Maine Coon has large ears with tufts
        ctx.moveTo(-25, -20); ctx.lineTo(-45, -75); ctx.lineTo(-5, -30); // Left Ear (Taller)
        ctx.moveTo(25, -20); ctx.lineTo(45, -75); ctx.lineTo(5, -30);   // Right Ear (Taller)
    } else {
        ctx.moveTo(-20, -25); ctx.lineTo(-35, -55); ctx.lineTo(-5, -35);
        ctx.moveTo(20, -25); ctx.lineTo(35, -55); ctx.lineTo(5, -35);
    }
    ctx.fill();
    
    // Maine Coon Ear Tufts
    if (catType === 'maine_coon' && !isManic) {
        ctx.strokeStyle = '#d7ccc8'; // Light tufts
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Left Tuft
        ctx.moveTo(-45, -75); ctx.lineTo(-50, -85);
        ctx.moveTo(-45, -75); ctx.lineTo(-40, -85);
        // Right Tuft
        ctx.moveTo(45, -75); ctx.lineTo(50, -85);
        ctx.moveTo(45, -75); ctx.lineTo(40, -85);
        ctx.stroke();
        ctx.strokeStyle = strokeColor; // Reset stroke
        ctx.lineWidth = 4;
    }

    ctx.stroke();
    ctx.restore();

    if (isManic) {
        ctx.strokeStyle = CRAYON.red;
        drawCrayonLine(ctx, -25, -15, -10, -5, CRAYON.red, 3);
        drawCrayonLine(ctx, 25, -15, 10, -5, CRAYON.red, 3);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath(); ctx.arc(-15, -5, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -5, 5, 0, Math.PI*2); ctx.fill();
    } else if (cat.mode === 'caught') {
        ctx.fillStyle = eyeColor;
        ctx.font = '24px Arial';
        ctx.fillText('><', -12, 5);
    } else {
        if (!isManic && catType === 'siamese') {
             ctx.fillStyle = '#4b3621'; 
             ctx.beginPath();
             ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI*2);
             ctx.fill();
             eyeColor = '#a5d8ff'; 
        }
        if (winSequenceRef.current > 0 || pettingModeRef.current || bathExitSequenceRef.current > 0) {
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-20, -5); ctx.lineTo(-10, -15); ctx.lineTo(0, -5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(10, -15); ctx.lineTo(20, -5); ctx.stroke();
        } else {
            ctx.fillStyle = eyeColor;
            ctx.beginPath(); ctx.arc(-12, -10, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(12, -10, 4, 0, Math.PI*2); ctx.fill();
        }
    }

    if (!isManic) {
        ctx.strokeStyle = strokeColor;
        if (catType === 'black' || catType === 'tuxedo' || catType === 'siamese') ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -2); ctx.lineTo(-2, 2); ctx.lineTo(2, 2); ctx.lineTo(0, -2); ctx.stroke(); 
        ctx.beginPath();
        if (pettingModeRef.current) {
            ctx.arc(0, 5, 10, 0, Math.PI);
        } else {
            ctx.moveTo(0, 2); ctx.quadraticCurveTo(-5, 10, -10, 5);
            ctx.moveTo(0, 2); ctx.quadraticCurveTo(5, 8, 10, 5);
        }
        ctx.stroke();
    }

    if (catType !== 'sphynx') {
        ctx.lineWidth = 1;
        ctx.strokeStyle = strokeColor;
        if (!isManic && (catType === 'black' || catType === 'tuxedo' || catType === 'siamese')) ctx.strokeStyle = '#999';
        drawCrayonLine(ctx, -25, 2, -50, -2, ctx.strokeStyle as string, 1);
        drawCrayonLine(ctx, -25, 6, -50, 10, ctx.strokeStyle as string, 1);
        drawCrayonLine(ctx, 25, 2, 50, -2, ctx.strokeStyle as string, 1);
        drawCrayonLine(ctx, 25, 6, 50, 10, ctx.strokeStyle as string, 1);
    }

    // Draw State Icon
    if (cat.state !== 'normal' && cat.mode !== 'caught' && winSequenceRef.current === 0) {
        // Visuals for states
        if (cat.state === 'long_hair') {
            // Draw messy hair
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const lx = Math.cos(angle) * (CAT_RADIUS + 10);
                const ly = Math.sin(angle) * (CAT_RADIUS + 10);
                drawCrayonLine(ctx, Math.cos(angle)*CAT_RADIUS, Math.sin(angle)*CAT_RADIUS, lx, ly, strokeColor, 2);
            }
        } else if (cat.state === 'tangled') {
            // Draw knots
            ctx.fillStyle = '#8e44ad';
            for(let i=0; i<3; i++) {
                const kx = (Math.random()-0.5) * 40;
                const ky = (Math.random()-0.5) * 30;
                ctx.beginPath(); ctx.arc(kx, ky, 5, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth=1; ctx.stroke();
            }
        } else if (cat.state === 'dirty') {
            // Mud Splotches
            // Opacity based on scrub progress (inverse)
            const opacity = 1 - (scrubProgressRef.current / 100);
            if (opacity > 0) {
                ctx.globalAlpha = opacity;
                ctx.fillStyle = '#5d4037'; // Mud brown
                
                // Draw random splotches
                const splotches = [
                    {x: -20, y: -10, r: 15},
                    {x: 15, y: 5, r: 12},
                    {x: 0, y: -25, r: 10},
                    {x: 10, y: 20, r: 8},
                    {x: -15, y: 25, r: 10}
                ];
                
                splotches.forEach(s => {
                    ctx.beginPath();
                    // Irregular shape
                    ctx.moveTo(s.x, s.y - s.r);
                    for(let i=0; i<7; i++) {
                        const angle = (Math.PI * 2 / 6) * i;
                        const r = s.r + (i%2===0 ? 3 : -2);
                        ctx.lineTo(s.x + Math.cos(angle)*r, s.y + Math.sin(angle)*r);
                    }
                    ctx.fill();
                });
                ctx.globalAlpha = 1.0;
            }
        } else if (cat.state === 'needs_poop') {
            // Stink lines
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 2;
            for(let i=0; i<3; i++) {
                const sx = (i-1) * 15;
                ctx.beginPath();
                ctx.moveTo(sx, -50);
                ctx.quadraticCurveTo(sx + 5, -60, sx, -70);
                ctx.stroke();
            }
        } else if (cat.state === 'bored') {
            // Zzz
            ctx.fillStyle = '#3498db';
            ctx.font = '20px Arial';
            ctx.fillText('Zzz...', 30, -40);
        }

        ctx.save();
        ctx.translate(0, -70);
        const iconScale = 1.0 + Math.sin(frameCount.current * 0.1) * 0.1;
        ctx.scale(iconScale, iconScale);
        
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '';
        if (cat.state === 'hungry') icon = '🍖';
        else if (cat.state === 'dirty') icon = '💩'; // Legacy
        else if (cat.state === 'grumpy') icon = '💢'; // Legacy
        else if (cat.state === 'long_hair') icon = '✂️';
        else if (cat.state === 'tangled') icon = '🧶';
        else if (cat.state === 'needs_poop') icon = '💩';
        else if (cat.state === 'bored') icon = '🐭';
        
        ctx.fillText(icon, 0, 2);
        ctx.restore();
    }

    ctx.restore();
  };

  // --- Game Logic ---
  const spawnParticles = (x: number, y: number, color: string, count: number, type: 'sparkle' | 'bubble' | 'heart' = 'sparkle') => {
    const arr = type === 'bubble' ? bubblesRef.current : (type === 'heart' ? heartsRef.current : particlesRef.current);
    for (let i = 0; i < count; i++) {
      arr.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'bubble' ? 4 : 12),
        vy: (Math.random() - 0.5) * (type === 'bubble' ? 4 : 12) - (type === 'bubble' || type === 'heart' ? 2 : 0),
        life: 1.0,
        color
      });
    }
  };

  const handlePointerDown = (x: number, y: number) => {
      // Check Items (Reverse order to pick top)
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
          const item = itemsRef.current[i];
          const dist = Math.hypot(x - item.x, y - item.y);
          if (dist < item.width) {
              dragTargetRef.current = { type: 'item', id: item.id, offsetX: x - item.x, offsetY: y - item.y };
              item.isDragging = true;
              audio.playPop();
              return;
          }
      }

      // Check Cat
      const cat = catRef.current;
      const distCat = Math.hypot(x - cat.x, y - cat.y);
      if (distCat < CAT_RADIUS * cat.scale + 20) {
          // Allow grabbing if normal OR needs_poop (to move to litter box)
          if (cat.state !== 'normal' && cat.state !== 'needs_poop') {
              audio.playHiss();
              cat.vx = (Math.random() - 0.5) * 20;
              cat.vy = (Math.random() - 0.5) * 20;
              cat.mode = 'run';
              generateCatThought('angry', hpRef.current, language).then(setCatThought);
              return;
          }
          dragTargetRef.current = { type: 'cat', offsetX: x - cat.x, offsetY: y - cat.y };
          cat.mode = 'caught';
          audio.playCaughtSound();
          return;
      }
      
      // Window Click Detection
      const winX = isMobile ? 50 : 100;
      const winY = isMobile ? 150 : 180;
      const winSize = 200;
      
      if (!isWindowOpenRef.current && !pettingModeRef.current && winSequenceRef.current === 0 && tubBrokenSequenceRef.current === 0 && bathExitSequenceRef.current === 0) {
          if (x > winX && x < winX + winSize && y > winY && y < winY + winSize) {
              setIsWindowOpen(true);
              windowOpenSequenceRef.current = 120; 
              audio.playFunnyEscape(); 
          }
      }
  };

  const handlePointerMove = (x: number, y: number) => {
      // Clamp hand position to screen bounds
      const clampedX = Math.max(0, Math.min(GAME_WIDTH, x));
      const clampedY = Math.max(0, Math.min(GAME_HEIGHT, y));
      
      handRef.current.x = clampedX;
      handRef.current.y = clampedY;

      if (dragTargetRef.current) {
          if (dragTargetRef.current.type === 'item') {
              const item = itemsRef.current.find(i => i.id === dragTargetRef.current?.id);
              if (item) {
                  item.x = clampedX - dragTargetRef.current.offsetX;
                  item.y = clampedY - dragTargetRef.current.offsetY;

                  // Scrubbing Logic
                  if (item.type === 'brush' && catRef.current.state === 'dirty') {
                      const cat = catRef.current;
                      const dist = Math.hypot(item.x - cat.x, item.y - cat.y);
                      if (dist < CAT_RADIUS * cat.scale + 40) {
                          // Scrubbing!
                          scrubProgressRef.current += 1.5; // Speed of cleaning
                          if (frameCount.current % 5 === 0) {
                              spawnParticles(item.x, item.y - 20, '#a5d8ff', 2, 'bubble'); // Bubbles from brush
                          }
                          
                          if (scrubProgressRef.current >= 100) {
                              scrubProgressRef.current = 0;
                              advanceTask();
                              spawnParticles(cat.x, cat.y, '#fff', 20, 'sparkle');
                              audio.playSplash(); // Clean sound
                          }
                      }
                  }
              }
          } else if (dragTargetRef.current.type === 'cat') {
              const cat = catRef.current;
              cat.x = clampedX - dragTargetRef.current.offsetX;
              cat.y = clampedY - dragTargetRef.current.offsetY;
              cat.vx = 0; cat.vy = 0;
          }
      }
  };

  const handlePointerUp = () => {
      if (dragTargetRef.current) {
          if (dragTargetRef.current.type === 'item') {
              const item = itemsRef.current.find(i => i.id === dragTargetRef.current?.id);
              if (item) {
                  item.isDragging = false;
                  // Check Drop on Cat
                  const cat = catRef.current;
                  const dist = Math.hypot(item.x - cat.x, item.y - cat.y);
                  if (dist < CAT_RADIUS * cat.scale + 40) {
                      handleItemDropOnCat(item, cat);
                  }
              }
          } else if (dragTargetRef.current.type === 'cat') {
              const cat = catRef.current;
              cat.mode = 'idle'; // Release
              
              // Check Drop in Litter Box
              if (
                  cat.x > CURRENT_LITTER_BOX.x && 
                  cat.x < CURRENT_LITTER_BOX.x + CURRENT_LITTER_BOX.width && 
                  cat.y > CURRENT_LITTER_BOX.y && 
                  cat.y < CURRENT_LITTER_BOX.y + CURRENT_LITTER_BOX.height
              ) {
                  if (cat.state === 'needs_poop') {
                      audio.playPop(); // Flush sound?
                      spawnParticles(cat.x, cat.y, '#8d6e63', 10, 'sparkle');
                      generateCatThought('happy', hpRef.current, language).then(setCatThought);
                      advanceTask();
                  } else {
                      audio.playHiss();
                      cat.vx = 10; cat.vy = -10; // Jump out
                  }
              }

              // Check Drop in Tub
              if (
                  cat.x > CURRENT_BATHTUB.x && 
                  cat.x < CURRENT_BATHTUB.x + CURRENT_BATHTUB.width && 
                  cat.y > CURRENT_BATHTUB.y && 
                  cat.y < CURRENT_BATHTUB.y + CURRENT_BATHTUB.height
              ) {
                  if (cat.state === 'needs_poop') {
                      // Cannot drop in tub if needs poop
                      audio.playHiss();
                      cat.vx = -15; cat.vy = -10; // Jump out aggressively
                      generateCatThought('angry', hpRef.current, language).then(setCatThought);
                  } else if (cat.state === 'normal') {
                      audio.playSplash();
                      audio.playWinAscending(); 
                      winSequenceRef.current = 180; 
                  } else {
                      audio.playHiss();
                  }
              }
          }
          dragTargetRef.current = null;
      }
  };

  const advanceTask = () => {
      // Remove current task
      taskQueueRef.current.shift();
      const nextTask = taskQueueRef.current[0];
      if (nextTask) {
          catRef.current.state = nextTask;
          angryTimerRef.current = 0; // Reset angry timer for new task
          audio.playTrill();
      } else {
          catRef.current.state = 'normal';
          audio.playTrill();
          generateCatThought('happy', hpRef.current, language).then(setCatThought);
      }
  };

  const handleItemDropOnCat = (item: GameItem, cat: CatEntity) => {
      let success = false;
      
      if (cat.state === 'long_hair' && item.type === 'scissors') {
          success = true;
          // Spawn hair particles
          spawnParticles(cat.x, cat.y, catType === 'white' ? '#eee' : '#333', 15);
      } else if (cat.state === 'tangled' && item.type === 'yarn') {
          success = true;
          audio.playMeow();
      } else if (cat.state === 'bored' && item.type === 'toy') {
          success = true;
          cat.vx = (Math.random()-0.5)*10; cat.vy = (Math.random()-0.5)*10; cat.mode = 'run';
      } else if (cat.state === 'hungry' && item.category === 'food') {
          // Legacy support or bonus
          cat.scale += 0.1;
          success = true;
      }
      // Dirty state is handled by scrubbing in handlePointerMove, not drop.

      if (success) {
          if (cat.state !== 'hungry') advanceTask(); // Don't advance task for food unless it was a task (it's not in new levels)
          
          audio.playEat(); // Or generic success sound
          spawnParticles(cat.x, cat.y, '#fff', 10, 'sparkle');
          // Don't remove tools, only food
          if (item.category === 'food') {
             itemsRef.current = itemsRef.current.filter(i => i.id !== item.id);
          } else {
             // Bounce tool away
             item.x += (Math.random()-0.5)*100;
             item.y += (Math.random()-0.5)*100;
          }
      } else {
          audio.playHiss();
          cat.vx = (Math.random() - 0.5) * 20;
          cat.vy = (Math.random() - 0.5) * 20;
          cat.mode = 'run';
      }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Unified Input Handlers
    const onMouseDown = (e: MouseEvent) => {
        const rect = canvas?.getBoundingClientRect();
        if(!rect) return;
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        handlePointerDown((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    };

    const onMouseMove = (e: MouseEvent) => {
        const rect = canvas?.getBoundingClientRect();
        if(!rect) return;
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        handlePointerMove((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    };

    const onMouseUp = () => {
        handlePointerUp();
    };

    const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.touches[0];
        const rect = canvas?.getBoundingClientRect();
        if(!rect || !t) return;
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        handlePointerDown((t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY);
    };

    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.touches[0];
        const rect = canvas?.getBoundingClientRect();
        if(!rect || !t) return;
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        handlePointerMove((t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY);
    };

    const onTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        handlePointerUp();
    };

    if (canvas) {
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
    }

    const resizeOverlay = () => {
        if (overlayCanvasRef.current) {
            overlayCanvasRef.current.width = window.innerWidth;
            overlayCanvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', resizeOverlay);
    resizeOverlay();

    audio.resume();
    audio.startBGM(catType);

    // Initialize Timer
    startTimeRef.current = Date.now();

    let animationFrameId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const oCtx = overlayCanvas?.getContext('2d');
      
      if (!canvas || !ctx || !overlayCanvas || !oCtx) return;

      frameCount.current++;
      const now = Date.now();

      oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      drawRoom(ctx);
      drawLitterBox(ctx); // Add Litter Box
      drawItems(ctx); 
      drawFoodBowl(ctx);
      
      // Angry Timer Logic
      if (catRef.current.state !== 'normal' && winSequenceRef.current === 0 && catRef.current.mode !== 'manic') {
          angryTimerRef.current++;
          if (angryTimerRef.current > ANGRY_LIMIT) {
              catRef.current.mode = 'manic';
              audio.playHiss();
              generateCatThought('angry', hpRef.current, language).then(setCatThought);
          }
      } else if (catRef.current.state === 'normal') {
          angryTimerRef.current = 0;
      }
      
      if (winSequenceRef.current > 0) {
        winSequenceRef.current--;
        setBathEmote("ε=( o｀ω′)ノ");
        if (winSequenceRef.current % 50 === 0) {
            const msgs = TRANSLATIONS[language].bath_messages;
            const idx = Math.floor(Math.random() * msgs.length);
            setOwnerMessages(prev => [
              ...prev, 
              {
                id: Date.now(),
                type: 'bath',
                index: idx,
                x: 20 + Math.random() * 50, 
                y: GAME_HEIGHT - 100 
              }
            ]);
        }
        const cat = catRef.current;
        cat.x = CURRENT_BATHTUB.x + CURRENT_BATHTUB.width / 2;
        cat.y = CURRENT_BATHTUB.y + CURRENT_BATHTUB.height / 2 + Math.sin(frameCount.current * 0.2) * 5;
        cat.vx = 0; cat.vy = 0;
        
        if (frameCount.current % 5 === 0) {
            spawnParticles(cat.x + (Math.random()-0.5)*50, cat.y, '#fff', 1, 'bubble');
        }
        drawBathtub(ctx);
        drawCat(ctx, cat);

        bubblesRef.current.forEach(p => {
            p.y -= 1; 
            p.x += Math.sin(p.y * 0.1) * 0.5;
            p.life -= 0.01;
            ctx.beginPath();
            ctx.strokeStyle = '#a5d8ff';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.arc(p.x, p.y, 5 + Math.random()*5, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
        });
        bubblesRef.current = bubblesRef.current.filter(p => p.life > 0);

        if (winSequenceRef.current === 1) {
            setBathEmote(null);
            setOwnerMessages([]); 
            bathExitSequenceRef.current = 60; 
            bathExitStartRef.current = { x: cat.x, y: cat.y };
        }
        animationFrameId = requestAnimationFrame(loop);
        return; 
      } else {
        setBathEmote(null);
      }

      if (bathExitSequenceRef.current > 0) {
          bathExitSequenceRef.current--;
          const maxFrames = 60;
          const progress = 1 - (bathExitSequenceRef.current / maxFrames);
          const ease = 1 - Math.pow(1 - progress, 4); 
          const rugX = GAME_WIDTH / 2;
          const rugY = isMobile ? GAME_HEIGHT / 2 : GAME_HEIGHT / 2 + 100;
          const start = bathExitStartRef.current;
          const cat = catRef.current;
          
          cat.x = start.x + (rugX - start.x) * ease;
          cat.y = start.y + (rugY - start.y) * ease;
          cat.angle += 0.2; 

          drawBathtub(ctx);
          drawCat(ctx, cat);

          if (bathExitSequenceRef.current === 0) {
              pettingModeRef.current = true;
              pettingTimerRef.current = 300; 
              cat.vx = 0; cat.vy = 0;
              cat.angle = Math.PI / 2; 
              audio.playTrill(); 
          }
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      if (pettingModeRef.current) {
          pettingTimerRef.current--;
          const cat = catRef.current;
          const hand = handRef.current;
          const distToHand = Math.hypot(cat.x - hand.x, cat.y - hand.y);
          // Allow petting if hand is close (visual feedback)
          const isInteracting = distToHand < CAT_RADIUS * 2;

          if (isInteracting) {
              if (frameCount.current % 10 === 0) { 
                  spawnParticles(cat.x, cat.y - 50 * cat.scale, '#ff6b6b', 1, 'heart');
                  audio.playLoveSound(); 
              }
          }

          drawBathtub(ctx);
          drawCat(ctx, cat);
          drawHand(ctx, handRef.current.x, handRef.current.y, false);

          heartsRef.current.forEach((p, i) => {
            p.y -= 2; 
            p.x += Math.sin(frameCount.current * 0.1 + i) * 0.5;
            p.life -= 0.02;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.font = '24px Arial';
            ctx.fillText('♥', p.x, p.y);
            ctx.globalAlpha = 1;
          });
          heartsRef.current = heartsRef.current.filter(p => p.life > 0);

          if (pettingTimerRef.current <= 0) {
              pettingModeRef.current = false;
              // Calculate Time Elapsed
              finalTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
              onWin(finalTimeRef.current);
          }
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      // Window Open / Freedom Sequence logic using Refs for up-to-date state
      if (!isWindowOpenRef.current && !pettingModeRef.current && winSequenceRef.current === 0 && tubBrokenSequenceRef.current === 0 && bathExitSequenceRef.current === 0 && windowOpenSequenceRef.current === 0) {
          // Window logic moved to pointer down handler
      }

      if (windowOpenSequenceRef.current > 0) {
          windowOpenSequenceRef.current--;
          const cat = catRef.current;
          const winX = isMobile ? 50 : 100;
          const winY = isMobile ? 150 : 180;
          const winCenterX = winX + 100;
          const winCenterY = winY + 100;

          cat.x += (winCenterX - cat.x) * 0.1;
          cat.y += (winCenterY - cat.y) * 0.1;
          cat.scale *= 0.95;
          cat.angle += 0.2;

          drawBathtub(ctx);
          drawCat(ctx, cat);

          if (windowOpenSequenceRef.current === 1) {
              onGameOver(TRANSLATIONS[language].free_msg, 'free');
              return;
          }
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      if (tubBrokenSequenceRef.current > 0) {
        tubBrokenSequenceRef.current--;
        const cat = catRef.current;
        cat.x = CURRENT_BATHTUB.x + CURRENT_BATHTUB.width / 2;
        cat.y = CURRENT_BATHTUB.y + CURRENT_BATHTUB.height / 2 - 20; 
        cat.vx = 0; cat.vy = 0;
        
        drawBathtub(ctx, true); 
        drawCat(ctx, cat);
        
        if (frameCount.current % 10 === 0) {
             spawnParticles(CURRENT_BATHTUB.x + CURRENT_BATHTUB.width/2, CURRENT_BATHTUB.y + CURRENT_BATHTUB.height/2, '#bdc3c7', 2);
        }
        particlesRef.current.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.04;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 5, p.y + 2); ctx.lineTo(p.x + 2, p.y + 5);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        if (tubBrokenSequenceRef.current === 1) {
             onGameOver(TRANSLATIONS[language].fat_tub_msg, 'tub');
             return;
        }
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      if (isRollingAwayRef.current) {
          const cat = catRef.current;
          cat.x += 8; 
          cat.angle += 0.1;
          
          drawBathtub(ctx); 

          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / GAME_WIDTH;
          const scaleY = rect.height / GAME_HEIGHT;
          
          oCtx.save();
          oCtx.translate(rect.left, rect.top);
          oCtx.scale(scaleX, scaleY);
          drawCat(oCtx, cat);
          oCtx.restore();

          const catScreenX = rect.left + cat.x * scaleX;
          const catRadiusScreen = (CAT_RADIUS * cat.scale) * scaleX;
          
          if (catScreenX - catRadiusScreen > window.innerWidth) {
               onGameOver(TRANSLATIONS[language].fat_roll_msg, 'roll');
               return; 
          }
          
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      const isGrabbing = !!dragTargetRef.current;
      const cat = catRef.current;
      
      const distToFood = Math.hypot(cat.x - CURRENT_FOOD_BOWL.x, cat.y - CURRENT_FOOD_BOWL.y);
      const eatingReach = (CAT_RADIUS * cat.scale) + 60; 
      
      if (distToFood < eatingReach && cat.mode !== 'caught' && now - lastEatTime.current > 1000) {
          lastEatTime.current = now;
          audio.playEat();
          cat.scale += 0.3; 
          spawnParticles(CURRENT_FOOD_BOWL.x, CURRENT_FOOD_BOWL.y, '#8d6e63', 8);
          if (distToFood > 10) {
             cat.vx = (cat.x - CURRENT_FOOD_BOWL.x) * 0.1; 
             cat.vy = (cat.y - CURRENT_FOOD_BOWL.y) * 0.1;
          }
      }
      
      if (cat.scale > 7.5 && !isRollingAwayRef.current) {
          isRollingAwayRef.current = true;
          cat.mode = 'idle'; 
          audio.playBouncingSequence(); 
      }

      if (winSequenceRef.current === 0 && tubBrokenSequenceRef.current === 0 && bathExitSequenceRef.current === 0) {
          const distToHand = Math.hypot(cat.x - handRef.current.x, cat.y - handRef.current.y);

          const rugX = GAME_WIDTH / 2;
          const rugY = isMobile ? GAME_HEIGHT / 2 : GAME_HEIGHT / 2 + 100;
          
          const dx = cat.x - rugX;
          const dy = cat.y - rugY;
          const angle = isMobile ? -Math.PI/2 : -0.1;
          const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
          const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
          
          const onRug = (rx * rx) / (280 * 280) + (ry * ry) / (130 * 130) <= 1;

          if (onRug && (Math.abs(cat.vx) > 0.5 || Math.abs(cat.vy) > 0.5) && frameCount.current % 12 === 0) {
             pawPrintsRef.current.push({
                 x: rx, 
                 y: ry,
                 angle: Math.atan2(cat.vy, cat.vx) - (isMobile ? Math.PI/2 : 0.1), 
                 life: 1.0
             });
          }

          pawPrintsRef.current.forEach(p => p.life -= 0.005);
          pawPrintsRef.current = pawPrintsRef.current.filter(p => p.life > 0);

          const plantX = isMobile ? 300 : GAME_WIDTH - 100;
          const plantY = isMobile ? 250 : 180;
          
          if (!plantTrimmedRef.current) {
              const distToPlant = Math.hypot(cat.x - plantX, cat.y - plantY);
              if (distToPlant < 80) {
                  plantTrimmedRef.current = true;
                  spawnParticles(plantX, plantY, CRAYON.green, 15);
                  audio.playScratch(); 
              }
          }

          // Cat Movement Logic
          if (cat.mode !== 'caught') {
              let difficultyMultiplier = 1.0;
              if (temperament >= 8) difficultyMultiplier = 1.6;
              else if (temperament >= 5) difficultyMultiplier = 1.2;

              const speedMultiplier = (temperament / 3) * difficultyMultiplier;
              const moveSpeed = (cat.mode === 'manic' ? 9 : (cat.mode === 'run' ? 6 : 2)) * speedMultiplier;

              if (cat.mode === 'manic') {
                  const angle = Math.atan2(handRef.current.y - cat.y, handRef.current.x - cat.x);
                  cat.vx += Math.cos(angle) * 1 * speedMultiplier; 
                  cat.vy += Math.sin(angle) * 1 * speedMultiplier;
                  
                  const hitRadius = 50 * cat.scale;
                  if (distToHand < hitRadius && (now - lastDamageTime.current > 800)) {
                      hpRef.current--;
                      setCurrentHp(hpRef.current);
                      lastDamageTime.current = now; 
                      
                      const ouchMsgs = TRANSLATIONS[language].ouch_messages || ["OUCH!"];
                      const idx = Math.floor(Math.random() * ouchMsgs.length);
                      setOwnerMessages(prev => [
                        ...prev, 
                        {
                          id: Date.now(),
                          type: 'ouch',
                          index: idx,
                          x: 20 + Math.random() * 20, 
                          y: GAME_HEIGHT - 100 
                        }
                      ]);

                      audio.playScratch();
                      spawnParticles(handRef.current.x, handRef.current.y, CRAYON.red, 8);
                      cat.vx *= -2; cat.vy *= -2;
                      if (hpRef.current <= 0) {
                          audio.playCatSinging(); 
                          onGameOver(TRANSLATIONS[language].caught_msg, 'caught'); 
                      }
                  }
              } else {
                  if (distToHand < 250) {
                      cat.mode = 'run';
                      const angle = Math.atan2(cat.y - handRef.current.y, cat.x - handRef.current.x);
                      cat.vx += Math.cos(angle) * 0.8 * speedMultiplier;
                      cat.vy += Math.sin(angle) * 0.8 * speedMultiplier;
                  } else if (cat.mode === 'run') {
                      cat.vx *= 0.92; cat.vy *= 0.92;
                      if (Math.abs(cat.vx) < 0.5) cat.mode = 'idle';
                  } else if (cat.mode === 'idle' && Math.random() < 0.02) {
                       cat.vx += (Math.random() - 0.5) * 4;
                       cat.vy += (Math.random() - 0.5) * 4;
                  }
              }
              cat.vx = Math.max(Math.min(cat.vx, moveSpeed), -moveSpeed);
              cat.vy = Math.max(Math.min(cat.vy, moveSpeed), -moveSpeed);
              cat.x += cat.vx;
              cat.y += cat.vy;

              const r = CAT_RADIUS * cat.scale;
              if (cat.x < r) { cat.x = r; cat.vx *= -1; }
              if (cat.x > GAME_WIDTH - r) { cat.x = GAME_WIDTH - r; cat.vx *= -1; }
              if (cat.y < r) { cat.y = r; cat.vy *= -1; }
              if (cat.y > GAME_HEIGHT - r) { cat.y = GAME_HEIGHT - r; cat.vy *= -1; }
          }
      }

      if (now - lastThoughtTime.current > 8000 && cat.mode !== 'caught' && winSequenceRef.current === 0) {
          if ((cat.mode === 'idle' && Math.random() > 0.6) || (cat.mode === 'run' && Math.random() > 0.7)) {
             generateCatThought(cat.mode, hpRef.current, language).then(setCatThought);
             lastThoughtTime.current = now;
             if (cat.mode === 'idle') audio.playVariedMeow(catType); 
          }
      }

      drawBathtub(ctx, tubBrokenSequenceRef.current > 0);
      drawCat(ctx, cat);
      drawHand(ctx, handRef.current.x, handRef.current.y, isGrabbing);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 5, p.y + 2); ctx.lineTo(p.x + 2, p.y + 5);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
        if (canvas) {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        }
        window.removeEventListener('resize', resizeOverlay);
        cancelAnimationFrame(animationFrameId);
    };
  }, [onGameOver, onWin, levelData, language, isMobile, GAME_WIDTH, GAME_HEIGHT]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${language === 'zh' ? "font-['ZCOOL_KuaiLe']" : language === 'ja' ? "font-['Kiwi_Maru']" : language === 'ru' ? "font-['Balsamiq_Sans']" : "font-['Chewy']"}`}>
      {/* Overlay Canvas for rolling out of screen logic */}
      <canvas 
        ref={overlayCanvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      />
      
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT}
        className="max-w-full max-h-full cursor-none touch-none"
        style={{ filter: 'contrast(1.05)' }}
      />

      {/* HP Bar */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 p-2 md:p-4 pointer-events-none bg-white/80 backdrop-blur-sm rounded-xl border-2 border-black rotate-1 shadow-md scale-75 md:scale-100 origin-top-left">
        <div className="text-4xl font-bold text-gray-800 flex items-center gap-4">
          <span className="font-sketch">HP:</span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_HP }).map((_, i) => (
              <span key={i} className={`transform transition-all duration-300 ${i < currentHp ? 'text-[#ff6b6b] scale-100' : 'text-gray-300 scale-75 blur-sm'}`} style={{ textShadow: i < currentHp ? '2px 2px 0 #000' : 'none' }}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Owner Messages (Floating Bubbles on Left) - DYNAMIC TEXT RENDERING */}
      {ownerMessages.map((msg) => {
        // Resolve text based on current language prop
        let text = "";
        if (msg.type === 'bath') {
           const list = TRANSLATIONS[language].bath_messages;
           const safeIndex = msg.index % list.length;
           text = list[safeIndex] + " ♥";
        } else {
           const list = TRANSLATIONS[language].ouch_messages || ["OUCH!"];
           const safeIndex = msg.index % list.length;
           text = list[safeIndex];
        }

        return (
        <div
          key={msg.id}
          onAnimationEnd={() => {
            setOwnerMessages(prev => prev.filter(m => m.id !== msg.id));
          }}
          className="absolute bg-white border-4 border-black px-4 py-2 md:px-6 md:py-4 rounded-2xl shadow-lg flex items-center gap-2 animate-[floatUpFade_3s_ease-out_forwards] pointer-events-none origin-bottom-left z-40"
          style={isMobile ? {
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)' // Center at top for mobile
          } : { 
             top: msg.y,
             left: msg.x
          }}
        >
          <span className="text-xl md:text-2xl font-bold font-sans text-gray-800 whitespace-nowrap">{text}</span>
          {!isMobile && <div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-r-4 border-b-4 border-black transform rotate-45"></div>}
        </div>
        );
      })}

      {/* Cat Thought Bubble */}
      {catThought && (
        <div 
          className="absolute pointer-events-none bg-white border-4 border-black p-3 md:p-4 rounded-[50%] shadow-lg transition-all duration-500 animate-pulse z-40"
          style={{
            left: (catRef.current.x / (GAME_WIDTH)) * 100 + '%',
            top: isMobile 
                 ? '15%' 
                 : ((catRef.current.y - 90 * catRef.current.scale) / (GAME_HEIGHT)) * 100 + '%', 
            transform: 'translate(-50%, -100%) rotate(-2deg)'
          }}
        >
          <div className="text-lg md:text-xl font-bold text-black whitespace-nowrap font-sketch">{catThought}</div>
          <div className="absolute bottom-[-15px] left-1/2 w-6 h-6 bg-white border-r-4 border-b-4 border-black transform rotate-45 -translate-x-1/2 rounded-br-lg"></div>
        </div>
      )}

      {/* Bath Emote Bubble */}
      {bathEmote && (
         <div 
          className="absolute pointer-events-none bg-white border-4 border-black p-3 md:p-4 rounded-xl shadow-xl animate-bounce z-40"
          style={{
            left: (catRef.current.x / (GAME_WIDTH)) * 100 + '%',
            top: ((catRef.current.y - 120 * catRef.current.scale) / (GAME_HEIGHT)) * 100 + '%',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-2xl md:text-3xl font-bold text-black whitespace-nowrap font-sans">{bathEmote}</div>
          <div className="absolute bottom-[-10px] left-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black transform rotate-45 -translate-x-1/2"></div>
        </div>
      )}
      
      <style>{`
        @keyframes floatUpFade {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { transform: translateY(-20px) scale(1.1); opacity: 1; }
          90% { transform: translateY(-150px) scale(1); opacity: 1; }
          100% { transform: translateY(-180px) scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GameEngine;