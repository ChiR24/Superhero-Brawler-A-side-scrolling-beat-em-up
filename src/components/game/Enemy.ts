import { Animated } from 'react-native';
import { Character, CharacterStats } from './Character';

interface EnemyBehavior {
  attackRange: number;
  detectionRange: number;
  movementPattern: 'chase' | 'patrol' | 'ambush';
  attackPattern: 'melee' | 'ranged' | 'mixed';
}

interface EnemyStats extends CharacterStats {
  experienceValue: number;
  behavior: EnemyBehavior;
}

export class Enemy extends Character {
  private experienceValue: number;
  private behavior: EnemyBehavior;
  private targetPosition: { x: number; y: number } | null;
  private patrolPoints: { x: number; y: number }[];
  private currentPatrolIndex: number;
  private enemyType: 'minion' | 'ranged' | 'elite';
  
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    stats: EnemyStats,
    type: 'minion' | 'ranged' | 'elite' = 'minion'
  ) {
    super(x, y, width, height, stats, `enemy.${type}`);
    
    this.experienceValue = stats.experienceValue;
    this.behavior = stats.behavior;
    this.targetPosition = null;
    this.patrolPoints = this.generatePatrolPoints();
    this.currentPatrolIndex = 0;
    this.enemyType = type;
  }
  
  private generatePatrolPoints(): { x: number; y: number }[] {
    // Generate patrol points based on spawn position
    const points = [];
    const patrolRadius = 200;
    
    // Create a circular patrol pattern
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2; // 4 points around a circle
      points.push({
        x: this.x + Math.cos(angle) * patrolRadius,
        y: this.y + Math.sin(angle) * patrolRadius
      });
    }
    
    return points;
  }
  
  update(deltaTime: number, playerPosition: { x: number; y: number }): void {
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerPosition.x - this.x, 2) +
      Math.pow(playerPosition.y - this.y, 2)
    );
    
    // Update behavior based on distance to player
    if (distanceToPlayer <= this.behavior.detectionRange) {
      // Player detected - switch to chase behavior
      this.targetPosition = playerPosition;
      
      if (distanceToPlayer <= this.behavior.attackRange) {
        // Within attack range - perform attack
        this.attack();
      }
    } else if (this.behavior.movementPattern === 'patrol') {
      // Continue patrol pattern
      this.targetPosition = this.patrolPoints[this.currentPatrolIndex];
      
      // Check if we've reached the current patrol point
      const distanceToTarget = Math.sqrt(
        Math.pow(this.targetPosition.x - this.x, 2) +
        Math.pow(this.targetPosition.y - this.y, 2)
      );
      
      if (distanceToTarget < 10) {
        // Move to next patrol point
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
    }
    
    // Move towards target if one exists
    if (this.targetPosition) {
      const dx = this.targetPosition.x - this.x;
      const dy = this.targetPosition.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const moveX = (dx / distance) * this.stats.speed * deltaTime;
        const moveY = (dy / distance) * this.stats.speed * deltaTime;
        this.move(moveX, moveY);
      }
    }
  }
  
  attack(): void {
    if (!this.state.isAttacking) {
      super.attack();
      
      // Additional enemy-specific attack behavior
      if (this.behavior.attackPattern === 'ranged') {
        this.performRangedAttack();
      } else if (this.behavior.attackPattern === 'mixed') {
        Math.random() > 0.5 ? this.performRangedAttack() : super.attack();
      }
    }
  }
  
  private performRangedAttack(): void {
    // Implement ranged attack animation and projectile spawning
    Animated.sequence([
      Animated.timing(this.scale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(this.scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
    
    // TODO: Spawn projectile
  }
  
  takeDamage(amount: number): void {
    super.takeDamage(amount);
    
    // Check if enemy is defeated
    if (this.stats.health <= 0) {
      this.onDefeat();
    }
  }
  
  private onDefeat(): void {
    // Handle enemy defeat
    // - Drop items
    // - Grant experience
    // - Play defeat animation
    Animated.sequence([
      Animated.timing(this.scale, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(this.scale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }
  
  getExperienceValue(): number {
    return this.experienceValue;
  }
  
  getBehavior(): EnemyBehavior {
    return { ...this.behavior };
  }
} 