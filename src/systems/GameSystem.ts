import { GameEngineUpdateEventOptionType } from 'react-native-game-engine';

export const updateGame = (entities: any, { time, dispatch }: GameEngineUpdateEventOptionType) => {
  // Update game state
  const deltaTime = time.delta;

  // Update all entities
  Object.keys(entities).forEach(key => {
    const entity = entities[key];
    if (entity.update) {
      entity.update(deltaTime);
    }
  });

  return entities;
}; 