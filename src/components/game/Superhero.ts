import { Animated } from 'react-native';
import { Character, CharacterStats } from './Character';

interface SuperPower {
  name: string;
  damage: number;
  cooldown: number;
  range: number;
  energyCost: number;
  animation: string;
}

interface SuperheroStats extends CharacterStats {
  energy: number;
  energyRegenRate: number;
  superPowers: SuperPower[];
}

interface ComboRewards {
  healthRegen: number;
  energyBoost: number;
  damageMultiplier: number;
  finisherUnlocked: boolean;
}

interface ComboState {
  count: number;
  lastHitTime: number;
  timeWindow: number;
  multiplier: number;
  rewards: ComboRewards;
}

export class Superhero extends Character {
  private energy: number;
  private maxEnergy: number;
  private energyRegenRate: number;
  private superPowers: SuperPower[];
  private powerCooldowns: Map<string, number>;
  private combo: ComboState;
  private isFinisherAvailable: boolean;
  
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    stats: SuperheroStats
  ) {
    super(x, y, width, height, stats, 'hero');
    
    this.energy = stats.energy;
    this.maxEnergy = stats.energy;
    this.energyRegenRate = stats.energyRegenRate;
    this.superPowers = stats.superPowers;
    this.powerCooldowns = new Map();
    
    // Initialize combo state with rewards
    this.combo = {
      count: 0,
      lastHitTime: 0,
      timeWindow: 2000,
      multiplier: 1,
      rewards: {
        healthRegen: 0,
        energyBoost: 0,
        damageMultiplier: 1,
        finisherUnlocked: false
      }
    };
    
    this.isFinisherAvailable = false;
    
    // Initialize cooldowns
    this.superPowers.forEach(power => {
      this.powerCooldowns.set(power.name, 0);
    });
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Regenerate energy over time
    this.energy = Math.min(
      this.maxEnergy,
      this.energy + (this.energyRegenRate + this.combo.rewards.energyBoost) * deltaTime
    );
    
    // Apply combo health regeneration
    if (this.combo.rewards.healthRegen > 0) {
      this.stats.health = Math.min(
        100, // Max health
        this.stats.health + this.combo.rewards.healthRegen * deltaTime
      );
    }
    
    // Update power cooldowns
    this.powerCooldowns.forEach((cooldown, powerName) => {
      if (cooldown > 0) {
        this.powerCooldowns.set(powerName, Math.max(0, cooldown - deltaTime));
      }
    });

    // Update combo state
    const currentTime = Date.now();
    if (currentTime - this.combo.lastHitTime > this.combo.timeWindow) {
      this.resetCombo();
    }
  }
  
  useSuperPower(powerName: string): boolean {
    const power = this.superPowers.find(p => p.name === powerName);
    if (!power) return false;
    
    const cooldown = this.powerCooldowns.get(powerName) || 0;
    if (cooldown > 0) return false;
    
    if (this.energy < power.energyCost) return false;
    
    // Use the power
    this.energy -= power.energyCost;
    this.powerCooldowns.set(powerName, power.cooldown);
    this.state.currentAnimation = power.animation;
    
    // Perform power animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(this.scale, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(this.rotation, {
          toValue: this.direction === 'right' ? 360 : -360,
          duration: 500,
          useNativeDriver: true
        })
      ]),
      Animated.timing(this.scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      this.state.currentAnimation = 'idle';
    });
    
    return true;
  }
  
  // Special movement abilities
  dash(): void {
    if (this.energy >= 20) {
      this.energy -= 20;
      const dashDistance = 200;
      const dashDuration = 200;
      
      Animated.timing(this.position.x, {
        toValue: this.x + (this.direction === 'right' ? dashDistance : -dashDistance),
        duration: dashDuration,
        useNativeDriver: true
      }).start();
    }
  }
  
  hover(): void {
    if (this.energy >= 10) {
      this.energy -= 10;
      this.state.isJumping = true;
      
      Animated.sequence([
        Animated.timing(this.position.y, {
          toValue: this.y - 150,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.delay(1000),
        Animated.timing(this.position.y, {
          toValue: this.y,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(() => {
        this.state.isJumping = false;
      });
    }
  }
  
  attack(): void {
    if (!this.state.isAttacking) {
      super.attack();
      
      // Update combo multiplier based on combo count
      if (this.combo.count >= 10) {
        this.combo.multiplier = 2.0;
      } else if (this.combo.count >= 6) {
        this.combo.multiplier = 1.5;
      } else if (this.combo.count >= 3) {
        this.combo.multiplier = 1.25;
      }
    }
  }

  registerHit(): void {
    this.combo.count++;
    this.combo.lastHitTime = Date.now();
    
    // Update combo rewards based on count
    if (this.combo.count >= 15) {
      this.combo.rewards = {
        healthRegen: 5,
        energyBoost: 15,
        damageMultiplier: 2.5,
        finisherUnlocked: true
      };
    } else if (this.combo.count >= 10) {
      this.combo.rewards = {
        healthRegen: 3,
        energyBoost: 10,
        damageMultiplier: 2.0,
        finisherUnlocked: true
      };
    } else if (this.combo.count >= 6) {
      this.combo.rewards = {
        healthRegen: 2,
        energyBoost: 5,
        damageMultiplier: 1.5,
        finisherUnlocked: false
      };
    } else if (this.combo.count >= 3) {
      this.combo.rewards = {
        healthRegen: 1,
        energyBoost: 2,
        damageMultiplier: 1.25,
        finisherUnlocked: false
      };
    } else {
      this.combo.rewards = {
        healthRegen: 0,
        energyBoost: 0,
        damageMultiplier: 1,
        finisherUnlocked: false
      };
    }

    this.isFinisherAvailable = this.combo.rewards.finisherUnlocked;
  }

  resetCombo(): void {
    this.combo = {
      count: 0,
      lastHitTime: 0,
      timeWindow: 2000,
      multiplier: 1,
      rewards: {
        healthRegen: 0,
        energyBoost: 0,
        damageMultiplier: 1,
        finisherUnlocked: false
      }
    };
    this.isFinisherAvailable = false;
  }

  performFinisher(): boolean {
    if (!this.isFinisherAvailable || this.energy < 50) {
      return false;
    }

    this.energy -= 50;
    this.state.isAttacking = true;
    this.setAnimation('finisher');

    // Perform finisher animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(this.scale, {
          toValue: 2,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(this.rotation, {
          toValue: this.direction === 'right' ? 720 : -720,
          duration: 600,
          useNativeDriver: true
        })
      ]),
      Animated.timing(this.scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      this.state.isAttacking = false;
      this.setAnimation('idle');
      this.isFinisherAvailable = false;
    });

    return true;
  }

  getCurrentDamage(): number {
    return this.stats.strength * this.combo.rewards.damageMultiplier;
  }

  isFinisherReady(): boolean {
    return this.isFinisherAvailable && this.energy >= 50;
  }

  getComboState(): ComboState {
    return { ...this.combo };
  }
  
  // Getters
  getEnergy(): number {
    return this.energy;
  }
  
  getMaxEnergy(): number {
    return this.maxEnergy;
  }
  
  getSuperPowers(): SuperPower[] {
    return [...this.superPowers];
  }
  
  getPowerCooldown(powerName: string): number {
    return this.powerCooldowns.get(powerName) || 0;
  }
} 