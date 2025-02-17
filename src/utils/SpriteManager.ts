import { ImageSourcePropType, ImageStyle } from 'react-native';

interface SpriteFrame {
  source: ImageSourcePropType;
  duration: number;
}

interface SpriteAnimation {
  name: string;
  frames: SpriteFrame[];
  loop: boolean;
}

interface SpriteSheet {
  name: string;
  animations: { [key: string]: SpriteAnimation };
  currentAnimation?: string;
}

export class SpriteManager {
  private static instance: SpriteManager;
  private spriteSheets: Map<string, SpriteSheet>;
  private currentFrame: Map<string, number>;
  private animationTimers: Map<string, number>;
  
  private constructor() {
    this.spriteSheets = new Map();
    this.currentFrame = new Map();
    this.animationTimers = new Map();
  }
  
  static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }
  
  loadSpriteSheet(name: string, spriteSheet: SpriteSheet): void {
    this.spriteSheets.set(name, spriteSheet);
    this.currentFrame.set(name, 0);
    this.animationTimers.set(name, 0);
  }
  
  update(deltaTime: number): void {
    this.spriteSheets.forEach((spriteSheet, name) => {
      const currentAnimation = spriteSheet.animations[this.getCurrentAnimation(name)];
      if (!currentAnimation) return;
      
      const timer = (this.animationTimers.get(name) || 0) + deltaTime;
      this.animationTimers.set(name, timer);
      
      const currentFrameIndex = this.currentFrame.get(name) || 0;
      const frame = currentAnimation.frames[currentFrameIndex];
      
      if (timer >= frame.duration) {
        this.animationTimers.set(name, 0);
        const nextFrame = currentFrameIndex + 1;
        
        if (nextFrame >= currentAnimation.frames.length) {
          this.currentFrame.set(name, currentAnimation.loop ? 0 : currentAnimation.frames.length - 1);
        } else {
          this.currentFrame.set(name, nextFrame);
        }
      }
    });
  }
  
  getCurrentSprite(name: string): ImageSourcePropType | null {
    const spriteSheet = this.spriteSheets.get(name);
    if (!spriteSheet) return null;
    
    const currentAnimation = spriteSheet.animations[this.getCurrentAnimation(name)];
    if (!currentAnimation) return null;
    
    const currentFrameIndex = this.currentFrame.get(name) || 0;
    return currentAnimation.frames[currentFrameIndex].source;
  }
  
  getCurrentAnimation(name: string): string {
    const spriteSheet = this.spriteSheets.get(name);
    if (!spriteSheet) return 'idle';
    
    return spriteSheet.currentAnimation || 'idle';
  }
  
  setAnimation(name: string, animationName: string): void {
    const spriteSheet = this.spriteSheets.get(name);
    if (!spriteSheet) return;
    
    if (spriteSheet.animations[animationName] && spriteSheet.currentAnimation !== animationName) {
      spriteSheet.currentAnimation = animationName;
      this.currentFrame.set(name, 0);
      this.animationTimers.set(name, 0);
    }
  }
  
  getSpriteStyle(name: string, direction: 'left' | 'right'): ImageStyle {
    return {
      transform: [
        { scaleX: direction === 'left' ? -1 : 1 }
      ]
    };
  }
  
  dispose(): void {
    this.spriteSheets.clear();
    this.currentFrame.clear();
    this.animationTimers.clear();
  }
} 