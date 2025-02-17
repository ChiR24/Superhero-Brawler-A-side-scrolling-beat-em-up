import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Layer {
  source: { uri: string };
  speed: number;
}

interface BackgroundProps {
  layers: Layer[];
  playerPosition: { x: number; y: number };
}

export const Background: React.FC<BackgroundProps> = ({ layers, playerPosition }) => {
  const positions = useRef(layers.map(() => new Animated.ValueXY())).current;

  useEffect(() => {
    layers.forEach((layer, index) => {
      const parallaxFactor = layer.speed;
      positions[index].setValue({
        x: -playerPosition.x * parallaxFactor,
        y: -playerPosition.y * parallaxFactor * 0.5
      });
    });
  }, [playerPosition, layers, positions]);

  return (
    <View style={styles.container}>
      {/* Night sky gradient */}
      <LinearGradient
        colors={['#000033', '#000066', '#000']}
        style={styles.skyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Stars */}
      <View style={styles.starsContainer}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: Math.random() * SCREEN_WIDTH,
                top: Math.random() * SCREEN_HEIGHT,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                opacity: Math.random() * 0.8 + 0.2
              }
            ]}
          />
        ))}
      </View>

      {/* Parallax layers */}
      {layers.map((layer, index) => (
        <Animated.View
          key={index}
          style={[
            styles.layer,
            {
              transform: [
                { translateX: positions[index].x },
                { translateY: positions[index].y }
              ],
              zIndex: index
            }
          ]}
        >
          <ImageBackground
            source={layer.source}
            style={styles.layerImage}
            resizeMode="repeat"
          />
          <ImageBackground
            source={layer.source}
            style={[styles.layerImage, { left: SCREEN_WIDTH }]}
            resizeMode="repeat"
          />
        </Animated.View>
      ))}

      {/* Foreground effects */}
      <View style={styles.fogLayer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.fogCloud,
              {
                left: Math.random() * SCREEN_WIDTH,
                top: Math.random() * SCREEN_HEIGHT,
                opacity: Math.random() * 0.3
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  skyGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 50,
  },
  layer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT,
  },
  layerImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fogLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  fogCloud: {
    position: 'absolute',
    width: 100,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    opacity: 0.1,
  }
}); 