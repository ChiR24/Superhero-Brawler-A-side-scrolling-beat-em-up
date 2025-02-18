import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SoundManager } from '../utils/SoundManager';
import { sounds } from '../assets/sounds';
import { sprites } from '../assets/sprites';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Character {
  id: string;
  name: string;
  sprite: any;
  stats: {
    health: number;
    speed: number;
    strength: number;
    defense: number;
  };
  description: string;
  specialMoves: string[];
}

const characters: Character[] = [
  {
    id: 'hero1',
    name: 'Cyber Knight',
    sprite: sprites.hero,
    stats: {
      health: 100,
      speed: 80,
      strength: 75,
      defense: 70
    },
    description: 'A cybernetically enhanced warrior with a perfect blend of strength and agility.',
    specialMoves: ['Energy Blast', 'Super Punch', 'Cyber Dash']
  },
  {
    id: 'hero2',
    name: 'Shadow Ninja',
    sprite: sprites.hero,
    stats: {
      health: 80,
      speed: 95,
      strength: 65,
      defense: 60
    },
    description: 'A master of stealth and agility, capable of lightning-fast attacks from the shadows.',
    specialMoves: ['Shadow Strike', 'Smoke Bomb', 'Swift Fury']
  },
  {
    id: 'hero3',
    name: 'Power Titan',
    sprite: sprites.hero,
    stats: {
      health: 120,
      speed: 60,
      strength: 90,
      defense: 85
    },
    description: 'An unstoppable force of raw power, capable of devastating close-range attacks.',
    specialMoves: ['Seismic Slam', 'Titan Shield', 'Ground Breaker']
  },
  {
    id: 'hero4',
    name: 'Tech Mage',
    sprite: sprites.hero,
    stats: {
      health: 85,
      speed: 70,
      strength: 85,
      defense: 65
    },
    description: 'A brilliant inventor who combines technology and mystical arts in combat.',
    specialMoves: ['Tech Nova', 'Drone Swarm', 'Energy Field']
  }
];

interface HomeScreenProps {
  onStartGame: (selectedCharacter: Character) => void;
  onSettings: () => void;
  onExit: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartGame,
  onSettings,
  onExit
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(characters[0]);
  const [menuAnimation] = useState(new Animated.Value(0));
  const soundManager = SoundManager.getInstance();

  const handleCharacterSelect = (character: Character) => {
    soundManager.playSound('menuSelect', 0.5);
    setSelectedCharacter(character);
  };

  const handleStartGame = () => {
    soundManager.playSound('menuConfirm', 0.7);
    onStartGame(selectedCharacter);
  };

  const handleSettings = () => {
    soundManager.playSound('menuSelect', 0.5);
    onSettings();
  };

  const handleExit = () => {
    soundManager.playSound('menuSelect', 0.5);
    onExit();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000033', '#000066', '#000099']}
        style={styles.background}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SUPERHERO BRAWLER</Text>
          <Text style={styles.subtitle}>A Side-Scrolling Beat 'Em Up</Text>
        </View>

        {/* Character Selection */}
        <View style={styles.characterSection}>
          <Text style={styles.sectionTitle}>SELECT YOUR HERO</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.characterList}
          >
            {characters.map(character => (
              <TouchableOpacity
                key={character.id}
                style={[
                  styles.characterCard,
                  selectedCharacter.id === character.id && styles.selectedCharacter
                ]}
                onPress={() => handleCharacterSelect(character)}
              >
                <Image
                  source={character.sprite.animations.idle.frames[0].source}
                  style={styles.characterSprite}
                />
                <Text style={styles.characterName}>{character.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Character Details */}
          <View style={styles.characterDetails}>
            <Text style={styles.characterTitle}>{selectedCharacter.name}</Text>
            <Text style={styles.characterDescription}>
              {selectedCharacter.description}
            </Text>
            <View style={styles.statsContainer}>
              {Object.entries(selectedCharacter.stats).map(([stat, value]) => (
                <View key={stat} style={styles.statItem}>
                  <Text style={styles.statLabel}>{stat.toUpperCase()}</Text>
                  <LinearGradient
                    colors={['#3366ff', '#00ccff']}
                    style={[styles.statBar, { width: `${value}%` }]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.specialMoves}>
              <Text style={styles.specialMovesTitle}>SPECIAL MOVES</Text>
              {selectedCharacter.specialMoves.map(move => (
                <Text key={move} style={styles.moveItem}>
                  • {move}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleStartGame}
          >
            <LinearGradient
              colors={['#3366ff', '#00ccff']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleSettings}
          >
            <LinearGradient
              colors={['#ff6600', '#ffcc00']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>SETTINGS</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleExit}
          >
            <LinearGradient
              colors={['#cc0000', '#ff3333']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>EXIT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: '#00ccff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#99ccff',
    marginTop: 10,
  },
  characterSection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  characterList: {
    maxHeight: 150,
    marginBottom: 20,
  },
  characterCard: {
    width: 120,
    height: 150,
    marginHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedCharacter: {
    borderColor: '#00ccff',
    backgroundColor: 'rgba(0, 102, 255, 0.3)',
  },
  characterSprite: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  characterName: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  characterDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  characterTitle: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 10,
  },
  characterDescription: {
    color: '#cccccc',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statItem: {
    marginBottom: 8,
  },
  statLabel: {
    color: '#ffffff',
    marginBottom: 4,
  },
  statBar: {
    height: 6,
    borderRadius: 3,
  },
  specialMoves: {
    marginTop: 10,
  },
  specialMovesTitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  moveItem: {
    color: '#99ccff',
    marginBottom: 4,
  },
  menuContainer: {
    gap: 10,
  },
  menuButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 