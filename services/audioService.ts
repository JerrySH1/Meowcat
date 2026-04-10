import { CatType } from '../types';

interface Note {
  f: number;
  d: number; // duration
  t: number; // start time
  type?: OscillatorType;
}

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentThemeOscillators: { stop: () => void } | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.4; // Slightly increased volume
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Audio resume failed:", e));
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.ctx) this.ctx.suspend();
    } else {
      this.resume();
    }
    return this.isMuted;
  }

  stopTheme() {
    if (this.currentThemeOscillators) {
      this.currentThemeOscillators.stop();
      this.currentThemeOscillators = null;
    }
  }

  playCatTheme(type: CatType) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    
    // Ensure context is running if possible
    this.resume();
    
    this.stopTheme();

    // Helper to create notes
    const NOTES: {[key: string]: number} = {
        'C3': 130.81, 'E3': 164.81, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00
    };

    let melody: Note[] = [];
    let loopDuration = 0;
    let volumeMultiplier = 1.0; // Volume scalar for specific themes

    switch (type) {
        case 'white': // Lullaby
            melody = [
                { f: NOTES.E4, d: 0.4, t: 0.0, type: 'sine' },
                { f: NOTES.E4, d: 0.4, t: 0.5, type: 'sine' },
                { f: NOTES.G4, d: 0.8, t: 1.0, type: 'sine' },
                { f: NOTES.E4, d: 0.4, t: 2.0, type: 'sine' },
                { f: NOTES.G4, d: 0.8, t: 2.5, type: 'sine' },
                { f: NOTES.C5, d: 0.4, t: 3.5, type: 'sine' },
                { f: NOTES.B4, d: 0.2, t: 4.0, type: 'sine' },
                { f: NOTES.A4, d: 0.2, t: 4.25, type: 'sine' },
                { f: NOTES.A4, d: 0.2, t: 4.5, type: 'sine' },
                { f: NOTES.G4, d: 0.8, t: 4.75, type: 'sine' }
            ];
            loopDuration = 6.0;
            break;

        case 'black': // Mystery
            melody = [
                { f: NOTES.E3, d: 0.2, t: 0.0, type: 'triangle' },
                { f: NOTES.G3, d: 0.2, t: 0.25, type: 'triangle' },
                { f: NOTES.B3, d: 0.2, t: 0.5, type: 'triangle' },
                { f: NOTES.E4, d: 0.4, t: 0.75, type: 'triangle' },
                { f: NOTES.B3, d: 0.2, t: 1.25, type: 'triangle' },
                { f: NOTES.G3, d: 0.2, t: 1.5, type: 'triangle' },
                { f: NOTES.E3, d: 0.6, t: 1.75, type: 'triangle' },
                { f: 0, d: 0.2, t: 2.5 },
                { f: NOTES.C3, d: 0.2, t: 2.75, type: 'triangle' },
                { f: NOTES.E3, d: 0.2, t: 3.0, type: 'triangle' },
                { f: NOTES.G3, d: 0.2, t: 3.25, type: 'triangle' },
                { f: NOTES.C4, d: 0.6, t: 3.5, type: 'triangle' }
            ];
            loopDuration = 4.5;
            break;

        case 'orange': // Ragtime
            const oscT: OscillatorType = 'sawtooth';
            melody = [
                { f: NOTES.D4, d: 0.1, t: 0.0, type: oscT },
                { f: NOTES.E4, d: 0.1, t: 0.15, type: oscT },
                { f: NOTES.C4, d: 0.1, t: 0.3, type: oscT },
                { f: NOTES.A4, d: 0.2, t: 0.45, type: oscT },
                { f: NOTES.B4, d: 0.1, t: 0.7, type: oscT },
                { f: NOTES.G4, d: 0.1, t: 0.85, type: oscT },
                { f: NOTES.D4, d: 0.1, t: 1.0, type: oscT },
                { f: NOTES.E4, d: 0.1, t: 1.15, type: oscT },
                { f: NOTES.C4, d: 0.2, t: 1.3, type: oscT },
            ];
            loopDuration = 1.8;
            break;

        case 'tuxedo': // Baroque
            const sq: OscillatorType = 'square';
            melody = [
                { f: NOTES.G4, d: 0.1, t: 0.0, type: sq },
                { f: NOTES.D4, d: 0.1, t: 0.2, type: sq },
                { f: NOTES.G4, d: 0.1, t: 0.4, type: sq },
                { f: NOTES.B4, d: 0.1, t: 0.6, type: sq },
                { f: NOTES.D5, d: 0.1, t: 0.8, type: sq },
                { f: NOTES.B4, d: 0.1, t: 1.0, type: sq },
                { f: NOTES.G4, d: 0.1, t: 1.2, type: sq },
                { f: NOTES['F#4'], d: 0.1, t: 1.4, type: sq },
                { f: NOTES.A4, d: 0.1, t: 1.6, type: sq },
                { f: NOTES.D4, d: 0.1, t: 1.8, type: sq },
                { f: NOTES['F#4'], d: 0.1, t: 2.0, type: sq },
                { f: NOTES.A4, d: 0.1, t: 2.2, type: sq },
            ];
            loopDuration = 2.4;
            break;

        case 'siamese': // Oriental
            melody = [
                { f: NOTES.A4, d: 0.2, t: 0.0, type: 'sine' },
                { f: NOTES.B4, d: 0.2, t: 0.25, type: 'sine' },
                { f: NOTES.A4, d: 0.2, t: 0.5, type: 'sine' },
                { f: NOTES['F#4'], d: 0.2, t: 0.75, type: 'sine' },
                { f: NOTES.E4, d: 0.4, t: 1.0, type: 'sine' },
                { f: NOTES['F#4'], d: 0.2, t: 1.5, type: 'sine' },
                { f: NOTES.A4, d: 0.2, t: 1.75, type: 'sine' },
                { f: NOTES.B4, d: 0.4, t: 2.0, type: 'sine' },
            ];
            loopDuration = 2.6;
            break;

        case 'devon': // Quirky/Fast - Volume Boosted
            volumeMultiplier = 2.5; // Louder for Devon Rex!
            melody = [
                { f: NOTES.C4, d: 0.1, t: 0.0, type: 'triangle' },
                { f: NOTES.C5, d: 0.1, t: 0.15, type: 'triangle' },
                { f: NOTES.B4, d: 0.1, t: 0.3, type: 'triangle' },
                { f: NOTES.Bb4, d: 0.1, t: 0.45, type: 'triangle' },
                { f: NOTES.A4, d: 0.1, t: 0.6, type: 'triangle' },
                { f: NOTES['G#4'], d: 0.1, t: 0.75, type: 'triangle' },
                { f: NOTES.G4, d: 0.1, t: 0.9, type: 'triangle' },
                { f: NOTES.C4, d: 0.1, t: 1.05, type: 'triangle' },
            ];
            loopDuration = 1.3;
            break;

        case 'sphynx': // NEW: Unified, melodic, pleasant synth loop
            melody = [
                // Arpeggio E Major 7
                { f: NOTES.E4, d: 0.2, t: 0.0, type: 'sine' },
                { f: NOTES['G#4'], d: 0.2, t: 0.2, type: 'sine' },
                { f: NOTES.B4, d: 0.2, t: 0.4, type: 'sine' },
                { f: NOTES['D#5'], d: 0.4, t: 0.6, type: 'sine' },
                // Fall back
                { f: NOTES.B4, d: 0.2, t: 1.0, type: 'sine' },
                { f: NOTES['G#4'], d: 0.2, t: 1.2, type: 'sine' },
                // Low resolve
                { f: NOTES.E4, d: 0.6, t: 1.4, type: 'sine' },
                { f: 0, d: 0.2, t: 2.0 }, // Rest
            ];
            loopDuration = 2.2;
            break;

        case 'calico': // Playful
            melody = [
                { f: NOTES.C4, d: 0.15, t: 0.0 },
                { f: NOTES.E4, d: 0.15, t: 0.2 },
                { f: NOTES.G4, d: 0.15, t: 0.4 },
                { f: NOTES.C5, d: 0.3, t: 0.6 },
                { f: NOTES.A4, d: 0.15, t: 1.0 },
                { f: NOTES.F4, d: 0.15, t: 1.2 },
                { f: NOTES.D4, d: 0.3, t: 1.4 },
            ];
            loopDuration = 2.0;
            break;

        case 'tabby': // Standard
        default:
            melody = [
                { f: NOTES.C4, d: 0.3, t: 0.0 },
                { f: NOTES.D4, d: 0.3, t: 0.35 },
                { f: NOTES.E4, d: 0.3, t: 0.7 },
                { f: NOTES.F4, d: 0.3, t: 1.05 },
                { f: NOTES.G4, d: 0.6, t: 1.4 },
                { f: NOTES.G4, d: 0.6, t: 2.1 },
            ];
            loopDuration = 3.0;
            break;

        case 'maine_coon': // Majestic/Heavy
            const saw: OscillatorType = 'sawtooth';
            melody = [
                // Deep, powerful bass line
                { f: NOTES.C3, d: 0.4, t: 0.0, type: saw },
                { f: NOTES.G3, d: 0.4, t: 0.5, type: saw },
                { f: NOTES.C4, d: 0.8, t: 1.0, type: saw },
                { f: NOTES.E3, d: 0.4, t: 2.0, type: saw },
                { f: NOTES.A3, d: 0.4, t: 2.5, type: saw },
                { f: NOTES.E4, d: 0.8, t: 3.0, type: saw },
                { f: NOTES.F3, d: 0.4, t: 4.0, type: saw },
                { f: NOTES.C4, d: 0.4, t: 4.5, type: saw },
                { f: NOTES.F4, d: 0.8, t: 5.0, type: saw },
            ];
            loopDuration = 6.0;
            volumeMultiplier = 1.2;
            break;
    }

    const activeNodes: (OscillatorNode | GainNode)[] = [];
    
    const playLoop = () => {
        if (!this.ctx || !this.masterGain) return;
        const start = this.ctx.currentTime;
        
        melody.forEach(note => {
            // CRITICAL FIX: Explicit check for valid number to prevent "non-finite" errors
            if (typeof note.f !== 'number' || !isFinite(note.f)) return;
            if (note.f === 0) return; // Rest
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = note.type || 'sine';
            osc.frequency.value = note.f;
            
            let baseVolume = 0.08;
            if (osc.type === 'square' || osc.type === 'sawtooth') {
                baseVolume = 0.05; 
            }

            // Apply volume multiplier
            const finalVolume = baseVolume * volumeMultiplier;

            gain.gain.setValueAtTime(finalVolume, start + note.t);
            gain.gain.exponentialRampToValueAtTime(0.001, start + note.t + note.d);
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            
            osc.start(start + note.t);
            osc.stop(start + note.t + note.d + 0.1);
            
            activeNodes.push(osc);
            activeNodes.push(gain);
        });
    };

    playLoop();
    const intervalId = setInterval(playLoop, loopDuration * 1000);

    this.currentThemeOscillators = {
        stop: () => {
            clearInterval(intervalId);
            activeNodes.forEach(node => {
                try { node.disconnect(); } catch(e) {}
            });
        }
    };
  }

  // Get Pitch scalar based on Cat Type
  private getPitchForType(type: CatType): number {
    switch (type) {
        case 'white':
        case 'siamese':
            return 1.4; // High pitch, squeaky
        case 'black':
        case 'tuxedo':
        case 'sphynx':
        case 'maine_coon':
            return 0.7; // Low pitch, deep
        default:
            return 1.0; // Standard
    }
  }

  playVariedMeow(type: CatType) {
      const pitch = this.getPitchForType(type);
      // Add slight random variation to the base pitch
      const variation = 0.9 + Math.random() * 0.2; 
      this.playMeow(pitch * variation, 0.4);
  }

  playMeow(pitch = 1, duration = 0.4) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume(); // Ensure context is running

    if (!isFinite(pitch) || pitch <= 0) pitch = 1;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // SMOOTHER MEOW: Use Triangle instead of Sawtooth
    osc.type = 'triangle';
    
    // Pitch envelope: Start high, slide low (Standard meow contour)
    const startFreq = 600 * pitch;
    const endFreq = 300 * pitch;
    
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    
    // Volume Envelope: Attack -> Decay (Prevents clicking/harshness)
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05); // Soft attack
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); // Fade out
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPurr() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(28, this.ctx.currentTime); 
    
    gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.8);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  playTrill() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCaughtSound() {
    const r = Math.random();
    if (r < 0.25) {
      this.playPurr(); 
    } else if (r < 0.5) {
      this.playTrill(); 
    } else if (r < 0.75) {
      this.playMeow(0.8 + Math.random() * 0.4, 0.4); 
    } else {
      this.playMeow(1.5, 0.25); 
    }
  }

  playHiss() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playSplash() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playScratch() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playEat() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playCrack() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playWinAscending() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.15;
      const duration = 0.3;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }

  playFunnyEscape() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Comical Slide Whistle: Sine wave sliding up fast
    osc.type = 'sine'; // Sine is cleaner for a whistle
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    // Big slide up
    osc.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playFailDescending() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.5);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  playCatSinging() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const melody = [
        { f: 523.25, d: 0.2 }, 
        { f: 587.33, d: 0.2 }, 
        { f: 659.25, d: 0.2 }, 
        { f: 698.46, d: 0.4 }, 
        { f: 783.99, d: 0.6 }
    ];

    let t = now;
    melody.forEach(n => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);
        osc.frequency.linearRampToValueAtTime(n.f * 0.9, t + n.d);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + n.d);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + n.d + 0.1);
        t += n.d;
    });
  }

  playPop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    
    // Quick pitch drop for a "pop" sound
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playLoveSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    
    // "Bloop" / "Pop" sound
    // Start slightly lower and go high quickly
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playBouncingSequence() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    for(let i=0; i<3; i++) {
        const t = now + i * 0.4;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.4);
    }
  }

  startBGM(type: CatType) {
    this.playCatTheme(type);
  }
}

export const audio = new AudioService();