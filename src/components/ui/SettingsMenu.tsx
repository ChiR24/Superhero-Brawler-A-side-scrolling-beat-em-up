import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SoundManager } from '../../utils/SoundManager';

interface SettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isVisible,
  onClose
}) => {
  const soundManager = SoundManager.getInstance();
  const [isSoundMuted, setIsSoundMuted] = React.useState(soundManager.isSoundMuted());
  const [musicVolume, setMusicVolume] = React.useState(0.5);
  const [sfxVolume, setSfxVolume] = React.useState(0.7);
  const [showFPS, setShowFPS] = React.useState(false);
  const [vibrationEnabled, setVibrationEnabled] = React.useState(true);

  const handleSoundToggle = (value: boolean) => {
    setIsSoundMuted(!value);
    soundManager.setMuted(!value);
  };

  const handleMusicVolumeChange = (value: number) => {
    setMusicVolume(value);
    // Update background music volume
    soundManager.playBackgroundMusic(value);
  };

  const handleSFXVolumeChange = (value: number) => {
    setSfxVolume(value);
    // Test sound effect with new volume
    soundManager.playSound('menuSelect', value);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.menuContainer}>
          <Text style={styles.title}>Settings</Text>

          {/* Sound Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sound</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sound Enabled</Text>
              <Switch
                value={!isSoundMuted}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={!isSoundMuted ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Music Volume</Text>
              <Slider
                style={styles.slider}
                value={musicVolume}
                onValueChange={handleMusicVolumeChange}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                minimumTrackTintColor="#81b0ff"
                maximumTrackTintColor="#000000"
                thumbTintColor="#f5dd4b"
                disabled={isSoundMuted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>SFX Volume</Text>
              <Slider
                style={styles.slider}
                value={sfxVolume}
                onValueChange={handleSFXVolumeChange}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                minimumTrackTintColor="#81b0ff"
                maximumTrackTintColor="#000000"
                thumbTintColor="#f5dd4b"
                disabled={isSoundMuted}
              />
            </View>
          </View>

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show FPS</Text>
              <Switch
                value={showFPS}
                onValueChange={setShowFPS}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={showFPS ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Gameplay Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gameplay</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={vibrationEnabled ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  slider: {
    width: 150,
    height: 40,
  },
  closeButton: {
    backgroundColor: '#81b0ff',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 