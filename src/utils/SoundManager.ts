import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface SoundEffect {
  name: string;
  sound: Sound | null;
}

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, SoundEffect>;
  private backgroundMusic: Sound | null;
  private isMuted: boolean;
  private isInitialized: boolean = false;
  private loadingPromises: Map<string, Promise<void>>;
  
  private constructor() {
    this.sounds = new Map();
    this.backgroundMusic = null;
    this.isMuted = false;
    this.loadingPromises = new Map();
  }
  
  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
  
  loadSound(name: string, path: any): Promise<void> {
    // Check if already loading this sound
    const existingPromise = this.loadingPromises.get(name);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = new Promise<void>((resolve) => {
      try {
        // For now, just store a null sound since we're using placeholders
        this.sounds.set(name, { name, sound: null });
        this.loadingPromises.delete(name);
        resolve();
      } catch (error) {
        console.warn(`Error creating sound ${name}:`, error);
        this.loadingPromises.delete(name);
        resolve();
      }
    });

    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }
  
  playSound(name: string, volume: number = 1.0): void {
    if (this.isMuted) return;
    
    const soundEffect = this.sounds.get(name);
    if (soundEffect && soundEffect.sound) {
      try {
        soundEffect.sound.setVolume(volume);
        soundEffect.sound.play((success) => {
          if (!success) {
            console.warn(`Failed to play sound ${name}`);
          }
        });
      } catch (error) {
        console.warn(`Error playing sound ${name}:`, error);
      }
    } else {
      // For now, just log that we would play the sound
      console.log(`[Sound Effect] Playing ${name} at volume ${volume}`);
    }
  }
  
  loadBackgroundMusic(path: any): Promise<void> {
    // If already loading, return existing promise
    if (this.loadingPromises.get('bgm')) {
      return this.loadingPromises.get('bgm')!;
    }

    const loadPromise = new Promise<void>((resolve) => {
      try {
        if (this.backgroundMusic) {
          this.backgroundMusic.release();
          this.backgroundMusic = null;
        }

        // For now, just mark as initialized since we're using placeholders
        this.isInitialized = true;
        this.loadingPromises.delete('bgm');
        resolve();
      } catch (error) {
        console.warn('Error creating background music:', error);
        this.loadingPromises.delete('bgm');
        resolve();
      }
    });

    this.loadingPromises.set('bgm', loadPromise);
    return loadPromise;
  }
  
  playBackgroundMusic(volume: number = 0.5): void {
    if (this.isMuted) {
      console.log('[Background Music] Muted');
      return;
    }
    
    if (!this.isInitialized) {
      console.warn('Cannot play background music: not initialized');
      return;
    }

    // For now, just log that we would play the background music
    console.log(`[Background Music] Playing at volume ${volume}`);
  }
  
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    console.log('[Background Music] Stopped');
  }
  
  pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
    console.log('[Background Music] Paused');
  }
  
  resumeBackgroundMusic(): void {
    if (this.isMuted) {
      console.log('[Background Music] Cannot resume: muted');
      return;
    }
    
    if (this.backgroundMusic) {
      this.backgroundMusic.play();
    }
    console.log('[Background Music] Resumed');
  }
  
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      this.resumeBackgroundMusic();
    }
    console.log(`[Sound System] Muted: ${muted}`);
  }
  
  isSoundMuted(): boolean {
    return this.isMuted;
  }
  
  // Clean up resources
  dispose(): void {
    this.sounds.forEach((soundEffect) => {
      if (soundEffect.sound) {
        soundEffect.sound.release();
      }
    });
    this.sounds.clear();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.release();
      this.backgroundMusic = null;
    }
  }

  // Add method to check loading status
  isLoading(): boolean {
    return this.loadingPromises.size > 0;
  }

  // Add method to get loading progress
  getLoadingProgress(): number {
    const total = this.sounds.size + (this.backgroundMusic ? 1 : 0);
    const loaded = this.loadingPromises.size;
    return total === 0 ? 0 : (loaded / total);
  }
} 