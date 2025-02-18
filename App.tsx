/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, BackHandler } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { SettingsMenu } from './src/components/ui/SettingsMenu';
import { Character } from './src/types/GameTypes';

type Screen = 'home' | 'game' | 'settings';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  // Handle back button press
  React.useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'game') {
        setCurrentScreen('home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen]);

  const handleStartGame = (character: Character) => {
    setSelectedCharacter(character);
    setCurrentScreen('game');
  };

  const handleSettings = () => {
    setIsSettingsVisible(true);
  };

  const handleExit = () => {
    BackHandler.exitApp();
  };

  const handleGameOver = () => {
    setCurrentScreen('home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {currentScreen === 'home' && (
        <HomeScreen
          onStartGame={handleStartGame}
          onSettings={handleSettings}
          onExit={handleExit}
        />
      )}

      {currentScreen === 'game' && selectedCharacter && (
        <GameScreen
          character={selectedCharacter}
          onGameOver={handleGameOver}
        />
      )}

      <SettingsMenu
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;
