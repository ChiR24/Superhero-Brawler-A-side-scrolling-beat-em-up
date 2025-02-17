import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface BackgroundProps {
  layers: {
    source: { uri: string };
    speed: number;
  }[];
  playerPosition: { x: number; y: number };
}

export const Background: React.FC<BackgroundProps> = ({ layers, playerPosition }) => {
  return (
    <View style={styles.container}>
      {layers.map((layer, index) => (
        <View
          key={index}
          style={[
            styles.layer,
            {
              transform: [
                {
                  translateX: -playerPosition.x * layer.speed,
                },
                {
                  translateY: -playerPosition.y * layer.speed,
                },
              ],
            },
          ]}
        >
          <Image
            source={layer.source}
            style={styles.layerImage}
            resizeMode="repeat"
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  },
  layerImage: {
    width: '100%',
    height: '100%',
  },
}); 