import { Animated } from 'react-native';
import { ParticleSystem, ParticleEffects, ParticleEmitterConfig } from '../../utils/ParticleSystem';

export type HazardType = 'fire' | 'electric' | 'toxic' | 'spike';

interface HazardStats {
  damage: number;
  radius: number;
  tickRate: number; // How often the hazard deals damage (in milliseconds)
  duration?: number; // Optional duration for temporary hazards
  isActive: boolean;
  combinedWith?: HazardType;
}

interface HazardCombination {
  types: [HazardType, HazardType];
  effect: keyof typeof ParticleEffects;
  damage: number;
  radius: number;
  tickRate: number;
}

const HAZARD_COMBINATIONS: HazardCombination[] = [
  {
    types: ['fire', 'electric'],
    effect: 'STORM_SURGE',
    damage: 35,
    radius: 150,
    tickRate: 300
  },
  {
    types: ['fire', 'toxic'],
    effect: 'MAGMA_ERUPTION',
    damage: 25,
    radius: 180,
    tickRate: 500
  },
  {
    types: ['electric', 'toxic'],
    effect: 'QUANTUM_RIFT',
    damage: 30,
    radius: 200,
    tickRate: 400
  },
  {
    types: ['fire', 'spike'],
    effect: 'VOID_RUPTURE',
    damage: 40,
    radius: 130,
    tickRate: 250
  },
  {
    types: ['electric', 'spike'],
    effect: 'CRYO_STORM',
    damage: 45,
    radius: 100,
    tickRate: 200
  },
  {
    types: ['toxic', 'spike'],
    effect: 'NATURE_GROWTH',
    damage: 35,
    radius: 160,
    tickRate: 350
  },
  {
    types: ['fire', 'fire'],
    effect: 'PHOENIX_WINGS',
    damage: 50,
    radius: 140,
    tickRate: 250
  },
  {
    types: ['electric', 'electric'],
    effect: 'THUNDER_STORM',
    damage: 55,
    radius: 170,
    tickRate: 200
  },
  {
    types: ['toxic', 'toxic'],
    effect: 'VOID_VORTEX',
    damage: 45,
    radius: 190,
    tickRate: 300
  },
  {
    types: ['spike', 'spike'],
    effect: 'MYSTIC_PORTALS',
    damage: 60,
    radius: 120,
    tickRate: 150
  }
];

export class EnvironmentalHazard {
  private position: { x: number; y: number };
  private type: HazardType;
  private stats: HazardStats;
  private particleSystem: ParticleSystem;
  private emitterId: number | null;
  private lastDamageTime: number;
  private creationTime: number;
  private combinedHazard: EnvironmentalHazard | null = null;
  private combinationEmitterId: number | null = null;
  private interactionEmitterId: number | null = null;
  private lastInteractionTime: number = 0;
  private nearbyHazards: Set<EnvironmentalHazard> = new Set();
  private threeWayInteractionEmitterId: number | null = null;
  private lastThreeWayInteractionTime: number = 0;
  private getNearbyHazardsImpl: (() => EnvironmentalHazard[]) | null = null;

  constructor(
    x: number,
    y: number,
    type: HazardType,
    stats: Partial<HazardStats> = {}
  ) {
    this.position = { x, y };
    this.type = type;
    this.particleSystem = ParticleSystem.getInstance();
    this.emitterId = null;
    this.lastDamageTime = 0;
    this.creationTime = Date.now();

    // Set default stats based on hazard type
    this.stats = {
      damage: stats.damage || this.getDefaultDamage(),
      radius: stats.radius || this.getDefaultRadius(),
      tickRate: stats.tickRate || this.getDefaultTickRate(),
      duration: stats.duration,
      isActive: true
    };

    this.initializeHazard();
  }

  private getDefaultDamage(): number {
    switch (this.type) {
      case 'fire': return 15;
      case 'electric': return 20;
      case 'toxic': return 10;
      case 'spike': return 25;
      default: return 10;
    }
  }

  private getDefaultRadius(): number {
    switch (this.type) {
      case 'fire': return 100;
      case 'electric': return 120;
      case 'toxic': return 150;
      case 'spike': return 80;
      default: return 100;
    }
  }

  private getDefaultTickRate(): number {
    switch (this.type) {
      case 'fire': return 500;
      case 'electric': return 400;
      case 'toxic': return 1000;
      case 'spike': return 200;
      default: return 500;
    }
  }

  private getHazardParticleEffect(): keyof typeof ParticleEffects {
    // Check if this hazard is part of a combination
    if (this.stats.combinedWith) {
      const combination = this.findCombination(this.type, this.stats.combinedWith);
      if (combination) {
        return combination.effect;
      }
    }

    // Default effects
    switch (this.type) {
      case 'fire': return 'FIRE_PIT';
      case 'electric': return 'ELECTRIC_FIELD';
      case 'toxic': return 'TOXIC_ZONE';
      case 'spike': return 'SPIKE_TRAP';
      default: return 'FIRE_PIT';
    }
  }

  private getDamageParticleEffect(): keyof typeof ParticleEffects {
    // Check if this hazard is part of a combination
    if (this.stats.combinedWith) {
      const combination = this.findCombination(this.type, this.stats.combinedWith);
      if (combination) {
        return combination.effect;
      }
    }

    // Default damage effects
    switch (this.type) {
      case 'fire': return 'FIRE_DAMAGE';
      case 'electric': return 'ELECTRIC_DAMAGE';
      case 'toxic': return 'TOXIC_DAMAGE';
      case 'spike': return 'SPIKE_DAMAGE';
      default: return 'FIRE_DAMAGE';
    }
  }

  private findCombination(type1: HazardType, type2: HazardType): HazardCombination | undefined {
    return HAZARD_COMBINATIONS.find(
      combo => (combo.types[0] === type1 && combo.types[1] === type2) ||
               (combo.types[0] === type2 && combo.types[1] === type1)
    );
  }

  private initializeHazard(): void {
    // Start continuous particle emission for the hazard
    this.emitterId = this.particleSystem.startContinuousEmitter(
      this.position.x,
      this.position.y,
      ParticleEffects[this.getHazardParticleEffect()],
      100 // Emit particles every 100ms
    );
  }

  update(deltaTime: number): void {
    if (!this.stats.isActive) return;

    // Check if temporary hazard should expire
    if (this.stats.duration) {
      const elapsedTime = Date.now() - this.creationTime;
      if (elapsedTime >= this.stats.duration) {
        this.deactivate();
        return;
      }
    }

    // Update particle emitter position
    const emitter = this.combinationEmitterId !== null ? 
                   this.combinationEmitterId : 
                   this.emitterId;
    
    if (emitter !== null) {
      this.particleSystem.updateEmitterPosition(
        emitter,
        this.position.x,
        this.position.y
      );
    }

    // Check for interactions with other hazards
    this.checkHazardInteractions();
  }

  private checkHazardInteractions(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastInteractionTime < 1000) return;

    const nearbyHazards = this.getNearbyHazards();
    this.nearbyHazards = new Set(nearbyHazards);
    
    // Check for three-way interactions first
    this.checkThreeWayInteractions();

    // Then check for two-way interactions
    nearbyHazards.forEach(other => {
      if (other === this || !other.stats.isActive) return;

      const distance = Math.sqrt(
        Math.pow(this.position.x - other.getPosition().x, 2) +
        Math.pow(this.position.y - other.getPosition().y, 2)
      );

      if (distance > 50 && distance < 200) {
        this.createInteractionEffect(other, distance);
      }
    });
  }

  private checkThreeWayInteractions(): void {
    if (!this.isCombined() || this.nearbyHazards.size < 2) return;

    const currentTime = Date.now();
    if (currentTime - this.lastThreeWayInteractionTime < 1500) return;

    // Find all possible three-way combinations
    const combinations: EnvironmentalHazard[][] = [];
    this.nearbyHazards.forEach(hazard1 => {
      if (!hazard1.isCombined()) return;
      
      this.nearbyHazards.forEach(hazard2 => {
        if (hazard2 === hazard1 || !hazard2.isCombined()) return;
        
        const effect = this.getThreeWayInteractionEffect([this, hazard1, hazard2]);
        if (effect) {
          combinations.push([hazard1, hazard2]);
        }
      });
    });

    // Create the most powerful combination effect
    if (combinations.length > 0) {
      const [hazard1, hazard2] = combinations[0];
      this.createThreeWayInteractionEffect([this, hazard1, hazard2]);
    }
  }

  private createThreeWayInteractionEffect(hazards: EnvironmentalHazard[]): void {
    const effect = this.getThreeWayInteractionEffect(hazards);
    if (!effect) return;

    // Calculate center point of all three hazards
    const centerX = hazards.reduce((sum, h) => sum + h.position.x, 0) / hazards.length;
    const centerY = hazards.reduce((sum, h) => sum + h.position.y, 0) / hazards.length;

    // Calculate average distance from center
    const avgDistance = hazards.reduce((sum, h) => {
      const dx = h.position.x - centerX;
      const dy = h.position.y - centerY;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0) / hazards.length;

    // Stop previous three-way effect if exists
    if (this.threeWayInteractionEmitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.threeWayInteractionEmitterId);
    }

    // Create enhanced effect based on the combination
    const baseEffect = ParticleEffects[effect];
    const enhancedEffect: ParticleEmitterConfig = {
      ...baseEffect,
      particleCount: Math.floor(baseEffect.particleCount * 1.5),
      particleLifetime: baseEffect.particleLifetime * 1.2,
      particleSpeed: baseEffect.particleSpeed * 1.3,
      particleSize: baseEffect.particleSize * 1.2,
      emissionPattern: 'vortex',
      emissionOptions: {
        radius: avgDistance,
        vortexStrength: 2.5
      },
      turbulence: (baseEffect.turbulence || 30) * 1.5,
      flockingBehavior: baseEffect.flockingBehavior ? {
        ...baseEffect.flockingBehavior,
        maxSpeed: baseEffect.flockingBehavior.maxSpeed * 1.3,
        cohesionForce: baseEffect.flockingBehavior.cohesionForce * 1.5
      } : undefined,
      chainEffect: baseEffect.chainEffect ? {
        ...baseEffect.chainEffect,
        maxBranches: (baseEffect.chainEffect.maxBranches || 3) + 2,
        glowIntensity: (baseEffect.chainEffect.glowIntensity || 0.5) * 1.5
      } : undefined
    };

    this.threeWayInteractionEmitterId = this.particleSystem.startContinuousEmitter(
      centerX,
      centerY,
      enhancedEffect,
      150
    );

    this.lastThreeWayInteractionTime = Date.now();

    // Apply additional effects to each hazard
    hazards.forEach(hazard => {
      hazard.stats.damage *= 1.5;
      hazard.stats.radius *= 1.2;
    });
  }

  private getThreeWayInteractionEffect(hazards: EnvironmentalHazard[]): keyof typeof ParticleEffects | null {
    const effects = hazards.map(h => h.getHazardParticleEffect()).sort();
    const key = effects.join('_');

    const threeWayEffects: Record<string, keyof typeof ParticleEffects> = {
      'STORM_SURGE_MAGMA_ERUPTION_QUANTUM_RIFT': 'CELESTIAL_DANCE',
      'MAGMA_ERUPTION_VOID_RUPTURE_QUANTUM_RIFT': 'VOID_VORTEX',
      'NATURE_GROWTH_STORM_SURGE_VOID_RUPTURE': 'SPIRIT_STORM',
      'PHOENIX_WINGS_STORM_SURGE_VOID_RUPTURE': 'ENERGY_SPIRAL',
      'MAGMA_ERUPTION_MYSTIC_PORTALS_VOID_RUPTURE': 'VOID_TENTACLES'
    };

    return threeWayEffects[key] || null;
  }

  private createInteractionEffect(other: EnvironmentalHazard, distance: number): void {
    const midX = (this.position.x + other.getPosition().x) / 2;
    const midY = (this.position.y + other.getPosition().y) / 2;

    // Different interaction effects based on hazard types
    if (this.isCombined() && other.isCombined()) {
      // Create special effects between combined hazards
      const effect = this.getInteractionEffect(other);
      if (effect) {
        if (this.interactionEmitterId !== null) {
          this.particleSystem.stopContinuousEmitter(this.interactionEmitterId);
        }

        // Calculate interaction strength based on distance
        const normalizedDistance = (200 - distance) / 150; // 1.0 at 50 units, 0.0 at 200 units
        const interactionStrength = Math.max(0, Math.min(1, normalizedDistance));

        // Create interaction effect with modified parameters based on strength
        const baseEffect = ParticleEffects[effect];
        const modifiedEffect: ParticleEmitterConfig = {
          ...baseEffect,
          particleCount: Math.floor(baseEffect.particleCount * interactionStrength),
          particleSpeed: baseEffect.particleSpeed * interactionStrength,
          particleSize: baseEffect.particleSize * (0.5 + interactionStrength * 0.5)
        };

        // Add turbulence based on interaction strength
        if (!modifiedEffect.turbulence) {
          modifiedEffect.turbulence = 30 * interactionStrength;
        }

        this.interactionEmitterId = this.particleSystem.startContinuousEmitter(
          midX,
          midY,
          modifiedEffect,
          200
        );

        this.lastInteractionTime = Date.now();
      }
    }
  }

  private getInteractionEffect(other: EnvironmentalHazard): keyof typeof ParticleEffects | null {
    const thisEffect = this.getHazardParticleEffect();
    const otherEffect = other.getHazardParticleEffect();

    // Define special interactions between different combination effects
    const interactions: Record<string, Record<string, keyof typeof ParticleEffects>> = {
      'STORM_SURGE': {
        'MAGMA_ERUPTION': 'CELESTIAL_DANCE',
        'QUANTUM_RIFT': 'SPIRIT_STORM',
        'VOID_RUPTURE': 'ENERGY_SPIRAL',
        'NATURE_GROWTH': 'SPIRIT_WISPS',
        'PHOENIX_WINGS': 'THUNDER_STORM'
      },
      'MAGMA_ERUPTION': {
        'QUANTUM_RIFT': 'VOID_TENTACLES',
        'VOID_RUPTURE': 'PHOENIX_WINGS',
        'NATURE_GROWTH': 'VOID_VORTEX',
        'MYSTIC_PORTALS': 'ENERGY_SWARM'
      },
      'QUANTUM_RIFT': {
        'VOID_RUPTURE': 'ENERGY_WEB',
        'NATURE_GROWTH': 'MYSTIC_PORTALS',
        'PHOENIX_WINGS': 'LIGHTNING_STRIKE_CHAIN'
      },
      'VOID_RUPTURE': {
        'NATURE_GROWTH': 'VOID_TENTACLES',
        'MYSTIC_PORTALS': 'VOID_VORTEX'
      },
      'NATURE_GROWTH': {
        'MYSTIC_PORTALS': 'ENERGY_WEB'
      }
    };

    return interactions[thisEffect]?.[otherEffect] || 
           interactions[otherEffect]?.[thisEffect] || 
           null;
  }

  getNearbyHazards(): EnvironmentalHazard[] {
    return this.getNearbyHazardsImpl ? this.getNearbyHazardsImpl() : [];
  }

  setNearbyHazardsImpl(impl: () => EnvironmentalHazard[]): void {
    this.getNearbyHazardsImpl = impl;
  }

  checkCollision(targetPosition: { x: number; y: number }): boolean {
    if (!this.stats.isActive) return false;

    const distance = Math.sqrt(
      Math.pow(this.position.x - targetPosition.x, 2) +
      Math.pow(this.position.y - targetPosition.y, 2)
    );

    return distance <= this.stats.radius;
  }

  applyDamage(target: { takeDamage: (amount: number) => void; getPosition: () => { x: number; y: number } }): void {
    if (!this.stats.isActive) return;

    const currentTime = Date.now();
    if (currentTime - this.lastDamageTime >= this.stats.tickRate) {
      const targetPosition = target.getPosition();
      
      if (this.checkCollision(targetPosition)) {
        target.takeDamage(this.stats.damage);
        this.lastDamageTime = currentTime;

        // Create damage particles at the target's position
        this.particleSystem.emitParticles(
          targetPosition.x,
          targetPosition.y,
          ParticleEffects[this.getDamageParticleEffect()]
        );
      }
    }
  }

  deactivate(): void {
    this.stats.isActive = false;
    
    if (this.emitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.emitterId);
      this.emitterId = null;
    }
    
    if (this.combinationEmitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.combinationEmitterId);
      this.combinationEmitterId = null;
    }

    if (this.interactionEmitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.interactionEmitterId);
      this.interactionEmitterId = null;
    }

    if (this.threeWayInteractionEmitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.threeWayInteractionEmitterId);
      this.threeWayInteractionEmitterId = null;
    }

    if (this.combinedHazard) {
      this.combinedHazard.deactivate();
      this.combinedHazard = null;
    }

    this.stats.combinedWith = undefined;
    this.nearbyHazards.clear();
  }

  activate(): void {
    this.stats.isActive = true;
    this.initializeHazard();
  }

  getPosition(): { x: number; y: number } {
    return { ...this.position };
  }

  getStats(): HazardStats {
    return { ...this.stats };
  }

  getType(): HazardType {
    return this.type;
  }

  setPosition(x: number, y: number): void {
    this.position = { x, y };
  }

  tryToCombineWith(other: EnvironmentalHazard): boolean {
    if (!this.stats.isActive || !other.stats.isActive) return false;
    if (this.stats.combinedWith || other.stats.combinedWith) return false;

    const combination = this.findCombination(this.type, other.getType());
    if (!combination) return false;

    // Calculate the midpoint between the two hazards
    const midX = (this.position.x + other.getPosition().x) / 2;
    const midY = (this.position.y + other.getPosition().y) / 2;

    // Update stats based on combination
    this.stats.damage = combination.damage;
    this.stats.radius = combination.radius;
    this.stats.tickRate = combination.tickRate;
    this.stats.combinedWith = other.getType();

    // Update position to midpoint
    this.setPosition(midX, midY);

    // Stop individual hazard effects
    if (this.emitterId !== null) {
      this.particleSystem.stopContinuousEmitter(this.emitterId);
    }
    if (other.emitterId !== null) {
      this.particleSystem.stopContinuousEmitter(other.emitterId);
    }

    // Start combination effect
    this.combinationEmitterId = this.particleSystem.startContinuousEmitter(
      midX,
      midY,
      ParticleEffects[combination.effect],
      100
    );

    // Store reference to combined hazard
    this.combinedHazard = other;
    
    // Deactivate the other hazard
    other.deactivate();

    return true;
  }

  isCombined(): boolean {
    return this.stats.combinedWith !== undefined;
  }

  getCombinedType(): HazardType | undefined {
    return this.stats.combinedWith;
  }
} 