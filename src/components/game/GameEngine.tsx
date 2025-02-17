import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, AppState } from 'react-native';
import { GameLoop } from './GameLoop';
import { Renderer } from './Renderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameEngineProps {
  fps?: number;
  onUpdate?: (deltaTime: number) => void;
  children?: React.ReactNode;
}

export const GameEngine: React.FC<GameEngineProps> = ({ fps = 60, onUpdate, children }) => {
  const [isRunning, setIsRunning] = useState(true);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    // Initialize game loop and renderer
    gameLoopRef.current = new GameLoop(fps);
    rendererRef.current = new Renderer();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setIsRunning(true);
      } else if (nextAppState === 'background') {
        setIsRunning(false);
      }
    });

    return () => {
      subscription.remove();
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
    };
  }, [fps]);

  useEffect(() => {
    if (gameLoopRef.current) {
      if (isRunning) {
        gameLoopRef.current.start(deltaTime => {
          if (onUpdate) {
            onUpdate(deltaTime);
          }
          if (rendererRef.current) {
            rendererRef.current.render();
          }
        });
      } else {
        gameLoopRef.current.stop();
      }
    }
  }, [isRunning, onUpdate]);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
}); 