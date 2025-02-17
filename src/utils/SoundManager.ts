import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface SoundEffect {
  name: string;
  sound: Sound;
}

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, SoundEffect>;
  private backgroundMusic: Sound | null;
  private isMuted: boolean;
  private isInitialized: boolean = false;
  
  private constructor() {
    this.sounds = new Map();
    this.backgroundMusic = null;
    this.isMuted = false;
  }
  
  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
  
  loadSound(name: string, path: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const sound = new Sound(path, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`Failed to load sound ${name}:`, error);
            resolve();
            return;
          }
          
          this.sounds.set(name, { name, sound });
          resolve();
        });
      } catch (error) {
        console.warn(`Error creating sound ${name}:`, error);
        resolve();
      }
    });
  }
  
  playSound(name: string, volume: number = 1.0): void {
    if (this.isMuted) return;
    
    const soundEffect = this.sounds.get(name);
    if (soundEffect) {
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
    }
  }
  
  loadBackgroundMusic(path: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.backgroundMusic = new Sound(path, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn('Failed to load background music:', error);
            resolve();
            return;
          }
          this.isInitialized = true;
          resolve();
        });
      } catch (error) {
        console.warn('Error creating background music:', error);
        resolve();
      }
    });
  }
  
  playBackgroundMusic(volume: number = 0.5): void {
    if (this.isMuted || !this.backgroundMusic || !this.isInitialized) return;
    
    try {
      this.backgroundMusic.setVolume(volume);
      this.backgroundMusic.setNumberOfLoops(-1); // Loop indefinitely
      this.backgroundMusic.play((success) => {
        if (!success) {
          console.warn('Failed to play background music');
        }
      });
    } catch (error) {
      console.warn('Error playing background music:', error);
    }
  }
  
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }
  
  pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }
  
  resumeBackgroundMusic(): void {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.play();
    }
  }
  
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      this.resumeBackgroundMusic();
    }
  }
  
  isSoundMuted(): boolean {
    return this.isMuted;
  }
  
  // Clean up resources
  dispose(): void {
    this.sounds.forEach((soundEffect) => {
      soundEffect.sound.release();
    });
    this.sounds.clear();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.release();
      this.backgroundMusic = null;
    }
  }
} 