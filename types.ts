export type GameState = 'start' | 'selection' | 'level_intro' | 'playing' | 'gameover' | 'win';

export type CatMode = 'idle' | 'run' | 'manic' | 'caught' | 'angry' | 'happy';

export type CatType = 'white' | 'black' | 'tuxedo' | 'calico' | 'siamese' | 'devon' | 'orange' | 'sphynx' | 'tabby' | 'maine_coon';

export type CatState = 'normal' | 'hungry' | 'dirty' | 'grumpy' | 'long_hair' | 'tangled' | 'needs_poop' | 'bored';

export type ItemType = 'fish' | 'bun' | 'pizza' | 'brush' | 'scissors' | 'toy' | 'catnip' | 'yarn';

export type ItemCategory = 'food' | 'cleaning' | 'toy';

export type Language = 'en' | 'zh' | 'ja' | 'fr' | 'de' | 'ru';

export type GameOverReason = 'caught' | 'roll' | 'tub' | 'free';

export interface Point {
  x: number;
  y: number;
}

export interface CatEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mode: CatMode;
  angle: number;
  scale: number;
  thought?: string;
  state: CatState;
  hunger: number;
  dirtiness: number;
  grumpiness: number;
}

export interface GameItem {
  id: number;
  type: ItemType;
  category: ItemCategory;
  x: number;
  y: number;
  isDragging: boolean;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// MediaPipe Types (Simplified)
export interface WindowWithMediaPipe extends Window {
  Hands: any;
  Camera: any;
  drawConnectors: any;
  drawLandmarks: any;
  HAND_CONNECTIONS: any;
}