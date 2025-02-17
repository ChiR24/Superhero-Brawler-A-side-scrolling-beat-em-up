import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GameHUDProps {
  score: number;
  level: number;
  enemyCount: number;
  health: number;
  energy: number;
  comboCount: number;
  onJump: () => void;
  onAttack: () => void;
  onDash: () => void;
  onEnergyBlast: () => void;
  onSuperPunch: () => void;
  onSettings: () => void;
  isFinisherAvailable?: boolean;
  onFinisher?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  level,
  enemyCount,
  health,
  energy,
  comboCount,
  onJump,
  onAttack,
  onDash,
  onEnergyBlast,
  onSuperPunch,
  onSettings,
  isFinisherAvailable,
  onFinisher
}) => {
  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.topHUD}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
          style={styles.topGradient}
        >
          <View style={styles.statsContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
            <Text style={styles.levelText}>Level {level}</Text>
            <Text style={styles.enemyText}>Enemies: {enemyCount}</Text>
          </View>

          {/* Health and Energy Bars */}
          <View style={styles.barsContainer}>
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={['#ff3333', '#ff6666']}
                style={[styles.bar, { width: `${health}%` }]}
              />
              <Text style={styles.barText}>HP</Text>
            </View>
            <View style={styles.barWrapper}>
              <LinearGradient
                colors={['#3333ff', '#6666ff']}
                style={[styles.bar, { width: `${energy}%` }]}
              />
              <Text style={styles.barText}>EP</Text>
            </View>
          </View>

          {/* Combo Counter */}
          {comboCount > 0 && (
            <Animated.View style={styles.comboContainer}>
              <Text style={styles.comboText}>{comboCount}x Combo!</Text>
              <LinearGradient
                colors={['#ffff00', '#ff9900']}
                style={styles.comboBar}
              />
            </Animated.View>
          )}
        </LinearGradient>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.controlsGradient}
        >
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onJump}>
              <Text style={styles.buttonText}>Jump</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onAttack}>
              <Text style={styles.buttonText}>Attack</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onDash}>
              <Text style={styles.buttonText}>Dash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.specialButton} onPress={onEnergyBlast}>
              <LinearGradient
                colors={['#3333ff', '#6666ff']}
                style={styles.specialButtonGradient}
              >
                <Text style={styles.specialButtonText}>Energy Blast</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.specialButton} onPress={onSuperPunch}>
              <LinearGradient
                colors={['#ff3333', '#ff6666']}
                style={styles.specialButtonGradient}
              >
                <Text style={styles.specialButtonText}>Super Punch</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {isFinisherAvailable && onFinisher && (
            <TouchableOpacity style={styles.finisherButton} onPress={onFinisher}>
              <LinearGradient
                colors={['#ff0000', '#ff6600']}
                style={styles.finisherGradient}
              >
                <Text style={styles.finisherText}>FINISHER!</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Settings Button */}
      <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
        <Text style={styles.settingsText}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'box-none',
  },
  topHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  topGradient: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelText: {
    color: '#ffff00',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  enemyText: {
    color: '#ff6666',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  barsContainer: {
    gap: 10,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    height: 20,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  barText: {
    position: 'absolute',
    left: 5,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  comboContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  comboText: {
    color: '#ffff00',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  comboBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    gap: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  specialButton: {
    flex: 1,
    maxWidth: 200,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  specialButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  finisherButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
  },
  finisherGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finisherText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 24,
  },
}); 