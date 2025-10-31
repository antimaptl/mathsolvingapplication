import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../Globalfile/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home'); // ✅ auto navigate after 10s
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={theme.backgroundGradient || ['#0f162b', '#0f162b']}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Background Logo */}
      <ImageBackground
        source={require('./Image/logo.png')} // ✅ Replace with your logo image
        style={styles.backgroundImage}
        resizeMode="contain"
        imageStyle={{ opacity: 0.1 }}
      />

      {/* Animated Welcome Text */}
      <Animated.View
        entering={FadeInDown.duration(1500).springify()}
        style={styles.textContainer}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>
          Welcome to
        </Text>
        <Text
          style={[
            styles.appName,
            { color: theme.primary || '#FB923C' },
          ]}>
          MATHLETICS
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: width * 0.9,
    height: height * 0.6,
    top: height * 0.2,
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: -height * 0.1, // lifts the text slightly up
  },
  welcomeText: {
    fontSize: width * 0.065,
    fontWeight: '600',
    letterSpacing: 1,
  },
  appName: {
    fontSize: width * 0.1,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
