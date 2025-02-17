import { Animated } from 'react-native';
import { SpriteManager } from '../../utils/SpriteManager';

export interface CharacterStats {
  health: number;
  speed: number;
  strength: number;
  defense: number;
}

export interface CharacterState {
  isMoving: boolean;
  isJumping: boolean;
  isAttacking: boolean;
  isDamaged: boolean;
  isBlocking: boolean;
  currentAnimation: string;
}

export class Character {
  // Position and movement
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public zIndex: number;
  
  // Animation values
  protected position: Animated.ValueXY;
  protected scale: Animated.Value;
  protected rotation: Animated.Value;
  
  // Character properties
  protected stats: CharacterStats;
  protected state: CharacterState;
  protected direction: 'left' | 'right';
  protected spriteManager: SpriteManager;
  protected spriteName: string;
  
  constructor(x: number, y: number, width: number, height: number, stats: CharacterStats, spriteName: string) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.zIndex = 1;
    
    // Initialize animation values
    this.position = new Animated.ValueXY({ x, y });
    this.scale = new Animated.Value(1);
    this.rotation = new Animated.Value(0);
    
    // Set initial stats
    this.stats = stats;
    
    // Set initial state
    this.state = {
      isMoving: false,
      isJumping: false,
      isAttacking: false,
      isDamaged: false,
      isBlocking: false,
      currentAnimation: 'idle'
    };
    
    this.direction = 'right';
    this.spriteManager = SpriteManager.getInstance();
    this.spriteName = spriteName;
  }
  
  // Movement methods
  move(dx: number, dy: number): void {
    this.x += dx * this.stats.speed;
    this.y += dy * this.stats.speed;
    
    this.position.setValue({ x: this.x, y: this.y });
    this.direction = dx < 0 ? 'left' : dx > 0 ? 'right' : this.direction;
    this.state.isMoving = dx !== 0 || dy !== 0;
    
    // Update animation based on movement
    if (this.state.isMoving && !this.state.isJumping && !this.state.isAttacking) {
      this.setAnimation('walk');
    } else if (!this.state.isJumping && !this.state.isAttacking) {
      this.setAnimation('idle');
    }
  }
  
  jump(): void {
    if (!this.state.isJumping) {
      this.state.isJumping = true;
      this.setAnimation('jump');
      
      Animated.sequence([
        Animated.timing(this.position.y, {
          toValue: this.y - 100,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(this.position.y, {
          toValue: this.y,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        this.state.isJumping = false;
        this.setAnimation(this.state.isMoving ? 'walk' : 'idle');
      });
    }
  }
  
  // Combat methods
  attack(): void {
    if (!this.state.isAttacking) {
      this.state.isAttacking = true;
      this.setAnimation('attack');
      
      // Attack animation
      Animated.sequence([
        Animated.timing(this.rotation, {
          toValue: this.direction === 'right' ? 45 : -45,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(this.rotation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start(() => {
        this.state.isAttacking = false;
        this.setAnimation(this.state.isMoving ? 'walk' : 'idle');
      });
    }
  }
  
  takeDamage(amount: number): void {
    if (!this.state.isBlocking) {
      const actualDamage = Math.max(0, amount - this.stats.defense);
      this.stats.health -= actualDamage;
      
      this.state.isDamaged = true;
      
      // Damage animation
      Animated.sequence([
        Animated.timing(this.scale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(this.scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start(() => {
        this.state.isDamaged = false;
      });
    }
  }
  
  block(): void {
    this.state.isBlocking = true;
    this.setAnimation('block');
  }
  
  unblock(): void {
    this.state.isBlocking = false;
    this.setAnimation('idle');
  }
  
  // Animation methods
  protected setAnimation(animationName: string): void {
    this.state.currentAnimation = animationName;
    this.spriteManager.setAnimation(this.spriteName, animationName);
  }
  
  // Getters
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
  
  getStats(): CharacterStats {
    return { ...this.stats };
  }
  
  getState(): CharacterState {
    return { ...this.state };
  }
  
  getDirection(): 'left' | 'right' {
    return this.direction;
  }
  
  getCurrentSprite() {
    return this.spriteManager.getCurrentSprite(this.spriteName);
  }
  
  // Animation values for rendering
  getAnimatedStyle() {
    return {
      transform: [
        { translateX: this.position.x },
        { translateY: this.position.y },
        { scale: this.scale },
        { rotate: this.rotation.interpolate({
          inputRange: [-360, 360],
          outputRange: ['-360deg', '360deg']
        })}
      ],
      ...this.spriteManager.getSpriteStyle(this.spriteName, this.direction)
    };
  }

  update(deltaTime: number): void {
    // Update sprite animations
    this.spriteManager.update(deltaTime);
  }
} 