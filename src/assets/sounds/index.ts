// Temporary placeholder sound assets
const createEmptySound = () => ({});

export const sounds = {
  // Background music
  bgm: {
    main: createEmptySound(),
    battle: createEmptySound(),
    boss: createEmptySound()
  },
  
  // Sound effects
  sfx: {
    // Player sounds
    jump: createEmptySound(),
    land: createEmptySound(),
    punch: createEmptySound(),
    kick: createEmptySound(),
    dash: createEmptySound(),
    damage: createEmptySound(),
    powerup: createEmptySound(),
    
    // Super powers
    energyBlast: createEmptySound(),
    superPunch: createEmptySound(),
    
    // Enemy sounds
    enemyHit: createEmptySound(),
    enemyDeath: createEmptySound(),
    enemySpawn: createEmptySound(),
    
    // UI sounds
    menuSelect: createEmptySound(),
    menuConfirm: createEmptySound(),
    levelUp: createEmptySound()
  }
}; 