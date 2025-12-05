// SettingsScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Vibration,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../Globalfile/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();

  const [settings, setSettings] = useState({
    notification: true,
    sound: true,
    vibrate: true,
    music: true,
  });

  // ---------- Handle Toggle Change ----------
  const handleToggle = key => {
    const newValue = !settings[key];

    // Only Vibrate toggle will vibrate (optional)
    if (key === 'vibrate' && newValue) {
      Vibration.vibrate(300);
    }

    setSettings(prev => ({...prev, [key]: newValue}));
  };

  const ToggleItem = ({label, stateKey}) => (
    <View style={styles.row}>
      <Text style={[styles.label, {color: theme.text}]}>{label}</Text>

      <Switch
        trackColor={{false: '#D1D5DB', true: '#10B981'}}
        thumbColor="#fff"
        value={settings[stateKey]}
        onValueChange={() => handleToggle(stateKey)}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={theme.backgroundGradient || ['#0F172A', '#1E293B']}
      style={{flex: 1}}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="caret-back-outline" size={26} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>SETTINGS</Text>
        </View>

        {/* Settings */}
        <View style={styles.box}>
          <ToggleItem label="Notification" stateKey="notification" />
          <ToggleItem label="Sound" stateKey="sound" />
          <ToggleItem label="Vibration" stateKey="vibrate" />
          <ToggleItem label="Music" stateKey="music" />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },

  box: {
    marginTop: 25,
    backgroundColor: '#ffffff20',
    borderRadius: 12,
    padding: 15,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});
