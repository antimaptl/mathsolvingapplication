import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../Globalfile/ThemeContext'; // ✅ Theme hook

const { width, height } = Dimensions.get('window');

const ChooseThemeIntroScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={theme.backgroundGradient || ['#0E1220', '#0E1220']}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E1220" />

      {/* Optional glowing pattern background */}
     
        <View style={styles.innerContainer}>
          {/* App Name */}
          <Text style={styles.appName}>Mathletics</Text>

          {/* Title */}
          <Text style={styles.title}>CHOOSE THEME</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => navigation.replace('AddFriendScreen')}
              style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.replace('ThemeSelectorScreen' ,{ from: 'onboarding' })}
              style={[styles.continueButton, { backgroundColor: theme.primary || '#FB923C' }]}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>

          {/* Theme icons */}
          {/* <View style={styles.themeIcons}>
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>☀️</Text>
            </View>
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>🌙</Text>
            </View>
          </View> */}
        </View>
     
    </LinearGradient>
  );
};

export default ChooseThemeIntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    height: '100%',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: height * 0.08,
  },
  appName: {
    color: '#fff',
    fontSize: width * 0.065,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowRadius: 10,
  },
  title: {
    color: '#fff',
    fontSize: width * 0.075,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: height * 0.02,
    marginBottom: height * 0.04,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: width * 0.05,
  },
  skipButton: {
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.08,
  },
  skipText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: width * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FB923C',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  themeIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: width * 0.12,
    marginTop: height * 0.04,
  },
  iconWrapper: {
    width: width * 0.13,
    height: width * 0.13,
    borderRadius: (width * 0.13) / 2,
    backgroundColor: '#1C1F2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FB923C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: {
    fontSize: width * 0.07,
  },
});
