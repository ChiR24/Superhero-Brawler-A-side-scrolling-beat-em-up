import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  Text,
  GestureResponderEvent
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { Superhero } from '../components/game/Superhero';
import { Enemy } from '../components/game/Enemy';
import { Background } from '../components/Background';
import { backgrounds } from '../assets/backgrounds';
import { SoundManager } from '../utils/SoundManager';
import { sounds } from '../assets/sounds';
import { SettingsMenu } from '../components/ui/SettingsMenu';
import { sprites } from '../assets/sprites';
import { SpriteManager } from '../utils/SpriteManager';
import { ParticleSystem, ParticleEffects } from '../utils/ParticleSystem';
import { EnvironmentalHazard } from '../components/game/EnvironmentalHazard';
import { GameHUD } from '../components/ui/GameHUD';
import { HazardType } from '../types/HazardTypes';
import { updateGame } from '../systems/GameSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Initial superhero stats
const initialSuperheroStats = {
  health: 100,
  speed: 5,
  strength: 10,
  defense: 5,
  energy: 100,
  energyRegenRate: 10,
  superPowers: [
    {
      name: 'Energy Blast',
      damage: 30,
      cooldown: 5,
      range: 300,
      energyCost: 30,
      animation: 'energyBlast'
    },
    {
      name: 'Super Punch',
      damage: 50,
      cooldown: 8,
      range: 100,
      energyCost: 40,
      animation: 'superPunch'
    }
  ]
};

// Enemy types
const enemyTypes = {
  minion: {
    health: 50,
    speed: 3,
    strength: 5,
    defense: 2,
    experienceValue: 10,
    behavior: {
      attackRange: 50,
      detectionRange: 200,
      movementPattern: 'chase' as const,
      attackPattern: 'melee' as const
    }
  },
  ranged: {
    health: 40,
    speed: 2,
    strength: 8,
    defense: 1,
    experienceValue: 15,
    behavior: {
      attackRange: 200,
      detectionRange: 300,
      movementPattern: 'patrol' as const,
      attackPattern: 'ranged' as const
    }
  },
  elite: {
    health: 100,
    speed: 4,
    strength: 12,
    defense: 4,
    experienceValue: 30,
    behavior: {
      attackRange: 100,
      detectionRange: 250,
      movementPattern: 'chase' as const,
      attackPattern: 'mixed' as const
    }
  }
};

// Background layer definitions
const backgroundLayers = [
  {
    source: backgrounds.sky,
    speed: 0.1
  },
  {
    source: backgrounds.clouds,
    speed: 0.2
  },
  {
    source: backgrounds.buildings_far,
    speed: 0.4
  },
  {
    source: backgrounds.buildings_near,
    speed: 0.6
  },
  {
    source: backgrounds.ground,
    speed: 1
  }
];

export const GameScreen: React.FC = () => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [enemyCount, setEnemyCount] = useState(0);
  const superheroRef = useRef<Superhero | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const lastUpdateTime = useRef(Date.now());
  const spawnTimerRef = useRef(0);
  const soundManager = useRef<SoundManager>(SoundManager.getInstance());
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const spriteManager = useRef<SpriteManager>(SpriteManager.getInstance());
  const particleSystem = useRef<ParticleSystem>(ParticleSystem.getInstance());
  const [isJumping, setIsJumping] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [finisherEmitterId, setFinisherEmitterId] = useState<number | null>(null);
  const [hazards, setHazards] = useState<EnvironmentalHazard[]>([]);
  const hazardsRef = useRef<EnvironmentalHazard[]>([]);
  const gameEngineRef = useRef<GameEngine>(null);
  const [gameEntities, setGameEntities] = useState({
    // Initialize your game entities here
  });
  const [isSoundLoading, setIsSoundLoading] = useState(true);

  useEffect(() => {
    // Initialize superhero
    superheroRef.current = new Superhero(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT - 200,
      100,
      100,
      initialSuperheroStats
    );

    // Load sprite sheets
    spriteManager.current.loadSpriteSheet('hero', sprites.hero);
    spriteManager.current.loadSpriteSheet('enemy.minion', sprites.enemy.minion);
    spriteManager.current.loadSpriteSheet('enemy.ranged', sprites.enemy.ranged);
    spriteManager.current.loadSpriteSheet('enemy.elite', sprites.enemy.elite);

    // Load and play background music
    const initSound = async () => {
      setIsSoundLoading(true);
      try {
        // Load background music first
        await soundManager.current.loadBackgroundMusic(sounds.bgm.main);
        
        // Load all sound effects in parallel
        const soundEffects = Object.entries(sounds.sfx).map(([name, path]) => 
          soundManager.current.loadSound(name, path)
        );
        
        await Promise.all(soundEffects);
        
        // Start background music if everything loaded successfully
        if (!soundManager.current.isLoading()) {
          soundManager.current.playBackgroundMusic(0.3);
        }
      } catch (error) {
        console.error('Failed to initialize sound:', error);
      } finally {
        setIsSoundLoading(false);
      }
    };

    initSound();

    return () => {
      soundManager.current.dispose();
    };
  }, []);

  useEffect(() => {
    hazardsRef.current = hazards;
  }, [hazards]);

  // Add touch handler for creating hazards
  const handleTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const types: HazardType[] = ['fire', 'electric', 'toxic', 'spike'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    createHazard(locationX, locationY, randomType);
  };

  // Handle touch controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (superheroRef.current) {
          const { dx, dy } = gestureState;
          superheroRef.current.move(dx / 100, dy / 100);
        }
      },
      onPanResponderRelease: (event) => {
        if (superheroRef.current) {
          superheroRef.current.move(0, 0);
          // Create hazard on release
          handleTouch(event);
        }
      }
    })
  ).current;

  const spawnEnemy = () => {
    const types = Object.keys(enemyTypes);
    const randomType = types[Math.floor(Math.random() * types.length)] as keyof typeof enemyTypes;
    const stats = enemyTypes[randomType];

    // Randomly position enemy along the edges of the screen
    let x, y;
    if (Math.random() > 0.5) {
      // Spawn on left or right edge
      x = Math.random() > 0.5 ? 0 : SCREEN_WIDTH;
      y = Math.random() * SCREEN_HEIGHT;
    } else {
      // Spawn on top or bottom edge
      x = Math.random() * SCREEN_WIDTH;
      y = Math.random() > 0.5 ? 0 : SCREEN_HEIGHT;
    }

    const enemy = new Enemy(x, y, 80, 80, stats, randomType);
    enemiesRef.current.push(enemy);
    setEnemyCount(prev => prev + 1);
    soundManager.current.playSound('enemySpawn', 0.5);
  };

  const removeEnemy = (enemy: Enemy) => {
    const index = enemiesRef.current.indexOf(enemy);
    if (index > -1) {
      enemiesRef.current.splice(index, 1);
      setEnemyCount(prev => prev - 1);
      setScore(prev => prev + enemy.getExperienceValue());
      soundManager.current.playSound('enemyDeath', 0.6);
    }
  };

  const spawnHazard = (type: HazardType, x?: number, y?: number, duration?: number) => {
    const randomX = x ?? Math.random() * SCREEN_WIDTH;
    const randomY = y ?? Math.random() * (SCREEN_HEIGHT - 200) + 100;

    const hazard = new EnvironmentalHazard(randomX, randomY, type, {
      duration: duration
    });

    setHazards(prev => [...prev, hazard]);
  };

  const removeHazard = (hazard: EnvironmentalHazard) => {
    hazard.deactivate();
    setHazards(prev => prev.filter(h => h !== hazard));
  };

  // Add method to get nearby hazards
  const getNearbyHazards = (sourceHazard: EnvironmentalHazard): EnvironmentalHazard[] => {
    return hazardsRef.current.filter(hazard => 
      hazard !== sourceHazard && 
      hazard.getStats().isActive
    );
  };

  // Add method to create hazard
  const createHazard = (x: number, y: number, type: HazardType) => {
    const hazard = new EnvironmentalHazard(x, y, type);
    
    // Set up the getNearbyHazards implementation
    hazard.setNearbyHazardsImpl(() => {
      return hazardsRef.current.filter(h => {
        const hStats = h.getStats();
        if (!hStats.isActive || h === hazard) return false;
        
        // Calculate distance between hazards
        const hPos = h.getPosition();
        const hazardPos = hazard.getPosition();
        const dx = hPos.x - hazardPos.x;
        const dy = hPos.y - hazardPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Return hazards within interaction range
        return distance <= hazard.getStats().radius + hStats.radius;
      });
    });

    setHazards(prev => [...prev, hazard]);
  };

  // Game update loop
  const onGameUpdate = (deltaTime: number) => {
    const currentTime = Date.now();
    const dt = (currentTime - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = currentTime;

    // Update particle system
    particleSystem.current.update(dt);

    if (superheroRef.current) {
      superheroRef.current.update(dt);

      // Check for landing
      if (isJumping && !superheroRef.current.getState().isJumping) {
        setIsJumping(false);
        const position = superheroRef.current.getPosition();
        // Emit landing impact particles
        particleSystem.current.emitParticles(
          position.x,
          position.y + 40,
          ParticleEffects.LANDING_IMPACT
        );
        soundManager.current.playSound('land', 0.4);
      }

      // Update spawn timer
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= 3 && enemiesRef.current.length < 5 + level) {
        spawnEnemy();
        spawnTimerRef.current = 0;
      }

      // Update enemies
      enemiesRef.current.forEach(enemy => {
        enemy.update(dt, superheroRef.current!.getPosition());

        // Check for collisions with superhero
        const heroPos = superheroRef.current!.getPosition();
        const enemyPos = enemy.getPosition();
        const distance = Math.sqrt(
          Math.pow(heroPos.x - enemyPos.x, 2) +
          Math.pow(heroPos.y - enemyPos.y, 2)
        );

        if (distance < 50) {
          if (superheroRef.current!.getState().isAttacking) {
            // Register hit for combo system
            superheroRef.current!.registerHit();
            const comboState = superheroRef.current!.getComboState();
            setComboCount(comboState.count);

            // Calculate damage with combo multiplier
            const damage = superheroRef.current!.getCurrentDamage();
            enemy.takeDamage(damage);
            soundManager.current.playSound('enemyHit', 0.5);

            // Emit combo-specific particles
            const direction = superheroRef.current!.getDirection();
            const offsetX = direction === 'right' ? 50 : -50;
            
            let particleEffect;
            if (comboState.count >= 10) {
              particleEffect = ParticleEffects.COMBO_FINISHER;
              soundManager.current.playSound('superPunch', 0.7);
            } else if (comboState.count >= 6) {
              particleEffect = ParticleEffects.COMBO_HIT_3;
            } else if (comboState.count >= 3) {
              particleEffect = ParticleEffects.COMBO_HIT_2;
            } else {
              particleEffect = ParticleEffects.COMBO_HIT_1;
            }

            particleSystem.current.emitParticles(
              enemyPos.x,
              enemyPos.y,
              particleEffect
            );

            if (enemy.getStats().health <= 0) {
              particleSystem.current.emitParticles(
                enemyPos.x,
                enemyPos.y,
                ParticleEffects.ENEMY_DEATH
              );
              removeEnemy(enemy);
            }
          } else if (enemy.getState().isAttacking) {
            superheroRef.current!.takeDamage(enemy.getStats().strength);
            soundManager.current.playSound('damage', 0.6);
            
            // Break combo when taking damage
            if (comboCount > 0) {
              superheroRef.current!.resetCombo();
              setComboCount(0);
              
              // Emit combo break particles
              particleSystem.current.emitParticles(
                heroPos.x,
                heroPos.y,
                ParticleEffects.COMBO_BREAK
              );
            }
          }
        }
      });

      // Check for level up and add celebration particles
      if (score >= level * 100) {
        setLevel(prev => prev + 1);
        soundManager.current.playSound('levelUp', 0.7);

        // Create level up celebration particles at multiple positions
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        const positions = [
          { x: centerX, y: centerY },
          { x: centerX - 100, y: centerY },
          { x: centerX + 100, y: centerY },
          { x: centerX, y: centerY - 100 },
          { x: centerX, y: centerY + 100 }
        ];

        positions.forEach(pos => {
          particleSystem.current.emitParticles(
            pos.x,
            pos.y,
            ParticleEffects.LEVEL_UP
          );
        });
      }
    }

    // Update hazards
    hazardsRef.current.forEach(hazard => {
      hazard.update(deltaTime);
    });

    // Clean up inactive hazards
    const inactiveHazards = hazardsRef.current.filter(
      hazard => !hazard.getStats().isActive
    );
    inactiveHazards.forEach(removeHazard);

    // Spawn random hazards based on level
    if (Math.random() < 0.01 * level && hazardsRef.current.length < level + 2) {
      const hazardTypes: HazardType[] = ['fire', 'electric', 'toxic', 'spike'];
      const randomType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
      spawnHazard(randomType, undefined, undefined, 10000); // 10 second duration
    }
  };

  // Action buttons handlers
  const handleJump = () => {
    if (superheroRef.current) {
      superheroRef.current.jump();
      soundManager.current.playSound('jump', 0.5);
      setIsJumping(true);

      // Emit jump dust particles
      const position = superheroRef.current.getPosition();
      particleSystem.current.emitParticles(
        position.x,
        position.y + 40,
        ParticleEffects.JUMP_DUST
      );
    }
  };

  const handleAttack = () => {
    if (superheroRef.current) {
      superheroRef.current.attack();
      soundManager.current.playSound('punch', 0.6);

      // Emit attack particles
      const position = superheroRef.current.getPosition();
      const direction = superheroRef.current.getDirection();
      const offsetX = direction === 'right' ? 50 : -50;
      particleSystem.current.emitParticles(
        position.x + offsetX,
        position.y,
        ParticleEffects.ATTACK_IMPACT
      );
    }
  };

  const handleSuperPower = (powerName: string) => {
    if (superheroRef.current) {
      if (superheroRef.current.useSuperPower(powerName)) {
        soundManager.current.playSound(
          powerName === 'Energy Blast' ? 'energyBlast' : 'superPunch',
          0.7
        );

        // Emit appropriate particles based on power
        const position = superheroRef.current.getPosition();
        const direction = superheroRef.current.getDirection();
        const offsetX = direction === 'right' ? 60 : -60;
        
        particleSystem.current.emitParticles(
          position.x + offsetX,
          position.y,
          powerName === 'Energy Blast' 
            ? ParticleEffects.ENERGY_BLAST 
            : ParticleEffects.ATTACK_IMPACT
        );
      }
    }
  };

  const handleDash = () => {
    if (superheroRef.current) {
      superheroRef.current.dash();
      soundManager.current.playSound('dash', 0.5);

      // Emit dash trail particles
      const position = superheroRef.current.getPosition();
      particleSystem.current.emitParticles(
        position.x,
        position.y,
        ParticleEffects.DASH_TRAIL
      );
    }
  };

  const handleFinisher = () => {
    if (superheroRef.current && superheroRef.current.isFinisherReady()) {
      const position = superheroRef.current.getPosition();
      const direction = superheroRef.current.getDirection();
      
      // Start charging effect
      const emitterId = particleSystem.current.startContinuousEmitter(
        position.x,
        position.y,
        ParticleEffects.FINISHER_CHARGE,
        100 // Emit every 100ms
      );
      setFinisherEmitterId(emitterId);

      // Perform finisher after a short charge time
      setTimeout(() => {
        if (superheroRef.current?.performFinisher()) {
          soundManager.current.playSound('superPunch', 0.8);

          // Stop charging effect
          if (finisherEmitterId !== null) {
            particleSystem.current.stopContinuousEmitter(finisherEmitterId);
            setFinisherEmitterId(null);
          }

          // Create finisher impact effects
          const impactX = position.x + (direction === 'right' ? 100 : -100);
          particleSystem.current.emitParticles(
            impactX,
            position.y,
            ParticleEffects.FINISHER_IMPACT
          );

          // Create shockwave effect
          particleSystem.current.emitParticles(
            impactX,
            position.y,
            ParticleEffects.FINISHER_SHOCKWAVE
          );

          // Apply finisher damage to nearby enemies
          enemiesRef.current.forEach(enemy => {
            const enemyPos = enemy.getPosition();
            const distance = Math.sqrt(
              Math.pow(impactX - enemyPos.x, 2) +
              Math.pow(position.y - enemyPos.y, 2)
            );

            if (distance < 150) { // Larger range than normal attacks
              const damage = superheroRef.current!.getCurrentDamage() * 2; // Double damage for finisher
              enemy.takeDamage(damage);
              
              if (enemy.getStats().health <= 0) {
                particleSystem.current.emitParticles(
                  enemyPos.x,
                  enemyPos.y,
                  ParticleEffects.ENEMY_DEATH
                );
                removeEnemy(enemy);
              }
            }
          });
        }
      }, 500); // 500ms charge time
    }
  };

  return (
    <View 
      style={styles.container} 
      {...panResponder.panHandlers}
      pointerEvents="box-none"
    >
      <Background
        layers={backgroundLayers}
        playerPosition={superheroRef.current?.getPosition() || { x: 0, y: 0 }}
      />
      <View 
        style={styles.gameArea}
        onTouchEnd={handleTouch}
        pointerEvents="box-none"
      >
        <GameEngine
          ref={gameEngineRef}
          style={styles.gameEngine}
          systems={[updateGame]}
          entities={gameEntities}
        >
          {/* Render particles */}
          {particleSystem.current.getParticles().map(particle => (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  backgroundColor: particle.color,
                  transform: [
                    { translateX: particle.position.x },
                    { translateY: particle.position.y },
                    { scale: particle.scale },
                    { rotate: particle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg']
                    })}
                  ],
                  opacity: particle.opacity
                }
              ]}
            />
          ))}

          {/* Game content */}
          {superheroRef.current && (
            <Animated.View
              style={[
                styles.character,
                superheroRef.current.getAnimatedStyle()
              ]}
            >
              <Animated.Image
                source={superheroRef.current.getCurrentSprite() || undefined}
                style={styles.sprite}
              />
            </Animated.View>
          )}
          {enemiesRef.current.map((enemy, index) => (
            <Animated.View
              key={index}
              style={[
                styles.character,
                enemy.getAnimatedStyle()
              ]}
            >
              <Animated.Image
                source={enemy.getCurrentSprite() || undefined}
                style={styles.sprite}
              />
            </Animated.View>
          ))}

          {/* Render hazard indicators */}
          {hazards.map((hazard, index) => {
            const stats = hazard.getStats();
            const position = hazard.getPosition();
            if (!stats.isActive) return null;

            return (
              <View
                key={index}
                style={[
                  styles.hazardIndicator,
                  {
                    left: position.x - stats.radius,
                    top: position.y - stats.radius,
                    width: stats.radius * 2,
                    height: stats.radius * 2,
                    borderColor: hazard.getType() === 'fire' ? '#ff6600' :
                               hazard.getType() === 'electric' ? '#00ffff' :
                               hazard.getType() === 'toxic' ? '#00ff00' :
                               '#888888',
                    opacity: stats.combinedWith ? 0.5 : 0.3
                  }
                ]}
              />
            );
          })}
        </GameEngine>
      </View>
      <GameHUD
        score={score}
        level={level}
        enemyCount={enemyCount}
        health={superheroRef.current?.getStats().health || 0}
        energy={superheroRef.current?.getEnergy() || 0}
        comboCount={comboCount}
        onJump={handleJump}
        onAttack={handleAttack}
        onDash={handleDash}
        onEnergyBlast={() => handleSuperPower('Energy Blast')}
        onSuperPunch={() => handleSuperPower('Super Punch')}
        onSettings={() => setIsSettingsVisible(true)}
        isFinisherAvailable={superheroRef.current?.isFinisherReady()}
        onFinisher={handleFinisher}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gameArea: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gameEngine: {
    flex: 1,
  },
  character: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  sprite: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hazardIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 1000,
    opacity: 0.3,
    pointerEvents: 'none'
  }
}); 