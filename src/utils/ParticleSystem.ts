import { Animated } from 'react-native';

interface Particle {
  id: number;
  position: Animated.ValueXY;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
  nextColor: string;
  lifetime: number;
  currentTime: number;
  velocity: { x: number; y: number };
  config: ParticleEmitterConfig;
  currentX: number;
  currentY: number;
  currentRotation: number;
  active: boolean;
  shape: 'circle' | 'square' | 'star' | 'diamond';
  turbulenceOffset: { x: number; y: number };
  lastCollisionTime: number;
  collisionCount: number;
  links: Set<number>;
  chainForce: { x: number; y: number };
  flockingForce: { x: number; y: number };
  branchParent: number | null;
  branchChildren: number[];
  branchLevel: number;
  segmentProgress: number;
}

export interface ParticleEmitterConfig {
  particleCount: number;
  particleLifetime: number;
  particleSpeed: number;
  particleSize: number;
  particleColors: string[];
  spread: number;
  gravity: number;
  shape?: 'circle' | 'square' | 'star' | 'diamond';
  colorTransition?: boolean;
  pulseScale?: boolean;
  turbulence?: number;
  attractionPoint?: { x: number; y: number; strength: number };
  repulsionPoints?: Array<{ x: number; y: number; radius: number; strength: number }>;
  collisionDamping?: number;
  bounceOffWalls?: boolean;
  emissionPattern?: 'burst' | 'vortex' | 'spiral' | 'wave' | 'circle';
  emissionOptions?: {
    radius?: number;
    frequency?: number;
    waveAmplitude?: number;
    spiralTightness?: number;
    vortexStrength?: number;
  };
  chainBehavior?: {
    enabled: boolean;
    maxLinks: number;
    linkDistance: number;
    linkWidth: number;
    linkColor: string;
    linkOpacity: number;
    elasticity: number;
    breakDistance: number;
  };
  flockingBehavior?: {
    enabled: boolean;
    separationRadius: number;
    separationForce: number;
    alignmentRadius: number;
    alignmentForce: number;
    cohesionRadius: number;
    cohesionForce: number;
    maxSpeed: number;
  };
  chainEffect?: {
    type: 'lightning' | 'web' | 'tentacles' | 'energy';
    branchProbability?: number;
    maxBranches?: number;
    segmentLength?: number;
    noiseScale?: number;
    thickness?: number;
    color?: string;
    glowColor?: string;
    glowIntensity?: number;
  };
}

interface ContinuousEmitter {
  id: number;
  x: number;
  y: number;
  config: ParticleEmitterConfig;
  interval: number;
  timeUntilNextEmit: number;
  active: boolean;
}

export class ParticleSystem {
  private static instance: ParticleSystem | null = null;
  private particles: Map<number, Particle>;
  private particlePool: Particle[];
  private continuousEmitters: Map<number, ContinuousEmitter>;
  private nextParticleId: number;
  private nextEmitterId: number;
  private maxParticles: number;
  private poolSize: number;
  private screenBounds: { width: number; height: number };

  private constructor() {
    this.particles = new Map();
    this.particlePool = [];
    this.continuousEmitters = new Map();
    this.nextParticleId = 0;
    this.nextEmitterId = 0;
    this.maxParticles = 500;
    this.poolSize = 1000;
    this.screenBounds = { width: 0, height: 0 };
    this.initializeParticlePool();
  }

  public static getInstance(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  private initializeParticlePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const particle: Particle = {
        id: i,
        position: new Animated.ValueXY({ x: 0, y: 0 }),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0),
        rotation: new Animated.Value(0),
        color: '#ffffff',
        nextColor: '#ffffff',
        lifetime: 0,
        currentTime: 0,
        velocity: { x: 0, y: 0 },
        config: ParticleEffects.ATTACK_IMPACT,
        currentX: 0,
        currentY: 0,
        currentRotation: 0,
        active: false,
        shape: 'circle',
        turbulenceOffset: { x: 0, y: 0 },
        lastCollisionTime: 0,
        collisionCount: 0,
        links: new Set(),
        chainForce: { x: 0, y: 0 },
        flockingForce: { x: 0, y: 0 },
        branchParent: null,
        branchChildren: [],
        branchLevel: 0,
        segmentProgress: 0
      };
      this.particlePool.push(particle);
    }
  }

  private getParticleFromPool(): Particle | null {
    // Check if we've reached the maximum active particles
    if (this.particles.size >= this.maxParticles) {
      return null;
    }

    // Get an inactive particle from the pool
    const particle = this.particlePool.find(p => !p.active);
    if (particle) {
      particle.active = true;
      return particle;
    }
    return null;
  }

  private resetParticle(particle: Particle): void {
    particle.active = false;
    particle.currentTime = 0;
    particle.scale.setValue(0);
    particle.opacity.setValue(0);
    particle.position.setValue({ x: 0, y: 0 });
    particle.rotation.setValue(0);
  }

  private getRandomColor(colors: string[]): string {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private interpolateColor(color1: string, color2: string, progress: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private applyEmissionPattern(particle: Particle, index: number, total: number, config: ParticleEmitterConfig): void {
    const options = config.emissionOptions || {};
    const baseAngle = (index / total) * Math.PI * 2;
    const radius = options.radius || 50;
    
    switch (config.emissionPattern) {
      case 'circle':
        particle.velocity = {
          x: Math.cos(baseAngle) * config.particleSpeed,
          y: Math.sin(baseAngle) * config.particleSpeed
        };
        break;
        
      case 'spiral':
        const spiralTightness = options.spiralTightness || 0.2;
        const spiralAngle = baseAngle + (particle.currentTime * spiralTightness);
        particle.velocity = {
          x: Math.cos(spiralAngle) * config.particleSpeed * (1 + index / total),
          y: Math.sin(spiralAngle) * config.particleSpeed * (1 + index / total)
        };
        break;
        
      case 'burst':
        const burstAngle = baseAngle + (Math.random() - 0.5) * 0.5;
        particle.velocity = {
          x: Math.cos(burstAngle) * config.particleSpeed * (1 + Math.random()),
          y: Math.sin(burstAngle) * config.particleSpeed * (1 + Math.random())
        };
        break;
        
      case 'wave':
        const waveAmplitude = options.waveAmplitude || 50;
        const frequency = options.frequency || 2;
        particle.velocity = {
          x: config.particleSpeed,
          y: Math.sin(baseAngle * frequency) * waveAmplitude
        };
        break;
        
      case 'vortex':
        const vortexStrength = options.vortexStrength || 1;
        const distance = radius * (index / total);
        const vortexAngle = baseAngle + (distance * vortexStrength);
        particle.velocity = {
          x: Math.cos(vortexAngle) * config.particleSpeed,
          y: Math.sin(vortexAngle) * config.particleSpeed
        };
        break;
    }
  }

  private updateParticleChains(): void {
    const processedLinks = new Set<string>();

    this.particles.forEach(particle => {
      const chainBehavior = particle.config.chainBehavior;
      if (!chainBehavior?.enabled) return;

      const { maxLinks, linkDistance, elasticity } = chainBehavior;
      
      // Find nearby particles to potentially link with
      this.particles.forEach(other => {
        if (particle.id === other.id) return;
        
        const linkId = `${Math.min(particle.id, other.id)}-${Math.max(particle.id, other.id)}`;
        if (processedLinks.has(linkId)) return;
        
        const dx = other.currentX - particle.currentX;
        const dy = other.currentY - particle.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= linkDistance && particle.links.size < maxLinks && other.links.size < maxLinks) {
          // Create new link
          if (!particle.links.has(other.id) && !other.links.has(particle.id)) {
            particle.links.add(other.id);
            other.links.add(particle.id);
          }

          // Apply chain forces
          const force = (distance - linkDistance) * elasticity;
          const forceX = (dx / distance) * force;
          const forceY = (dy / distance) * force;

          particle.chainForce.x += forceX;
          particle.chainForce.y += forceY;
          other.chainForce.x -= forceX;
          other.chainForce.y -= forceY;

          processedLinks.add(linkId);
        } else if (distance > linkDistance * chainBehavior.breakDistance) {
          // Break link if too far
          particle.links.delete(other.id);
          other.links.delete(particle.id);
        }
      });
    });
  }

  emitParticles(x: number, y: number, config: ParticleEmitterConfig): void {
    const actualParticleCount = Math.min(
      config.particleCount,
      this.maxParticles - this.particles.size
    );

    for (let i = 0; i < actualParticleCount; i++) {
      const particle = this.getParticleFromPool();
      if (!particle) break;

      // Reset and initialize particle
      particle.currentX = x;
      particle.currentY = y;
      particle.currentRotation = Math.random() * 360;
      particle.velocity = { x: 0, y: 0 };
      particle.config = config;
      particle.lifetime = config.particleLifetime;
      particle.color = this.getRandomColor(config.particleColors);
      particle.nextColor = config.colorTransition ? 
        this.getRandomColor(config.particleColors) : 
        particle.color;
      particle.shape = config.shape || 'circle';
      particle.turbulenceOffset = {
        x: (Math.random() - 0.5) * (config.turbulence || 0),
        y: (Math.random() - 0.5) * (config.turbulence || 0)
      };
      
      // Set initial values
      particle.position.setValue({ x, y });
      particle.scale.setValue(config.particleSize);
      particle.opacity.setValue(1);
      particle.rotation.setValue(particle.currentRotation);

      this.particles.set(particle.id, particle);

      // Use spring animation for more natural movement
      Animated.parallel([
        config.pulseScale ?
          Animated.sequence([
            Animated.spring(particle.scale, {
              toValue: config.particleSize * 1.5,
              friction: 3,
              tension: 40,
              useNativeDriver: true
            }),
            Animated.spring(particle.scale, {
              toValue: 0,
              friction: 5,
              tension: 40,
              useNativeDriver: true
            })
          ]) :
          Animated.spring(particle.scale, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true
          }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: config.particleLifetime,
          useNativeDriver: true
        })
      ]).start(() => {
        this.particles.delete(particle.id);
        this.resetParticle(particle);
      });

      // Apply emission pattern if specified
      if (config.emissionPattern) {
        this.applyEmissionPattern(particle, i, actualParticleCount, config);
      } else {
        // Use existing random angle emission
        const angle = (Math.random() * config.spread) - (config.spread / 2);
        const speed = config.particleSpeed * (0.5 + Math.random() * 0.5);
        particle.velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        };
      }
    }
  }

  startContinuousEmitter(x: number, y: number, config: ParticleEmitterConfig, interval: number): number {
    const emitterId = this.nextEmitterId++;
    this.continuousEmitters.set(emitterId, {
      id: emitterId,
      x,
      y,
      config,
      interval,
      timeUntilNextEmit: 0,
      active: true
    });
    return emitterId;
  }

  updateEmitterPosition(emitterId: number, x: number, y: number): void {
    const emitter = this.continuousEmitters.get(emitterId);
    if (emitter) {
      emitter.x = x;
      emitter.y = y;
    }
  }

  stopContinuousEmitter(emitterId: number): void {
    this.continuousEmitters.delete(emitterId);
  }

  setScreenBounds(width: number, height: number): void {
    this.screenBounds = { width, height };
  }

  private applyAttractionRepulsion(particle: Particle, deltaTime: number): { x: number; y: number } {
    let totalForceX = 0;
    let totalForceY = 0;

    // Apply attraction to point if configured
    if (particle.config.attractionPoint) {
      const { x, y, strength } = particle.config.attractionPoint;
      const dx = x - particle.currentX;
      const dy = y - particle.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = (strength * 1000) / (distance * distance);
        totalForceX += (dx / distance) * force;
        totalForceY += (dy / distance) * force;
      }
    }

    // Apply repulsion from points if configured
    if (particle.config.repulsionPoints) {
      particle.config.repulsionPoints.forEach(point => {
        const dx = particle.currentX - point.x;
        const dy = particle.currentY - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < point.radius) {
          const force = (point.strength * 1000) / Math.max(1, distance);
          totalForceX += (dx / distance) * force;
          totalForceY += (dy / distance) * force;
        }
      });
    }

    return { x: totalForceX * deltaTime, y: totalForceY * deltaTime };
  }

  private handleCollisions(particle: Particle, deltaTime: number): void {
    const damping = particle.config.collisionDamping || 0.8;
    const now = Date.now();
    const minTimeBetweenCollisions = 100; // ms

    // Check for collisions with other particles
    this.particles.forEach(other => {
      if (other.id === particle.id) return;

      const dx = other.currentX - particle.currentX;
      const dy = other.currentY - particle.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (particle.config.particleSize + other.config.particleSize) * 5;

      if (distance < minDistance && now - particle.lastCollisionTime > minTimeBetweenCollisions) {
        // Calculate collision response
        const angle = Math.atan2(dy, dx);
        const targetX = particle.currentX + Math.cos(angle) * minDistance;
        const targetY = particle.currentY + Math.sin(angle) * minDistance;

        // Apply collision response with damping
        particle.velocity.x = (targetX - particle.currentX) * damping;
        particle.velocity.y = (targetY - particle.currentY) * damping;
        particle.lastCollisionTime = now;
        particle.collisionCount++;

        // Emit collision particles if it's a significant collision
        if (Math.abs(particle.velocity.x) + Math.abs(particle.velocity.y) > 100) {
          this.emitCollisionParticles(
            (particle.currentX + other.currentX) / 2,
            (particle.currentY + other.currentY) / 2
          );
        }
      }
    });

    // Handle wall collisions if enabled
    if (particle.config.bounceOffWalls && this.screenBounds.width > 0) {
      const size = particle.config.particleSize * 5;
      
      if (particle.currentX < size) {
        particle.currentX = size;
        particle.velocity.x = Math.abs(particle.velocity.x) * damping;
      } else if (particle.currentX > this.screenBounds.width - size) {
        particle.currentX = this.screenBounds.width - size;
        particle.velocity.x = -Math.abs(particle.velocity.x) * damping;
      }

      if (particle.currentY < size) {
        particle.currentY = size;
        particle.velocity.y = Math.abs(particle.velocity.y) * damping;
      } else if (particle.currentY > this.screenBounds.height - size) {
        particle.currentY = this.screenBounds.height - size;
        particle.velocity.y = -Math.abs(particle.velocity.y) * damping;
      }
    }
  }

  private emitCollisionParticles(x: number, y: number): void {
    this.emitParticles(x, y, {
      particleCount: 5,
      particleLifetime: 300,
      particleSpeed: 100,
      particleSize: 0.5,
      particleColors: ['#ffffff', '#ffff00'],
      spread: Math.PI * 2,
      gravity: 0,
      colorTransition: true,
      pulseScale: true
    });
  }

  private applyFlockingBehavior(particle: Particle, deltaTime: number): { x: number; y: number } {
    if (!particle.config.flockingBehavior?.enabled) return { x: 0, y: 0 };

    const {
      separationRadius,
      separationForce,
      alignmentRadius,
      alignmentForce,
      cohesionRadius,
      cohesionForce,
      maxSpeed
    } = particle.config.flockingBehavior;

    let separationX = 0, separationY = 0;
    let alignmentX = 0, alignmentY = 0;
    let cohesionX = 0, cohesionY = 0;
    let separationCount = 0, alignmentCount = 0, cohesionCount = 0;

    // Calculate flocking forces from nearby particles
    this.particles.forEach(other => {
      if (other.id === particle.id) return;

      const dx = other.currentX - particle.currentX;
      const dy = other.currentY - particle.currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Separation
      if (distance < separationRadius) {
        separationX -= dx / distance;
        separationY -= dy / distance;
        separationCount++;
      }

      // Alignment
      if (distance < alignmentRadius) {
        alignmentX += other.velocity.x;
        alignmentY += other.velocity.y;
        alignmentCount++;
      }

      // Cohesion
      if (distance < cohesionRadius) {
        cohesionX += other.currentX;
        cohesionY += other.currentY;
        cohesionCount++;
      }
    });

    // Normalize and apply forces
    let totalForceX = 0;
    let totalForceY = 0;

    if (separationCount > 0) {
      totalForceX += (separationX / separationCount) * separationForce;
      totalForceY += (separationY / separationCount) * separationForce;
    }

    if (alignmentCount > 0) {
      totalForceX += (alignmentX / alignmentCount - particle.velocity.x) * alignmentForce;
      totalForceY += (alignmentY / alignmentCount - particle.velocity.y) * alignmentForce;
    }

    if (cohesionCount > 0) {
      const centerX = cohesionX / cohesionCount;
      const centerY = cohesionY / cohesionCount;
      totalForceX += (centerX - particle.currentX) * cohesionForce;
      totalForceY += (centerY - particle.currentY) * cohesionForce;
    }

    // Limit speed
    const speed = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      totalForceX *= scale;
      totalForceY *= scale;
    }

    return { x: totalForceX * deltaTime, y: totalForceY * deltaTime };
  }

  private updateChainEffects(particle: Particle, deltaTime: number): void {
    if (!particle.config.chainEffect) return;

    const {
      type,
      branchProbability = 0.2,
      maxBranches = 3,
      segmentLength = 30,
      noiseScale = 0.5
    } = particle.config.chainEffect;

    // Update segment progress
    particle.segmentProgress += deltaTime;

    // Create new branches
    if (particle.branchLevel < maxBranches && 
        particle.branchChildren.length < maxBranches && 
        Math.random() < branchProbability * deltaTime) {
      
      const branchParticle = this.getParticleFromPool();
      if (branchParticle) {
        // Initialize branch particle
        branchParticle.currentX = particle.currentX;
        branchParticle.currentY = particle.currentY;
        branchParticle.config = particle.config;
        branchParticle.branchParent = particle.id;
        branchParticle.branchLevel = particle.branchLevel + 1;
        
        // Add variation based on chain type
        switch (type) {
          case 'lightning':
            const angle = (Math.random() - 0.5) * Math.PI / 2;
            branchParticle.velocity = {
              x: Math.cos(angle) * particle.config.particleSpeed,
              y: Math.sin(angle) * particle.config.particleSpeed
            };
            break;
            
          case 'web':
            const webAngle = Math.random() * Math.PI * 2;
            branchParticle.velocity = {
              x: Math.cos(webAngle) * particle.config.particleSpeed * 0.5,
              y: Math.sin(webAngle) * particle.config.particleSpeed * 0.5
            };
            break;
            
          case 'tentacles':
            const wigglePhase = particle.currentTime * 5;
            const wiggleAmplitude = 20;
            branchParticle.velocity = {
              x: Math.cos(wigglePhase) * wiggleAmplitude,
              y: particle.config.particleSpeed * 0.7
            };
            break;
            
          case 'energy':
            const spiralAngle = particle.currentTime * 3;
            const spiralRadius = 30;
            branchParticle.velocity = {
              x: Math.cos(spiralAngle) * spiralRadius,
              y: Math.sin(spiralAngle) * spiralRadius
            };
            break;
        }

        particle.branchChildren.push(branchParticle.id);
        this.particles.set(branchParticle.id, branchParticle);
      }
    }

    // Apply noise to movement
    if (noiseScale > 0) {
      const noise = {
        x: (Math.random() - 0.5) * noiseScale * particle.config.particleSpeed,
        y: (Math.random() - 0.5) * noiseScale * particle.config.particleSpeed
      };
      particle.velocity.x += noise.x * deltaTime;
      particle.velocity.y += noise.y * deltaTime;
    }

    // Maintain connection with parent
    if (particle.branchParent !== null) {
      const parent = this.particles.get(particle.branchParent);
      if (parent) {
        const dx = parent.currentX - particle.currentX;
        const dy = parent.currentY - particle.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > segmentLength) {
          const factor = (distance - segmentLength) / distance;
          particle.currentX += dx * factor;
          particle.currentY += dy * factor;
        }
      }
    }
  }

  update(deltaTime: number): void {
    // Update particle chains
    this.updateParticleChains();

    // Update continuous emitters
    this.continuousEmitters.forEach(emitter => {
      if (emitter.active) {
        emitter.timeUntilNextEmit -= deltaTime;
        if (emitter.timeUntilNextEmit <= 0) {
          this.emitParticles(emitter.x, emitter.y, emitter.config);
          emitter.timeUntilNextEmit = emitter.interval;
        }
      }
    });

    // Update existing particles
    this.particles.forEach((particle: Particle) => {
      if (!particle.active) return;

      particle.currentTime += deltaTime;
      if (particle.currentTime >= particle.lifetime) {
        this.particles.delete(particle.id);
        this.resetParticle(particle);
        return;
      }

      // Calculate normalized progress
      const progress = particle.currentTime / particle.lifetime;
      const easeProgress = this.easeInOutQuad(progress);

      // Apply attraction/repulsion forces
      const forces = this.applyAttractionRepulsion(particle, deltaTime);

      // Apply turbulence
      const turbulencePhase = progress * Math.PI * 2;
      const turbX = Math.sin(turbulencePhase) * particle.turbulenceOffset.x;
      const turbY = Math.cos(turbulencePhase) * particle.turbulenceOffset.y;

      // Update position with all forces
      particle.currentX += (particle.velocity.x * deltaTime * (1 - easeProgress)) + turbX + forces.x;
      particle.currentY += ((particle.velocity.y + particle.config.gravity * easeProgress) * deltaTime) + turbY + forces.y;

      // Handle collisions
      this.handleCollisions(particle, deltaTime);
      
      // Update animated values
      particle.position.setValue({ 
        x: particle.currentX, 
        y: particle.currentY 
      });

      // Update rotation with easing
      const rotationSpeed = 180 * (1 - easeProgress);
      particle.currentRotation = (particle.currentRotation + deltaTime * rotationSpeed) % 360;
      particle.rotation.setValue(particle.currentRotation);

      // Update scale and opacity with easing
      const scale = particle.config.pulseScale ?
        particle.config.particleSize * (1 + Math.sin(progress * Math.PI * 4) * 0.2) * (1 - easeProgress) :
        particle.config.particleSize * (1 - easeProgress);
      
      particle.scale.setValue(scale);
      particle.opacity.setValue(1 - easeProgress);

      // Update color if transition is enabled
      if (particle.config.colorTransition) {
        particle.color = this.interpolateColor(particle.color, particle.nextColor, progress);
      }

      // Add chain forces to position update
      particle.currentX += particle.chainForce.x * deltaTime;
      particle.currentY += particle.chainForce.y * deltaTime;
      
      // Reset chain forces for next frame
      particle.chainForce = { x: 0, y: 0 };

      // Apply flocking behavior
      const flockingForces = this.applyFlockingBehavior(particle, deltaTime);
      particle.currentX += flockingForces.x;
      particle.currentY += flockingForces.y;

      // Update chain effects
      this.updateChainEffects(particle, deltaTime);
    });
  }

  // Easing function for smoother particle movement
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  clear(): void {
    this.particles.clear();
  }

  setMaxParticles(max: number): void {
    this.maxParticles = max;
  }

  getActiveParticleCount(): number {
    return this.particles.size;
  }

  // Add new method to get particle links for rendering
  getParticleLinks(): Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    width: number;
    opacity: number;
  }> {
    const links: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
      opacity: number;
    }> = [];
    
    const processedPairs = new Set<string>();

    this.particles.forEach(particle => {
      const chainBehavior = particle.config.chainBehavior;
      if (!chainBehavior?.enabled) return;

      particle.links.forEach(otherId => {
        const other = this.particles.get(otherId);
        if (!other) return;

        const linkId = `${Math.min(particle.id, otherId)}-${Math.max(particle.id, otherId)}`;
        if (processedPairs.has(linkId)) return;

        links.push({
          x1: particle.currentX,
          y1: particle.currentY,
          x2: other.currentX,
          y2: other.currentY,
          color: chainBehavior.linkColor,
          width: chainBehavior.linkWidth,
          opacity: chainBehavior.linkOpacity
        });

        processedPairs.add(linkId);
      });
    });

    return links;
  }

  // Add new method to get chain effect rendering data
  getChainEffects(): Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    thickness: number;
    glowColor: string;
    glowIntensity: number;
  }> {
    const chains: Array<{
      points: Array<{ x: number; y: number }>;
      color: string;
      thickness: number;
      glowColor: string;
      glowIntensity: number;
    }> = [];

    this.particles.forEach(particle => {
      if (!particle.config.chainEffect || particle.branchParent !== null) return;

      const chain = {
        points: [{ x: particle.currentX, y: particle.currentY }],
        color: particle.config.chainEffect.color || '#ffffff',
        thickness: particle.config.chainEffect.thickness || 2,
        glowColor: particle.config.chainEffect.glowColor || '#ffffff',
        glowIntensity: particle.config.chainEffect.glowIntensity || 0.5
      };

      // Recursively add branch points
      const addBranchPoints = (particleId: number) => {
        const current = this.particles.get(particleId);
        if (!current) return;

        chain.points.push({ x: current.currentX, y: current.currentY });
        current.branchChildren.forEach(addBranchPoints);
      };

      particle.branchChildren.forEach(addBranchPoints);
      chains.push(chain);
    });

    return chains;
  }
}

// Updated and new particle effect configurations
export const ParticleEffects: Record<string, ParticleEmitterConfig> = {
  ATTACK_IMPACT: {
    particleCount: 10,
    particleLifetime: 500,
    particleSpeed: 200,
    particleSize: 1,
    particleColors: ['#ff0000', '#ff6666', '#ffcccc'],
    spread: Math.PI,
    gravity: 300
  },
  DASH_TRAIL: {
    particleCount: 5,
    particleLifetime: 300,
    particleSpeed: 50,
    particleSize: 0.8,
    particleColors: ['#66ccff', '#99ddff', '#cceeff'],
    spread: Math.PI / 4,
    gravity: 0
  },
  JUMP_DUST: {
    particleCount: 8,
    particleLifetime: 400,
    particleSpeed: 100,
    particleSize: 0.6,
    particleColors: ['#cccccc', '#dddddd', '#eeeeee'],
    spread: Math.PI / 2,
    gravity: 100
  },
  ENERGY_BLAST: {
    particleCount: 15,
    particleLifetime: 600,
    particleSpeed: 250,
    particleSize: 1.2,
    particleColors: ['#ffff00', '#ffcc00', '#ff9900'],
    spread: Math.PI * 2,
    gravity: 0
  },
  ENEMY_DAMAGE: {
    particleCount: 6,
    particleLifetime: 400,
    particleSpeed: 150,
    particleSize: 0.7,
    particleColors: ['#ff4444', '#ff8888', '#ffcccc'],
    spread: Math.PI / 3,
    gravity: 200
  },
  ENEMY_DEATH: {
    particleCount: 20,
    particleLifetime: 800,
    particleSpeed: 300,
    particleSize: 1,
    particleColors: ['#ff0000', '#ff4444', '#ff8888', '#ffffff'],
    spread: Math.PI * 2,
    gravity: 100
  },
  LEVEL_UP: {
    particleCount: 30,
    particleLifetime: 1200,
    particleSpeed: 400,
    particleSize: 1.5,
    particleColors: ['#ffff00', '#00ff00', '#00ffff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -50 // Particles float upward
  },
  POWER_UP: {
    particleCount: 12,
    particleLifetime: 600,
    particleSpeed: 200,
    particleSize: 1,
    particleColors: ['#ff00ff', '#ff66ff', '#ffccff'],
    spread: Math.PI * 2,
    gravity: -100
  },
  LANDING_IMPACT: {
    particleCount: 12,
    particleLifetime: 500,
    particleSpeed: 150,
    particleSize: 0.8,
    particleColors: ['#bbbbbb', '#cccccc', '#dddddd'],
    spread: Math.PI,
    gravity: 50
  },
  HEALTH_PICKUP: {
    particleCount: 8,
    particleLifetime: 600,
    particleSpeed: 150,
    particleSize: 1,
    particleColors: ['#00ff00', '#66ff66', '#ccffcc'],
    spread: Math.PI * 2,
    gravity: -50
  },
  ENERGY_PICKUP: {
    particleCount: 8,
    particleLifetime: 600,
    particleSpeed: 150,
    particleSize: 1,
    particleColors: ['#0088ff', '#66aaff', '#cceeff'],
    spread: Math.PI * 2,
    gravity: -50
  },
  COMBO_HIT_1: {
    particleCount: 8,
    particleLifetime: 400,
    particleSpeed: 180,
    particleSize: 0.8,
    particleColors: ['#ff6600', '#ff8844', '#ffaa88'],
    spread: Math.PI * 0.8,
    gravity: 200
  },
  COMBO_HIT_2: {
    particleCount: 12,
    particleLifetime: 500,
    particleSpeed: 220,
    particleSize: 1,
    particleColors: ['#ff3300', '#ff6644', '#ff9988', '#ffcccc'],
    spread: Math.PI,
    gravity: 150
  },
  COMBO_HIT_3: {
    particleCount: 15,
    particleLifetime: 600,
    particleSpeed: 250,
    particleSize: 1.2,
    particleColors: ['#ff0000', '#ff4444', '#ff8888', '#ffcccc', '#ffffff'],
    spread: Math.PI * 1.2,
    gravity: 100
  },
  COMBO_FINISHER: {
    particleCount: 25,
    particleLifetime: 800,
    particleSpeed: 300,
    particleSize: 1.5,
    particleColors: [
      '#ff0000', '#ff3300', '#ff6600', '#ff9900',
      '#ffcc00', '#ffff00', '#ffffff'
    ],
    spread: Math.PI * 2,
    gravity: 50
  },
  COMBO_BREAK: {
    particleCount: 20,
    particleLifetime: 1000,
    particleSpeed: 200,
    particleSize: 1,
    particleColors: ['#666666', '#888888', '#aaaaaa', '#cccccc'],
    spread: Math.PI * 2,
    gravity: 100
  },
  FINISHER_CHARGE: {
    particleCount: 30,
    particleLifetime: 1000,
    particleSpeed: 100,
    particleSize: 1.2,
    particleColors: [
      '#ff0000', '#ff3300', '#ff6600', '#ff9900',
      '#ffcc00', '#ffff00', '#ffffff'
    ],
    spread: Math.PI * 2,
    gravity: -150 // Particles float upward around the player
  },
  FINISHER_IMPACT: {
    particleCount: 40,
    particleLifetime: 1200,
    particleSpeed: 400,
    particleSize: 1.8,
    particleColors: [
      '#ff0000', '#ff3300', '#ff6600', '#ff9900',
      '#ffcc00', '#ffff00', '#ffffff', '#ff00ff'
    ],
    spread: Math.PI * 2,
    gravity: -50
  },
  FINISHER_SHOCKWAVE: {
    particleCount: 60,
    particleLifetime: 800,
    particleSpeed: 500,
    particleSize: 1.5,
    particleColors: [
      '#ff0000', '#ff3300', '#ff6600', '#ff9900',
      '#ffcc00', '#ffff00', '#ffffff'
    ],
    spread: Math.PI * 2,
    gravity: 0
  },
  // Environmental Hazard Effects
  FIRE_PIT: {
    particleCount: 15,
    particleLifetime: 1000,
    particleSpeed: 150,
    particleSize: 1.2,
    particleColors: ['#ff0000', '#ff6600', '#ffcc00', '#ffff00'],
    spread: Math.PI / 2,
    gravity: -200 // Particles rise up
  },
  FIRE_DAMAGE: {
    particleCount: 20,
    particleLifetime: 600,
    particleSpeed: 200,
    particleSize: 1,
    particleColors: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00'],
    spread: Math.PI * 2,
    gravity: -100
  },
  ELECTRIC_FIELD: {
    particleCount: 10,
    particleLifetime: 400,
    particleSpeed: 300,
    particleSize: 0.8,
    particleColors: ['#00ffff', '#66ffff', '#99ffff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: 0
  },
  ELECTRIC_DAMAGE: {
    particleCount: 15,
    particleLifetime: 500,
    particleSpeed: 250,
    particleSize: 1,
    particleColors: ['#00ccff', '#33ddff', '#66eeff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: 0
  },
  TOXIC_ZONE: {
    particleCount: 12,
    particleLifetime: 1500,
    particleSpeed: 100,
    particleSize: 1.3,
    particleColors: ['#00ff00', '#33ff33', '#66ff66', '#99ff99'],
    spread: Math.PI * 2,
    gravity: -50
  },
  TOXIC_DAMAGE: {
    particleCount: 18,
    particleLifetime: 700,
    particleSpeed: 180,
    particleSize: 1.1,
    particleColors: ['#00cc00', '#33dd33', '#66ee66', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -80
  },
  SPIKE_TRAP: {
    particleCount: 8,
    particleLifetime: 400,
    particleSpeed: 200,
    particleSize: 0.9,
    particleColors: ['#888888', '#aaaaaa', '#cccccc', '#ffffff'],
    spread: Math.PI / 3,
    gravity: 150
  },
  SPIKE_DAMAGE: {
    particleCount: 12,
    particleLifetime: 500,
    particleSpeed: 220,
    particleSize: 1,
    particleColors: ['#666666', '#888888', '#aaaaaa', '#ff0000'],
    spread: Math.PI / 2,
    gravity: 200
  },
  // Hazard Combination Effects
  STEAM_CLOUD: {
    particleCount: 25,
    particleLifetime: 1200,
    particleSpeed: 120,
    particleSize: 1.4,
    particleColors: ['#ffffff', '#dddddd', '#bbbbbb', '#999999'],
    spread: Math.PI * 2,
    gravity: -100
  },
  PLASMA_FIELD: {
    particleCount: 30,
    particleLifetime: 800,
    particleSpeed: 350,
    particleSize: 1.3,
    particleColors: ['#ff00ff', '#ff66ff', '#ff99ff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -50
  },
  ACID_POOL: {
    particleCount: 20,
    particleLifetime: 1000,
    particleSpeed: 150,
    particleSize: 1.2,
    particleColors: ['#88ff00', '#aaff33', '#ccff66', '#ffffff'],
    spread: Math.PI,
    gravity: 50
  },
  LIGHTNING_STRIKE: {
    particleCount: 35,
    particleLifetime: 600,
    particleSpeed: 400,
    particleSize: 1.5,
    particleColors: ['#00ffff', '#66ffff', '#ffffff', '#ffff00'],
    spread: Math.PI / 4,
    gravity: 0
  },
  INFERNO: {
    particleCount: 40,
    particleLifetime: 1500,
    particleSpeed: 300,
    particleSize: 1.6,
    particleColors: ['#ff0000', '#ff6600', '#ffcc00', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -250
  },
  TOXIC_STORM: {
    particleCount: 45,
    particleLifetime: 1000,
    particleSpeed: 350,
    particleSize: 1.4,
    particleColors: ['#00ff00', '#66ff66', '#ffff00', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -150
  },
  // New hazard combination effects
  CRYO_STORM: {
    particleCount: 35,
    particleLifetime: 1800,
    particleSpeed: 280,
    particleSize: 1.4,
    particleColors: ['#00ccff', '#66ddff', '#99eeff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -50,
    flockingBehavior: {
      enabled: true,
      separationRadius: 40,
      separationForce: 2.2,
      alignmentRadius: 60,
      alignmentForce: 1.8,
      cohesionRadius: 100,
      cohesionForce: 1.4,
      maxSpeed: 320
    },
    chainEffect: {
      type: 'web',
      branchProbability: 0.35,
      maxBranches: 5,
      segmentLength: 30,
      noiseScale: 0.4,
      thickness: 2.5,
      color: '#66ddff',
      glowColor: '#ffffff',
      glowIntensity: 0.9
    },
    emissionPattern: 'burst',
    turbulence: 40
  },
  MAGMA_ERUPTION: {
    particleCount: 40,
    particleLifetime: 2200,
    particleSpeed: 300,
    particleSize: 1.6,
    particleColors: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffffff'],
    spread: Math.PI * 1.5,
    gravity: -200,
    flockingBehavior: {
      enabled: true,
      separationRadius: 35,
      separationForce: 2,
      alignmentRadius: 55,
      alignmentForce: 1.6,
      cohesionRadius: 90,
      cohesionForce: 1.2,
      maxSpeed: 350
    },
    chainEffect: {
      type: 'energy',
      branchProbability: 0.4,
      maxBranches: 4,
      segmentLength: 35,
      noiseScale: 0.6,
      thickness: 3,
      color: '#ff6600',
      glowColor: '#ffff00',
      glowIntensity: 1
    },
    emissionPattern: 'vortex',
    emissionOptions: {
      radius: 70,
      vortexStrength: 1.8
    }
  },
  QUANTUM_RIFT: {
    particleCount: 32,
    particleLifetime: 2500,
    particleSpeed: 260,
    particleSize: 1.5,
    particleColors: ['#9933ff', '#cc66ff', '#ff99ff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -30,
    flockingBehavior: {
      enabled: true,
      separationRadius: 45,
      separationForce: 1.8,
      alignmentRadius: 70,
      alignmentForce: 1.5,
      cohesionRadius: 110,
      cohesionForce: 1.1,
      maxSpeed: 290
    },
    chainEffect: {
      type: 'tentacles',
      branchProbability: 0.3,
      maxBranches: 6,
      segmentLength: 40,
      noiseScale: 0.5,
      thickness: 2.8,
      color: '#cc66ff',
      glowColor: '#ffffff',
      glowIntensity: 0.85
    },
    emissionPattern: 'spiral',
    emissionOptions: {
      radius: 80,
      spiralTightness: 0.4
    },
    colorTransition: true
  },
  STORM_SURGE: {
    particleCount: 38,
    particleLifetime: 2000,
    particleSpeed: 320,
    particleSize: 1.4,
    particleColors: ['#0066ff', '#00ccff', '#ffffff', '#66ffff'],
    spread: Math.PI * 2,
    gravity: -100,
    flockingBehavior: {
      enabled: true,
      separationRadius: 35,
      separationForce: 2.4,
      alignmentRadius: 65,
      alignmentForce: 1.9,
      cohesionRadius: 95,
      cohesionForce: 1.5,
      maxSpeed: 380
    },
    chainEffect: {
      type: 'lightning',
      branchProbability: 0.45,
      maxBranches: 5,
      segmentLength: 30,
      noiseScale: 0.7,
      thickness: 2.5,
      color: '#00ccff',
      glowColor: '#ffffff',
      glowIntensity: 0.95
    },
    emissionPattern: 'wave',
    emissionOptions: {
      waveAmplitude: 70,
      frequency: 2.5
    },
    turbulence: 60
  },
  VOID_RUPTURE: {
    particleCount: 42,
    particleLifetime: 2400,
    particleSpeed: 290,
    particleSize: 1.5,
    particleColors: ['#660066', '#990099', '#cc00cc', '#ff00ff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -40,
    flockingBehavior: {
      enabled: true,
      separationRadius: 40,
      separationForce: 2.1,
      alignmentRadius: 75,
      alignmentForce: 1.7,
      cohesionRadius: 115,
      cohesionForce: 1.3,
      maxSpeed: 310
    },
    chainEffect: {
      type: 'tentacles',
      branchProbability: 0.35,
      maxBranches: 7,
      segmentLength: 35,
      noiseScale: 0.8,
      thickness: 3,
      color: '#cc00cc',
      glowColor: '#ff00ff',
      glowIntensity: 0.9
    },
    emissionPattern: 'vortex',
    emissionOptions: {
      radius: 90,
      vortexStrength: 2.2
    },
    colorTransition: true,
    pulseScale: true
  },
  // New effects with flocking behavior
  ENERGY_SWARM: {
    particleCount: 30,
    particleLifetime: 1500,
    particleSpeed: 200,
    particleSize: 1.2,
    particleColors: ['#ffff00', '#ffcc00', '#ff9900', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -50,
    flockingBehavior: {
      enabled: true,
      separationRadius: 30,
      separationForce: 2,
      alignmentRadius: 50,
      alignmentForce: 1.5,
      cohesionRadius: 100,
      cohesionForce: 1,
      maxSpeed: 300
    }
  },
  SPIRIT_WISPS: {
    particleCount: 20,
    particleLifetime: 2000,
    particleSpeed: 150,
    particleSize: 1.5,
    particleColors: ['#00ffff', '#66ffff', '#99ffff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -30,
    flockingBehavior: {
      enabled: true,
      separationRadius: 40,
      separationForce: 1.5,
      alignmentRadius: 80,
      alignmentForce: 1,
      cohesionRadius: 120,
      cohesionForce: 0.8,
      maxSpeed: 200
    }
  },
  // New effects with chain behavior
  LIGHTNING_STRIKE_CHAIN: {
    particleCount: 1,
    particleLifetime: 800,
    particleSpeed: 500,
    particleSize: 1.5,
    particleColors: ['#00ffff', '#66ffff', '#ffffff'],
    spread: Math.PI / 4,
    gravity: 0,
    chainEffect: {
      type: 'lightning',
      branchProbability: 0.3,
      maxBranches: 4,
      segmentLength: 25,
      noiseScale: 0.8,
      thickness: 3,
      color: '#00ffff',
      glowColor: '#ffffff',
      glowIntensity: 0.8
    }
  },
  ENERGY_WEB: {
    particleCount: 1,
    particleLifetime: 2000,
    particleSpeed: 150,
    particleSize: 1,
    particleColors: ['#ff00ff', '#ff66ff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: 0,
    chainEffect: {
      type: 'web',
      branchProbability: 0.4,
      maxBranches: 6,
      segmentLength: 40,
      noiseScale: 0.3,
      thickness: 2,
      color: '#ff00ff',
      glowColor: '#ff99ff',
      glowIntensity: 0.6
    }
  },
  VOID_TENTACLES: {
    particleCount: 3,
    particleLifetime: 1500,
    particleSpeed: 200,
    particleSize: 1.2,
    particleColors: ['#660066', '#990099', '#cc00cc'],
    spread: Math.PI / 2,
    gravity: 100,
    chainEffect: {
      type: 'tentacles',
      branchProbability: 0.2,
      maxBranches: 3,
      segmentLength: 35,
      noiseScale: 0.6,
      thickness: 4,
      color: '#990099',
      glowColor: '#ff00ff',
      glowIntensity: 0.7
    }
  },
  ENERGY_SPIRAL: {
    particleCount: 1,
    particleLifetime: 1200,
    particleSpeed: 300,
    particleSize: 1.3,
    particleColors: ['#ffff00', '#ff9900', '#ff0000'],
    spread: Math.PI * 2,
    gravity: -50,
    chainEffect: {
      type: 'energy',
      branchProbability: 0.25,
      maxBranches: 5,
      segmentLength: 30,
      noiseScale: 0.4,
      thickness: 3,
      color: '#ffcc00',
      glowColor: '#ffffff',
      glowIntensity: 0.9
    },
    emissionPattern: 'spiral',
    emissionOptions: {
      radius: 60,
      spiralTightness: 0.5
    }
  },
  // Combined effects with both flocking and chain behaviors
  SPIRIT_STORM: {
    particleCount: 15,
    particleLifetime: 2000,
    particleSpeed: 250,
    particleSize: 1.4,
    particleColors: ['#00ffff', '#66ffff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -40,
    flockingBehavior: {
      enabled: true,
      separationRadius: 35,
      separationForce: 1.8,
      alignmentRadius: 60,
      alignmentForce: 1.2,
      cohesionRadius: 100,
      cohesionForce: 0.9,
      maxSpeed: 250
    },
    chainEffect: {
      type: 'lightning',
      branchProbability: 0.2,
      maxBranches: 2,
      segmentLength: 30,
      noiseScale: 0.5,
      thickness: 2,
      color: '#00ffff',
      glowColor: '#ffffff',
      glowIntensity: 0.7
    },
    emissionPattern: 'burst'
  },
  // New specialized combination effects
  PHOENIX_WINGS: {
    particleCount: 25,
    particleLifetime: 2000,
    particleSpeed: 200,
    particleSize: 1.4,
    particleColors: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffffff'],
    spread: Math.PI * 0.5,
    gravity: -30,
    flockingBehavior: {
      enabled: true,
      separationRadius: 25,
      separationForce: 1.8,
      alignmentRadius: 45,
      alignmentForce: 1.3,
      cohesionRadius: 80,
      cohesionForce: 0.9,
      maxSpeed: 280
    },
    chainEffect: {
      type: 'energy',
      branchProbability: 0.3,
      maxBranches: 3,
      segmentLength: 35,
      noiseScale: 0.4,
      thickness: 3,
      color: '#ff6600',
      glowColor: '#ffff00',
      glowIntensity: 0.8
    }
  },
  FROST_NOVA: {
    particleCount: 20,
    particleLifetime: 1800,
    particleSpeed: 280,
    particleSize: 1.3,
    particleColors: ['#00ccff', '#66ddff', '#99eeff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: 0,
    flockingBehavior: {
      enabled: true,
      separationRadius: 30,
      separationForce: 2.2,
      alignmentRadius: 55,
      alignmentForce: 1.6,
      cohesionRadius: 90,
      cohesionForce: 1.2,
      maxSpeed: 320
    },
    chainEffect: {
      type: 'web',
      branchProbability: 0.35,
      maxBranches: 4,
      segmentLength: 30,
      noiseScale: 0.3,
      thickness: 2,
      color: '#66ddff',
      glowColor: '#ffffff',
      glowIntensity: 0.9
    }
  },
  VOID_VORTEX: {
    particleCount: 30,
    particleLifetime: 2500,
    particleSpeed: 220,
    particleSize: 1.5,
    particleColors: ['#660066', '#990099', '#cc00cc', '#ff00ff'],
    spread: Math.PI * 2,
    gravity: -20,
    flockingBehavior: {
      enabled: true,
      separationRadius: 35,
      separationForce: 1.5,
      alignmentRadius: 70,
      alignmentForce: 1.8,
      cohesionRadius: 110,
      cohesionForce: 1.4,
      maxSpeed: 260
    },
    chainEffect: {
      type: 'tentacles',
      branchProbability: 0.25,
      maxBranches: 5,
      segmentLength: 40,
      noiseScale: 0.7,
      thickness: 3,
      color: '#cc00cc',
      glowColor: '#ff00ff',
      glowIntensity: 0.7
    },
    emissionPattern: 'vortex',
    emissionOptions: {
      radius: 80,
      vortexStrength: 2
    }
  },
  NATURE_GROWTH: {
    particleCount: 18,
    particleLifetime: 3000,
    particleSpeed: 150,
    particleSize: 1.2,
    particleColors: ['#00cc00', '#33dd33', '#66ee66', '#99ff99'],
    spread: Math.PI * 0.7,
    gravity: -10,
    flockingBehavior: {
      enabled: true,
      separationRadius: 40,
      separationForce: 1.2,
      alignmentRadius: 65,
      alignmentForce: 0.9,
      cohesionRadius: 95,
      cohesionForce: 0.7,
      maxSpeed: 180
    },
    chainEffect: {
      type: 'web',
      branchProbability: 0.4,
      maxBranches: 6,
      segmentLength: 45,
      noiseScale: 0.5,
      thickness: 2,
      color: '#33dd33',
      glowColor: '#99ff99',
      glowIntensity: 0.6
    },
    emissionPattern: 'spiral',
    emissionOptions: {
      radius: 60,
      spiralTightness: 0.3
    }
  },
  THUNDER_STORM: {
    particleCount: 35,
    particleLifetime: 1600,
    particleSpeed: 300,
    particleSize: 1.4,
    particleColors: ['#0066ff', '#00ccff', '#ffffff', '#ffff00'],
    spread: Math.PI * 1.5,
    gravity: 50,
    flockingBehavior: {
      enabled: true,
      separationRadius: 30,
      separationForce: 2.5,
      alignmentRadius: 50,
      alignmentForce: 2,
      cohesionRadius: 85,
      cohesionForce: 1.5,
      maxSpeed: 350
    },
    chainEffect: {
      type: 'lightning',
      branchProbability: 0.45,
      maxBranches: 4,
      segmentLength: 25,
      noiseScale: 0.9,
      thickness: 3,
      color: '#00ccff',
      glowColor: '#ffffff',
      glowIntensity: 1
    },
    emissionPattern: 'burst',
    turbulence: 50
  },
  MYSTIC_PORTALS: {
    particleCount: 22,
    particleLifetime: 2200,
    particleSpeed: 240,
    particleSize: 1.3,
    particleColors: ['#9933ff', '#cc66ff', '#ff99ff', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -15,
    flockingBehavior: {
      enabled: true,
      separationRadius: 35,
      separationForce: 1.7,
      alignmentRadius: 60,
      alignmentForce: 1.4,
      cohesionRadius: 100,
      cohesionForce: 1.1,
      maxSpeed: 270
    },
    chainEffect: {
      type: 'energy',
      branchProbability: 0.3,
      maxBranches: 3,
      segmentLength: 35,
      noiseScale: 0.6,
      thickness: 2.5,
      color: '#cc66ff',
      glowColor: '#ffffff',
      glowIntensity: 0.85
    },
    emissionPattern: 'circle',
    emissionOptions: {
      radius: 70
    },
    colorTransition: true
  },
  CELESTIAL_DANCE: {
    particleCount: 28,
    particleLifetime: 2800,
    particleSpeed: 260,
    particleSize: 1.6,
    particleColors: ['#ffcc00', '#ff9900', '#ff6600', '#ffffff'],
    spread: Math.PI * 2,
    gravity: -25,
    flockingBehavior: {
      enabled: true,
      separationRadius: 45,
      separationForce: 1.6,
      alignmentRadius: 75,
      alignmentForce: 1.3,
      cohesionRadius: 120,
      cohesionForce: 1,
      maxSpeed: 290
    },
    chainEffect: {
      type: 'energy',
      branchProbability: 0.35,
      maxBranches: 4,
      segmentLength: 40,
      noiseScale: 0.5,
      thickness: 3,
      color: '#ffcc00',
      glowColor: '#ffffff',
      glowIntensity: 0.9
    },
    emissionPattern: 'wave',
    emissionOptions: {
      waveAmplitude: 60,
      frequency: 3
    },
    pulseScale: true
  }
}; 