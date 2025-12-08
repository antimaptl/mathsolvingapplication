import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Dimensions,
  Vibration,
  PixelRatio,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../Globalfile/ThemeContext';
import { useSound } from '../../Context/SoundContext';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const SettingsScreen = () => {
  const navigation = useNavigation();
  const {theme} = useTheme(); // Theme Hook
  const { isSoundOn, toggleSound, setIsSoundOn } = useSound();


  const [settings, setSettings] = useState({
    notification: true,
    sound: true,
    vibrate: true,
    music: true,
  });

  // ---------- Handle Toggle Change ----------
  const handleToggle = key => {
  const newValue = !settings[key];

  if (key === "sound") {
    setIsSoundOn(newValue);   // 🔥 Global Sound Update
  }

  if (key === "vibrate" && newValue) {
    Vibration.vibrate(300);
  }

  setSettings(prev => ({ ...prev, [key]: newValue }));
};


  // ✅ Setting Card with Icon
  const SettingCard = ({ label, stateKey, iconName }) => {
  const isSoundCard = stateKey === "sound";

  return (
    <View style={[
      styles.settingCard,
      {
        backgroundColor: theme.cardBackground || '#fff',
        borderColor: theme.borderColor || '#334155',
      }
    ]}>
      
      <View style={styles.iconLabelContainer}>
        <MaterialCommunityIcons
          name={iconName}
          size={scaleFont(22)}
          color={theme.primaryColor || '#10B981'}
          style={styles.settingIcon}
        />
        <Text style={[styles.label, { color: theme.text || '#000' }]}>
          {label}
        </Text>
      </View>

      {/* 🔥 SOUND TOGGLE REAL CONTEXT VALUE */}
      {isSoundCard ? (
        <Switch
          trackColor={{
            false: theme.secondaryColor || '#D1D5DB',
            true: theme.primaryColor || '#10B981',
          }}
          thumbColor={isSoundOn ? '#fff' : theme.thumbColor || '#71717A'}
          value={isSoundOn}
          onValueChange={toggleSound}
        />
      ) : (
        <Switch
          trackColor={{
            false: theme.secondaryColor || '#D1D5DB',
            true: theme.primaryColor || '#10B981',
          }}
          thumbColor={settings[stateKey] ? '#fff' : theme.thumbColor || '#71717A'}
          value={settings[stateKey]}
          onValueChange={() => handleToggle(stateKey)}
        />
      )}

    </View>
  );
};

  const Content = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons
            name="caret-back-outline"
            size={scaleFont(28)}
            color={theme.text || 'black'}
          />
        </TouchableOpacity>

        {/* Header Title (Center Aligned) */}
        <Text
          style={[
            styles.headerTitle,
            {color: theme.text || 'black'},
          ]}>
          SETTINGS
        </Text>
        {/* Placeholder for centering */}
        <View style={styles.rightPlaceholder} />
      </View>

     
      <View style={styles.headerSeparator} />


      {/* Settings List (Separate Cards) */}
      <View style={styles.settingsList}>
        <SettingCard
          label="Allow Notification"
          stateKey="notification"
          iconName="bell-outline"
        />
        <SettingCard
          label="Sound"
          stateKey="sound"
          iconName="volume-high"
        />
        <SettingCard
          label="Vibrate"
          stateKey="vibrate"
          iconName="vibrate"
        />
        <SettingCard
          label="Music"
          stateKey="music"
          iconName="music"
        />
      </View>
    </SafeAreaView>
  );

  // Background Theme
  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{flex: 1, backgroundColor: theme.backgroundColor || '#fff'}}>
      <Content />
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: height * 0.01,
    paddingBottom: height * 0.01, 
  },

 
  headerSeparator: {
    height: 1, 
    backgroundColor: '#94A3B8', 
    opacity: 0.5,
    top:30,
    marginHorizontal: -width * 0.05,
    marginBottom: height * 0.04, 
  },

  backButton: {
    paddingRight: 15,
    flex: 0.15,
  },

  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginLeft: -width * 0.08,
  },

  rightPlaceholder: {
    flex: 0.15,
  },

  settingsList: {
    marginTop: height * 0.04,
  },

  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },

  iconLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  settingIcon: {
    marginRight: 15,
    width: scaleFont(25),
    textAlign: 'center',
  },

  label: {
    fontSize: scaleFont(16),
    fontWeight: '500',
  },
});