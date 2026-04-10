import React, { useEffect, useRef, useState } from 'react';
import GameEngine from './components/GameEngine';
import { GameState, CatType, Language, GameOverReason } from './types';
import { audio } from './services/audioService';
import { TRANSLATIONS, LEVELS, LevelData, STORY_DATA } from './constants';
import SettingsCatAnimation from './components/SettingsCatAnimation';

// ... (StartCat component remains same)

import CharityBoard from './components/CharityBoard';
import AdminDashboard from './components/AdminDashboard';

// StartCat Component
const StartCat: React.FC<{ meowText: string }> = ({ meowText }) => {
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

// Helper for Cat Styles
const getCatStyle = (t: CatType) => {
  switch(t) {
    case 'white': return { background: '#fff' };
    case 'black': return { background: '#2d2d2d' };
    case 'tuxedo': return { background: 'linear-gradient(135deg, #2d2d2d 50%, #fff 50%)' };
    case 'calico': return { background: 'radial-gradient(circle at 30% 30%, #ffa94d 20%, transparent 25%), radial-gradient(circle at 70% 60%, #2d2d2d 20%, transparent 25%), #fff' };
    case 'siamese': return { background: 'radial-gradient(circle, #4b3621 30%, #fdf5e6 70%)' }; 
    case 'devon': return { background: '#a0a0a0' }; // Pure Grey
    case 'orange': return { background: 'repeating-linear-gradient(45deg, #ffb74d, #ffb74d 10px, #e67e22 10px, #e67e22 20px)' }; 
    case 'sphynx': return { background: '#f5cba7' }; 
    case 'tabby': return { background: 'repeating-linear-gradient(45deg, #bdc3c7, #bdc3c7 10px, #2c3e50 10px, #2c3e50 20px)' }; 
    case 'maine_coon': return { background: 'linear-gradient(135deg, #3e2723 0%, #795548 50%, #d7ccc8 100%)' };
    default: return { background: '#fff' };
  }
};

// Gallery Modal Component
const GalleryModal: React.FC<{
  unlockedLevels: number[];
  onClose: () => void;
  language: Language;
  onViewStory: (id: number) => void;
  viewedStories: number[];
}> = ({ unlockedLevels, onClose, language, onViewStory, viewedStories }) => {
  const t = TRANSLATIONS[language];
  
  const getTranslated = (obj: any) => {
      if (typeof obj === 'string') return obj;
      return obj[language] || obj['en'];
  };
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#fffdf5] w-[95%] max-w-4xl h-[85vh] rounded-3xl border-[6px] border-[#2d2d2d] shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-[#ffec99] p-4 border-b-4 border-[#2d2d2d] flex justify-between items-center">
           <h2 className="text-2xl md:text-3xl font-bold text-[#2d2d2d]">{t.gallery}</h2>
           <button onClick={onClose} className="text-2xl font-bold hover:scale-110">✖️</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
           {STORY_DATA.map((story) => {
             const isUnlocked = unlockedLevels.includes(story.id);
             const isNew = isUnlocked && !viewedStories.includes(story.id);
             const level = LEVELS.find(l => l.id === story.id);
             const catStyle = level ? getCatStyle(level.catType) : {};
             
             return (
               <div 
                 key={story.id}
                 onClick={() => isUnlocked && onViewStory(story.id)}
                 className={`relative aspect-[3/4] rounded-xl border-4 transition-all transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center p-2 text-center
                   ${isUnlocked ? 'bg-white border-[#2d2d2d] shadow-md' : 'bg-gray-200 border-gray-400 opacity-70'}
                 `}
               >
                 {isNew && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse z-10"></span>
                 )}
                 {isUnlocked ? (
                   <>
                     <div className="w-16 h-16 rounded-full border-2 border-gray-400 mb-2 shadow-sm" style={catStyle}></div>
                     <h3 className="font-bold text-lg">{getTranslated(story.title)}</h3>
                     <span className="text-xs text-gray-500 mt-2">Click to read</span>
                   </>
                 ) : (
                   <div className="text-4xl text-gray-400">🔒</div>
                 )}
                 <div className="absolute top-2 left-2 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full border border-gray-300">#{story.id}</div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

// Story View Component
const StoryView: React.FC<{
  storyId: number;
  onClose: () => void;
  language: Language;
}> = ({ storyId, onClose, language }) => {
  const story = STORY_DATA.find(s => s.id === storyId);
  if (!story) return null;

  // Translation Helper
  const getTranslated = (obj: any) => {
      if (typeof obj === 'string') return obj;
      return obj[language] || obj['en'];
  };

  const fonts = [
      "font-serif", 
      "font-mono", 
      "font-['Comic_Sans_MS']", 
      "font-['Courier_New']", 
      "font-['Georgia']", 
      "font-['Times_New_Roman']", 
      "font-['Verdana']", 
      "font-['Trebuchet_MS']", 
      "font-['Arial_Black']", 
      "font-['Impact']"
  ];
  const fontClass = fonts[(storyId - 1) % fonts.length];

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className={`bg-[#fdfbf7] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative p-8 border-8 border-double border-[#d4a373] animate-[slideUp_0.5s_ease-out] ${fontClass}`}
        onClick={e => e.stopPropagation()}
        style={{
            backgroundImage: story.realImage ? `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${story.realImage})` : 'repeating-linear-gradient(#fdfbf7 0px, #fdfbf7 24px, #e5e5e5 25px)',
            backgroundSize: story.realImage ? 'cover' : 'auto',
            backgroundPosition: 'center',
            backgroundAttachment: 'local'
        }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-3xl hover:scale-110 text-[#2d2d2d] z-10">✖️</button>
        
        <div className="flex flex-col gap-4 text-[#2d2d2d]">
           <div className="text-center border-b-2 border-[#2d2d2d] pb-4 mb-4">
              <h2 className="text-3xl font-bold mb-2">{getTranslated(story.title)}</h2>
              <div className="text-sm text-gray-600 flex flex-wrap justify-center gap-4">
                 <span>{getTranslated(story.breed)}</span>
                 <span>|</span>
                 <span>{getTranslated(story.difficulty)}</span>
              </div>
              <div className="mt-2 italic text-gray-500">{getTranslated(story.personality)}</div>
           </div>

           <div className="text-lg font-bold text-center mb-4 text-orange-800">{getTranslated(story.intro)}</div>
           
           <div className="whitespace-pre-wrap leading-loose text-lg">
              {getTranslated(story.content)}
           </div>

           <div className="mt-8 p-6 bg-white/80 rounded-xl border-2 border-dashed border-[#2d2d2d] relative rotate-1">
              <div className="absolute -top-3 -left-3 text-4xl transform -rotate-12">🐾</div>
              <p className="text-xl font-bold text-center text-blue-800 italic">
                 "{getTranslated(story.unlockText)}"
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

// Global Ending Component
const GlobalEnding: React.FC<{ onClose: () => void; language: Language }> = ({ onClose, language }) => {
    const t = TRANSLATIONS[language];
    return (
        <div className="fixed inset-0 z-[120] bg-white flex flex-col items-center justify-center p-8 animate-[fadeIn_2s_ease-in]">
            <h1 className="text-4xl md:text-6xl font-bold text-[#2d2d2d] mb-8 text-center">The End</h1>
            <div className="text-xl md:text-2xl text-center max-w-2xl leading-relaxed font-serif mb-12 whitespace-pre-wrap">
                {t.global_ending}
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-4 mb-8 opacity-50">
                {Array.from({length: 10}).map((_, i) => <span key={i} className="text-2xl">🐱</span>)}
            </div>
            <button onClick={onClose} className="px-8 py-3 bg-[#2d2d2d] text-white rounded-full text-xl hover:scale-105 transition-transform">
                Return to Title
            </button>
        </div>
    );
};



// Updated Level Cell Component
const LevelCell: React.FC<{ 
  level: LevelData; 
  locked: boolean; 
  stars: number; 
  latest: boolean;
  onClick: () => void;
  catName: string;
}> = ({ level, locked, stars, latest, onClick, catName }) => {
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 shadow-md transition-all 
          ${locked ? 'bg-gray-200 border-gray-300 opacity-70 cursor-not-allowed' : 'hover:scale-105 cursor-pointer border-gray-600'}
          ${latest ? 'ring-4 ring-orange-400 ring-offset-2 animate-pulse' : ''}
        `}
        style={!locked ? getCatStyle(level.catType) : {}}
      >
        {locked ? (
          <span className="text-4xl text-gray-400 font-bold">?</span>
        ) : (
          <>
             {/* Star Badge */}
             {stars > 0 && (
               <div className="absolute -top-3 -right-3 flex bg-yellow-400 text-white rounded-full px-2 py-1 text-xs border-2 border-white shadow-sm">
                  {Array.from({length: stars}).map((_, i) => <span key={i}>★</span>)}
               </div>
             )}
          </>
        )}
      </button>
      <div className="flex flex-col items-center">
        <span className={`font-bold text-lg leading-none ${latest ? 'text-orange-600' : 'text-gray-700'}`}>
           {level.id}
        </span>
        <span className="text-sm text-gray-500 font-bold">
            {catName}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  type BoardMessage = { id?: string; text: string; timestamp: number };

  const [gameState, setGameState] = useState<GameState>('start');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [language, setLanguage] = useState<Language>('en');
  const [gameOverMsg, setGameOverMsg] = useState<string>("");
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>('caught');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Settings & Messages State
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showMessages, setShowMessages] = useState<boolean>(false);
  
  // Gallery State
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [viewingStoryId, setViewingStoryId] = useState<number | null>(null);
  const [viewedStories, setViewedStories] = useState<number[]>([]);
  const [showGlobalEnding, setShowGlobalEnding] = useState<boolean>(false);

  // Charity Board State
  const [showCharityBoard, setShowCharityBoard] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);

  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>("");
  const [sendSuccess, setSendSuccess] = useState<string>("");
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownNow, setCooldownNow] = useState<number>(Date.now());

  // Persistence State
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  
  // Win Screen State
  const [winTime, setWinTime] = useState<number>(0);
  const [winStars, setWinStars] = useState<number>(0);

  const t = TRANSLATIONS[language];

  // Load Persistence - REMOVED for "Clear on Refresh" requirement
  // useEffect(() => {
  //   const savedMax = localStorage.getItem('hellycat_max_level');
  //   const savedStars = localStorage.getItem('hellycat_stars');
  //   const savedViewed = localStorage.getItem('hellycat_viewed_stories');
  //   
  //   if (savedMax) setMaxUnlockedLevel(parseInt(savedMax, 10));
  //   if (savedStars) setLevelStars(JSON.parse(savedStars));
  //   if (savedViewed) setViewedStories(JSON.parse(savedViewed));
  // }, []);

  const saveProgress = (levelId: number, stars: number) => {
      // Update max level if we beat the current max
      let newMax = maxUnlockedLevel;
      if (levelId === maxUnlockedLevel && levelId < LEVELS.length) {
          newMax = levelId + 1;
          setMaxUnlockedLevel(newMax);
          // localStorage.setItem('hellycat_max_level', newMax.toString()); // Removed persistence
      }
      
      // Update stars if better
      const currentStars = levelStars[levelId] || 0;
      if (stars > currentStars) {
          const newStars = { ...levelStars, [levelId]: stars };
          setLevelStars(newStars);
          // localStorage.setItem('hellycat_stars', JSON.stringify(newStars)); // Removed persistence
      }

      // Check Global Ending (All 10 levels completed)
      if (Object.keys(levelStars).length >= 10 || (levelId === 10 && Object.keys(levelStars).length >= 9)) {
          // Trigger global ending next time they go to menu or immediately?
          // Let's trigger it when they return to menu or click a button
      }
  };

  const markStoryViewed = (id: number) => {
      if (!viewedStories.includes(id)) {
          const newViewed = [...viewedStories, id];
          setViewedStories(newViewed);
          // localStorage.setItem('hellycat_viewed_stories', JSON.stringify(newViewed)); // Removed persistence
      }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages([...data].reverse()); // Show newest first
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  const getCooldownSeconds = () => {
    const left = Math.ceil((cooldownUntil - cooldownNow) / 1000);
    return left > 0 ? left : 0;
  };

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return `${minutes}:${remainSeconds.toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (getCooldownSeconds() > 0) return;

    setIsSending(true);
    setSendError("");
    setSendSuccess("");
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage })
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof result.retryAfterSeconds === 'number' && result.retryAfterSeconds > 0) {
          setCooldownNow(Date.now());
          setCooldownUntil(Date.now() + result.retryAfterSeconds * 1000);
        }
        setSendError(result.error || '发送失败，请稍后重试');
        return;
      }

      setNewMessage("");
      setSendSuccess('留言提交成功，系统审核通过后已展示');
      if (typeof result.nextAllowedAt === 'number') {
        setCooldownNow(Date.now());
        setCooldownUntil(result.nextAllowedAt);
      }
      fetchMessages();
    } catch (e) {
      console.error("Failed to send message", e);
      setSendError('网络异常，请稍后重试');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (showMessages) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [showMessages]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setCooldownNow(now);
      if (now >= cooldownUntil) {
        setCooldownUntil(0);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        // Only toggle if not typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setShowAdmin(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const initAudio = () => audio.resume();
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const toggleLanguage = () => {
    const langs: Language[] = ['en', 'zh', 'ja', 'fr', 'de', 'ru'];
    const idx = langs.indexOf(language);
    setLanguage(langs[(idx + 1) % langs.length]);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const getLanguageLabel = (l: Language) => {
      switch(l) {
          case 'en': return 'English';
          case 'zh': return '中文';
          case 'ja': return '日本語';
          case 'fr': return 'Français';
          case 'de': return 'Deutsch';
          case 'ru': return 'Русский';
          default: return 'English';
      }
  };

  let fontClass = "font-['Chewy']";
  if (language === 'zh') fontClass = "font-['ZCOOL_KuaiLe']";
  else if (language === 'ja') fontClass = "font-['Kiwi_Maru']";
  else if (language === 'ru') fontClass = "font-['Balsamiq_Sans']";

  const isRolledAway = gameOverReason === 'roll';
  const isFree = gameOverReason === 'free';
  const isTubBroken = gameOverReason === 'tub';
  
  const currentLevelData = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  const handleWin = (timeElapsed: number) => {
      setWinTime(timeElapsed);
      
      // Calculate Stars
      const targets = currentLevelData.timeTargets;
      let stars = 1;
      if (timeElapsed <= targets[0]) stars = 3;
      else if (timeElapsed <= targets[1]) stars = 2;
      
      setWinStars(stars);
      saveProgress(currentLevelId, stars);
      setGameState('win');
  };

  // Calculate unlocked stories count for red dot
  // A story is unlocked if the level is completed (stars > 0)
  // It is "new" if it's unlocked but not in viewedStories
  const unlockedStoryIds = Object.keys(levelStars).map(Number);
  const hasNewStories = unlockedStoryIds.some(id => !viewedStories.includes(id));

  return (
    <div className={`w-full h-screen flex flex-col items-center justify-center overflow-hidden relative selection:bg-none select-none text-[#2d2d2d] ${fontClass}`}>
      
      {/* Top Right Controls */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50 flex gap-2 md:gap-4">
        {/* Gallery Button */}
        <button 
          onClick={() => setShowGallery(true)}
          className="bg-white border-2 md:border-4 border-black px-3 py-1 md:px-4 md:py-2 rounded-xl text-lg md:text-2xl font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center min-w-[3rem] md:min-w-[4rem] relative"
        >
          💌
          {hasNewStories && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>

        <button 
          onClick={() => setShowSettings(true)}
          className="bg-white border-2 md:border-4 border-black px-3 py-1 md:px-4 md:py-2 rounded-xl text-lg md:text-2xl font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center min-w-[3rem] md:min-w-[4rem]"
        >
          ⚙️
        </button>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
          <GalleryModal 
            unlockedLevels={unlockedStoryIds} 
            onClose={() => setShowGallery(false)} 
            language={language}
            viewedStories={viewedStories}
            onViewStory={(id) => {
                setViewingStoryId(id);
                markStoryViewed(id);
            }}
          />
      )}

      {/* Story View */}
      {viewingStoryId && (
          <StoryView 
            storyId={viewingStoryId} 
            onClose={() => setViewingStoryId(null)} 
            language={language}
          />
      )}

      {/* Global Ending */}
      {showGlobalEnding && (
          <GlobalEnding onClose={() => {
              setShowGlobalEnding(false);
              setGameState('start');
          }} language={language} />
      )}

      {/* Charity Board */}
      <CharityBoard 
        isOpen={showCharityBoard} 
        onClose={() => setShowCharityBoard(false)} 
        language={language} 
      />

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-[#fffdf5] p-8 rounded-3xl border-4 border-[#2d2d2d] shadow-2xl w-[90%] max-w-md relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-2xl" onClick={() => setShowSettings(false)}>✖️</button>
            <h2 className="text-3xl font-bold mb-6 text-center">Settings</h2>
            
            <SettingsCatAnimation meowText={t.meow_txt} />

            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Sound</span>
                <button 
                  onClick={toggleMute}
                  className="bg-white border-2 border-black px-4 py-2 rounded-xl text-xl font-bold hover:bg-gray-100 min-w-[100px]"
                >
                  {isMuted ? 'OFF 🔇' : 'ON 🔊'}
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Language</span>
                <button 
                  onClick={toggleLanguage}
                  className="bg-white border-2 border-black px-4 py-2 rounded-xl text-xl font-bold hover:bg-gray-100 min-w-[100px]"
                >
                  {getLanguageLabel(language)}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-red-600">Reload Game</span>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-100 border-2 border-red-500 text-red-600 px-4 py-2 rounded-xl text-lg font-bold hover:bg-red-200 min-w-[100px]"
                >
                  ↻
                </button>
              </div>

              {gameState === 'playing' && (
                <>
                  <div className="w-full h-[2px] bg-gray-200 my-2"></div>
                  
                  <button 
                    onClick={() => {
                        setShowSettings(false);
                        setGameState('selection');
                        setTimeout(() => {
                            setGameState('playing');
                        }, 50);
                    }}
                    className="w-full bg-orange-100 border-2 border-orange-400 text-orange-700 px-4 py-3 rounded-xl text-xl font-bold hover:bg-orange-200"
                  >
                    {t.restart_level}
                  </button>

                  <button 
                    onClick={() => {
                        setShowSettings(false);
                        setGameState('selection');
                    }}
                    className="w-full bg-gray-100 border-2 border-gray-400 text-gray-700 px-4 py-3 rounded-xl text-xl font-bold hover:bg-gray-200"
                  >
                    {t.return_menu}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState === 'start' && (
        <div className="relative w-full max-w-2xl flex flex-col items-center px-4">
           {/* Corkboard Entrance (Top Right) */}
           <div className="absolute -top-32 -right-12 md:-right-32 flex gap-4 z-20">
             <div 
              onClick={() => setShowCharityBoard(true)}
              className="cursor-pointer hover:scale-110 transition-transform"
              title="Furry Notice Board"
             >
                <div className="bg-[#d4a373] border-4 border-[#8d6e63] p-2 rounded shadow-lg rotate-3 w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center text-center relative">
                   <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-red-800 shadow-sm"></div>
                   <span className="text-2xl md:text-3xl">📌</span>
                   <span className="text-[10px] md:text-xs font-bold text-[#5d4037] leading-tight mt-1">Notice Board</span>
                </div>
             </div>

             <div 
              onClick={() => setShowMessages(true)}
              className="cursor-pointer hover:scale-110 transition-transform"
              title="Cat Mail"
             >
                <div className="bg-[#fffdf5] border-4 border-[#2d2d2d] p-2 rounded shadow-lg -rotate-3 w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center text-center relative">
                   <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-800 shadow-sm"></div>
                   <span className="text-2xl md:text-3xl">📧</span>
                   <span className="text-[10px] md:text-xs font-bold text-[#2d2d2d] leading-tight mt-1">Cat Mail</span>
                </div>
             </div>
           </div>

           <div 
             className="absolute top-[-100px] md:top-[-135px] z-0 transition-transform hover:-translate-y-4 duration-300"
             onClick={() => audio.playMeow()}
           >
             <StartCat meowText={t.meow_txt} />
           </div>

          <div className="z-10 text-center p-6 md:p-12 bg-[#fffdf5] rounded-lg border-[4px] md:border-[6px] border-[#2d2d2d] shadow-[8px_8px_0px_0px_rgba(231,76,60,0.2)] md:shadow-[12px_12px_0px_0px_rgba(231,76,60,0.2)] w-full mx-4 rotate-1 relative overflow-visible">
            <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 w-24 md:w-32 h-8 md:h-10 bg-yellow-200/80 transform -rotate-2 backdrop-blur-sm border-l border-r border-white/50"></div>

            <h1 className="text-5xl md:text-8xl font-bold mb-2 md:mb-4 tracking-tighter text-[#2d2d2d]" style={{ textShadow: '4px 4px 0px #e6e6e6' }}>
              {t.title}
            </h1>
            
            <p className="text-lg md:text-2xl mb-6 md:mb-8 leading-relaxed font-bold text-gray-700">
              {t.subtitle}
            </p>

            <div className="flex justify-center gap-4 md:gap-8 mb-6 md:mb-10 text-base md:text-xl font-bold flex-wrap">
               {isMobile ? (
                 <>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-3xl md:text-4xl mb-1 md:mb-2">👆</span>
                     <span className="text-orange-600 text-sm md:text-base">{t.controls_move_mobile}</span>
                   </div>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-3xl md:text-4xl mb-1 md:mb-2">🤏</span>
                     <span className="text-orange-600 text-sm md:text-base">{t.controls_grab_mobile}</span>
                   </div>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-3xl md:text-4xl mb-1 md:mb-2">🛁</span>
                     <span className="text-blue-500 text-sm md:text-base">{t.controls_tub_mobile}</span>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-2xl md:text-4xl mb-1 md:mb-2">🖱️</span>
                     <span className="text-orange-600">CLICK</span>
                     <span className="text-gray-500 text-xs md:text-sm">{t.controls_space}</span>
                   </div>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-2xl md:text-4xl mb-1 md:mb-2">👆</span>
                     <span className="text-orange-600">DRAG</span>
                     <span className="text-gray-500 text-xs md:text-sm">{t.controls_wasd}</span>
                   </div>
                   <div className="flex flex-col items-center bg-gray-100 p-2 md:p-4 rounded-xl border-2 border-dashed border-gray-300 min-w-[80px]">
                     <span className="text-2xl md:text-4xl mb-1 md:mb-2">🛁</span>
                     <span className="text-blue-500">TUB</span>
                     <span className="text-gray-500 text-xs md:text-sm">{t.controls_tub}</span>
                   </div>
                 </>
               )}
            </div>

            <button 
              onClick={() => {
                audio.playMeow();
                setGameState('selection');
              }}
              className="px-8 py-3 md:px-12 md:py-4 bg-[#2d2d2d] text-white text-2xl md:text-4xl rounded-xl hover:scale-105 hover:bg-orange-500 transition-all transform shadow-lg font-bold"
            >
              {t.start_btn}
            </button>
          </div>
        </div>
      )}

      {gameState === 'level_intro' && currentLevelData && (
        <div className="relative w-full max-w-2xl flex flex-col items-center px-4 z-50">
          <div className="z-10 text-center p-8 md:p-12 bg-[#fffdf5] rounded-3xl border-[6px] border-[#2d2d2d] shadow-[12px_12px_0px_0px_rgba(231,76,60,0.2)] w-full mx-4">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#2d2d2d]">
              Level {currentLevelData.id}
            </h2>
            <div className="bg-orange-100 border-4 border-orange-300 rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold text-orange-800 mb-4">{t.level_objective}</h3>
              <p className="text-xl text-orange-900 font-medium">
                {t.level_objective_desc}
              </p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-700 mb-4">{t.available_tools}</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {currentLevelData.availableItems.map(item => (
                  <div key={item} className="bg-white border-2 border-gray-300 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-3xl mb-2">
                      {item === 'brush' ? '🪥' : item === 'clippers' ? '✂️' : item === 'treat' ? '🐟' : item === 'towel' ? '🧣' : item === 'yarn' ? '🧶' : '📦'}
                    </span>
                    <span className="text-sm font-bold text-gray-600 capitalize">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                audio.playMeow();
                setGameState('playing');
              }}
              className="px-10 py-4 bg-emerald-500 text-white text-2xl md:text-3xl rounded-xl hover:scale-105 hover:bg-emerald-400 transition-all transform shadow-lg font-bold border-4 border-emerald-700"
            >
              {t.start_level_btn}
            </button>
          </div>
        </div>
      )}

      {gameState === 'selection' && (
        <div className="relative z-10 flex flex-col items-center w-[95%] max-w-4xl mx-4">
          {/* Cat Ears */}
          <div className="absolute -top-8 left-8 md:left-16 w-20 h-20 md:w-32 md:h-32 bg-[#fffdf5] border-[4px] md:border-[6px] border-[#2d2d2d] rounded-t-full transform -rotate-12 z-0"></div>
          <div className="absolute -top-8 right-8 md:right-16 w-20 h-20 md:w-32 md:h-32 bg-[#fffdf5] border-[4px] md:border-[6px] border-[#2d2d2d] rounded-t-full transform rotate-12 z-0"></div>
          
          {/* Main Card Body - Cat Face Shape */}
          <div className="z-10 text-center p-6 md:p-12 bg-[#fffdf5] rounded-[3rem] md:rounded-[4rem] border-[4px] md:border-[6px] border-[#2d2d2d] shadow-[12px_12px_0px_0px_rgba(52,152,219,0.2)] w-full relative flex flex-col items-center max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center gap-4 mb-4 md:mb-8 relative w-full">
               <h2 className="text-3xl md:text-5xl font-bold text-[#2d2d2d]">{t.choose_cat}</h2>
               {Object.keys(levelStars).length >= 10 && (
                   <button 
                     onClick={() => setShowGlobalEnding(true)}
                     className="text-3xl md:text-5xl hover:scale-110 transition-transform animate-pulse text-yellow-500"
                     title="The End"
                   >
                     🌟
                   </button>
               )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-10 w-full justify-items-center">
              {LEVELS.map(level => {
                const locked = level.id > maxUnlockedLevel;
                const isLatest = level.id === maxUnlockedLevel && !levelStars[level.id];
                return (
                  <LevelCell 
                    key={level.id} 
                    level={level}
                    locked={locked}
                    stars={levelStars[level.id] || 0}
                    latest={isLatest}
                    catName={t.cat_names[level.catType]}
                    onClick={() => {
                      setCurrentLevelId(level.id);
                      audio.playCatTheme(level.catType);
                      audio.playVariedMeow(level.catType);
                      // Slight delay to allow sound before starting
                      setTimeout(() => {
                          audio.stopTheme(); 
                          setGameState('level_intro');
                      }, 300);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Message Board Modal */}
      {showMessages && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowMessages(false)}>
          <div className="bg-[#fffdf5] w-[95%] max-w-2xl h-[80vh] rounded-3xl border-[6px] border-[#2d2d2d] shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#ffec99] p-4 border-b-4 border-[#2d2d2d] flex justify-between items-center">
               <h2 className="text-2xl md:text-3xl font-bold text-[#2d2d2d]">Cat Mail 🐾</h2>
               <button onClick={() => setShowMessages(false)} className="text-2xl font-bold hover:scale-110">✖️</button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat space-y-4">
               {messages.length === 0 ? (
                 <div className="text-center text-gray-400 font-bold mt-10">No letters yet... be the first!</div>
               ) : (
                 messages.map((msg, idx) => (
                   <div key={msg.id || `${msg.timestamp}-${idx}`} className="relative bg-white p-4 rounded-xl shadow-md border-2 border-gray-100 transform rotate-1 hover:rotate-0 transition-transform">
                      {/* Paw Print Stamp */}
                      <div className="absolute -top-2 -right-2 text-2xl opacity-50 transform rotate-12">🐾</div>
                      <p className="text-lg font-bold text-gray-700 break-words">{msg.text}</p>
                      <span className="text-xs text-gray-400 mt-2 block text-right">{new Date(msg.timestamp).toLocaleString()}</span>
                   </div>
                 ))
               )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t-4 border-[#2d2d2d]">
               {/* Bubble */}
               <div className="mb-2 relative inline-block bg-blue-100 px-3 py-1 rounded-lg text-sm font-bold text-blue-600 border-2 border-blue-200">
                  留言会经过审核；单条最多 300 字；每 3 分钟可提交一次
                  <div className="absolute bottom-[-6px] left-4 w-3 h-3 bg-blue-100 border-b-2 border-r-2 border-blue-200 transform rotate-45"></div>
               </div>
               
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newMessage}
                   onChange={(e) => {
                     setNewMessage(e.target.value);
                     setSendError("");
                     setSendSuccess("");
                   }}
                   placeholder="Write a letter..."
                   className="flex-1 border-4 border-[#2d2d2d] rounded-xl px-4 py-2 text-lg font-bold focus:outline-none focus:border-orange-400"
                   onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                   maxLength={300}
                 />
                 <button 
                   onClick={sendMessage}
                   disabled={isSending || !newMessage.trim() || getCooldownSeconds() > 0}
                   className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold border-4 border-[#2d2d2d] hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_#2d2d2d] active:translate-y-1 active:shadow-none transition-all"
                 >
                   {isSending ? '...' : getCooldownSeconds() > 0 ? formatCooldown(getCooldownSeconds()) : 'Send'}
                 </button>
               </div>
               <div className="mt-2 flex items-center justify-between text-xs">
                 <span className="text-gray-500">{newMessage.length}/300</span>
                 {sendError && <span className="font-bold text-red-500">{sendError}</span>}
                 {!sendError && sendSuccess && <span className="font-bold text-green-600">{sendSuccess}</span>}
               </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <GameEngine 
          levelData={currentLevelData}
          onGameOver={(msg, reason) => {
             setGameOverMsg(msg);
             setGameOverReason(reason);
             setGameState('gameover');
          }} 
          onWin={handleWin} 
          language={language}
          isMobile={isMobile}
        />
      )}

      {/* WIN SCREEN */}
      {gameState === 'win' && (
        <div className="relative z-10 flex flex-col items-center justify-center w-[90vw] md:w-[600px] bg-white rounded-3xl border-[8px] border-blue-400 shadow-[0_0_60px_rgba(52,152,219,0.4)] animate-bounce-slow max-h-[90vh] p-8">
           
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-6 py-2 rounded-full font-bold text-2xl shadow-lg border-4 border-white">
             {t.win_title}
           </div>

           {/* Stars */}
           <div className="flex gap-2 text-6xl md:text-8xl mb-4 mt-6 drop-shadow-md">
             {[1,2,3].map(i => (
                 <span key={i} className={`transform transition-all duration-500 delay-${i * 200} ${i <= winStars ? 'text-yellow-400 scale-100' : 'text-gray-200 scale-90'}`}>
                   ★
                 </span>
             ))}
           </div>
           
           <div className="text-xl md:text-2xl font-bold text-gray-500 mb-6 flex flex-col items-center gap-2">
             <div className="bg-blue-50 px-6 py-3 rounded-xl border-2 border-blue-100">
               {t.time}: <span className="text-blue-600 text-3xl">{winTime.toFixed(1)}s</span>
             </div>
             {levelStars[currentLevelId] === undefined && (
                <div className="text-orange-500 animate-pulse">{t.new_record}</div>
             )}
           </div>

           <div className="flex flex-col gap-4 w-full px-8">
             {currentLevelId < LEVELS.length ? (
                <button 
                  onClick={() => {
                    setCurrentLevelId(prev => prev + 1);
                    setGameState('playing');
                  }}
                  className="w-full py-3 md:py-4 bg-blue-500 text-white rounded-xl text-xl md:text-2xl font-bold hover:bg-blue-600 shadow-lg hover:scale-105 transition-transform"
                >
                  {t.play_again}
                </button>
             ) : (
                <div className="text-center text-green-600 font-bold text-xl mb-2">🎉 ALL LEVELS COMPLETE! 🎉</div>
             )}
             
             <button 
               onClick={() => setGameState('selection')}
               className="w-full py-3 md:py-4 bg-gray-200 text-gray-700 rounded-xl text-xl md:text-2xl font-bold hover:bg-gray-300 shadow-md"
             >
               {t.back_to_levels}
             </button>
           </div>
           <style>{`
             @keyframes bounce-slow {
               0%, 100% { transform: translateY(0); }
               50% { transform: translateY(-10px); }
             }
             .animate-bounce-slow {
               animation: bounce-slow 3s infinite ease-in-out;
             }
           `}</style>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <>
          {isFree ? (
            // FREEDOM CARD 
            <div className="relative z-10 flex flex-col items-center justify-center animate-bounce-slow">
               <div className="w-[90vw] h-[60vw] md:w-[600px] md:h-[400px] relative flex flex-col items-center justify-center text-center">
                  <svg className="absolute top-0 left-0 w-full h-full drop-shadow-2xl" viewBox="0 0 200 130" preserveAspectRatio="none">
                      <defs>
                          <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(135, 206, 235, 0.4)"/>
                          </filter>
                      </defs>
                      <path 
                        d="M 50 120 C 20 120, 10 100, 10 70 C 10 40, 30 30, 40 40 L 40 20 L 70 40 C 90 30, 110 30, 130 40 L 160 20 L 160 40 C 170 30, 190 40, 190 70 C 190 100, 180 120, 150 120 Z" 
                        fill="white" 
                        stroke="#87CEEB" 
                        strokeWidth="3"
                        filter="url(#cloudShadow)"
                      />
                  </svg>
                  
                  <div className="z-10 px-8 flex flex-col items-center relative mt-8">
                    <div className="text-6xl md:text-8xl mb-2 animate-bounce">🕊️</div>
                    <h2 className="text-3xl md:text-5xl font-bold text-sky-500 mb-2 md:mb-4">{t.free_title}</h2>
                    <p className="text-lg md:text-2xl mb-4 md:mb-6 font-bold text-gray-500">{t.free_msg}</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setGameState('playing')} // Retry current level
                        className="px-6 py-2 md:px-8 md:py-3 bg-sky-400 text-white rounded-full text-xl md:text-2xl font-bold hover:bg-sky-500 shadow-lg transform hover:scale-105 transition-all border-2 border-white"
                      >
                        {t.try_again}
                      </button>
                      <button 
                        onClick={() => setGameState('selection')}
                        className="px-6 py-2 md:px-8 md:py-3 bg-gray-200 text-gray-600 rounded-full text-xl md:text-2xl font-bold hover:bg-gray-300 shadow-lg"
                      >
                        {t.back_to_levels}
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          ) : isTubBroken ? (
            // BROKEN TUB CARD
            <div className="relative z-10 flex flex-col items-center justify-center animate-pulse">
                <div className="relative w-[90vw] h-[90vw] md:w-[600px] md:h-[500px]">
                     <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-white border-4 border-blue-300 transform -rotate-6 shadow-xl rounded-2xl" style={{clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 80%)'}}></div>
                     <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-white border-4 border-blue-300 transform rotate-12 shadow-xl rounded-2xl" style={{clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 80%)'}}></div>
                     <div className="absolute top-1/2 left-10 w-20 h-20 bg-blue-50 border-2 border-blue-200 transform -rotate-45 shadow-md rounded-lg"></div>
                     <div className="absolute bottom-20 right-20 w-16 h-16 bg-blue-100 border-2 border-blue-200 transform rotate-45 shadow-md rounded-full"></div>
                     
                     <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-4">
                         <div className="text-6xl md:text-8xl mb-2">🛀💥</div>
                         <h2 className="text-4xl md:text-6xl font-bold text-blue-600 mb-2 md:mb-4 tracking-tight" style={{textShadow: '2px 2px 0px #fff'}}>{t.fat_tub_title}</h2>
                         <p className="text-lg md:text-2xl font-bold text-gray-700 bg-white/90 p-4 rounded-xl shadow-sm border-2 border-blue-100 max-w-sm">{t.fat_tub_msg}</p>
                         <div className="flex gap-4 mt-6">
                            <button 
                              onClick={() => setGameState('playing')}
                              className="px-8 py-3 md:px-10 md:py-4 bg-blue-500 text-white rounded-full text-2xl md:text-3xl font-bold hover:bg-blue-600 shadow-xl hover:scale-105 transition-all border-4 border-white"
                            >
                              {t.try_again}
                            </button>
                            <button 
                               onClick={() => setGameState('selection')}
                               className="px-6 py-3 md:px-8 md:py-4 bg-gray-200 text-gray-700 rounded-full text-2xl md:text-3xl font-bold hover:bg-gray-300 shadow-lg"
                             >
                               {t.back_to_levels}
                             </button>
                         </div>
                     </div>
                </div>
            </div>
          ) : isRolledAway ? (
            // BOUNCY BALL CARD
            <div className="relative z-10 w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] bg-white rounded-full border-[8px] md:border-[12px] border-orange-500 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center animate-spin-slow">
               <div className="absolute top-1/2 left-0 w-full h-12 md:h-16 bg-orange-200 -translate-y-1/2 -rotate-12 transform origin-center border-t-4 border-b-4 border-orange-300"></div>
               
               <div className="z-10 bg-white/90 p-6 md:p-8 rounded-3xl backdrop-blur-sm">
                 <div className="text-6xl md:text-8xl mb-2">⚽🐈</div>
                 <h2 className="text-3xl md:text-5xl font-bold text-orange-600 mb-2 md:mb-4">{t.caught_title}</h2>
                 <p className="text-lg md:text-xl mb-4 md:mb-6 max-w-sm mx-auto font-bold">{gameOverMsg}</p>
                 <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => setGameState('playing')}
                      className="px-6 py-2 md:px-8 md:py-3 bg-orange-500 text-white rounded-xl text-xl md:text-2xl font-bold hover:bg-orange-600 shadow-md"
                    >
                      {t.try_again}
                    </button>
                    <button 
                      onClick={() => setGameState('selection')}
                      className="px-6 py-2 md:px-8 md:py-3 bg-gray-200 text-gray-700 rounded-xl text-xl md:text-2xl font-bold hover:bg-gray-300 shadow-md"
                    >
                      {t.back_to_levels}
                    </button>
                 </div>
               </div>
               <style>{`
                 @keyframes spin-slow {
                   0% { transform: rotate(0deg); }
                   25% { transform: rotate(5deg); }
                   75% { transform: rotate(-5deg); }
                   100% { transform: rotate(0deg); }
                 }
                 .animate-spin-slow {
                   animation: spin-slow 4s infinite ease-in-out;
                 }
               `}</style>
            </div>
          ) : (
            // PAW PRINT CARD (Scratched)
            <div className="relative z-10 flex flex-col items-center max-w-[95vw]">
                {/* Toes */}
                <div className="flex gap-2 md:gap-4 mb-[-20px] md:mb-[-40px]">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-white border-4 md:border-8 border-red-500 rounded-full shadow-lg"></div>
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white border-4 md:border-8 border-red-500 rounded-full shadow-lg -mt-4 md:-mt-8"></div>
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white border-4 md:border-8 border-red-500 rounded-full shadow-lg -mt-4 md:-mt-8"></div>
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-white border-4 md:border-8 border-red-500 rounded-full shadow-lg"></div>
                </div>
                {/* Main Pad */}
                <div className="w-[90vw] h-[75vw] md:w-[550px] md:h-[450px] bg-white border-[6px] md:border-[8px] border-red-500 rounded-[45%_45%_50%_50%] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden px-4">
                    {/* Scratch Marks Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                         <svg width="100%" height="100%" viewBox="0 0 100 100">
                             <path d="M10,10 L40,40 M60,10 L30,40 M20,60 L50,90" stroke="red" strokeWidth="2" />
                         </svg>
                    </div>

                    <div className="text-6xl md:text-8xl mb-2">🐾💢</div>
                    <h2 className="text-4xl md:text-6xl font-bold text-red-600 mb-2 md:mb-4">{t.caught_title}</h2>
                    <p className="text-lg md:text-2xl mb-4 md:mb-8 font-bold text-gray-700 max-w-md">{gameOverMsg}</p>
                    <div className="flex gap-4">
                        <button 
                          onClick={() => setGameState('playing')}
                          className="px-8 py-3 md:px-10 md:py-4 bg-red-500 text-white rounded-full text-2xl md:text-3xl font-bold hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                        >
                          {t.try_again}
                        </button>
                        <button 
                           onClick={() => setGameState('selection')}
                           className="px-6 py-3 md:px-8 md:py-4 bg-gray-200 text-gray-700 rounded-full text-2xl md:text-3xl font-bold hover:bg-gray-300 shadow-lg"
                         >
                           {t.back_to_levels}
                         </button>
                    </div>
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
