import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const firstLaunch = await AsyncStorage.getItem('firstLaunch');

      if (firstLaunch === null) {
        // First time opening the app
        await AsyncStorage.setItem('firstLaunch', 'false');
        navigation.replace('LanguageSelectionScreen');
        return;
      }

      if (token) {
        navigation.replace('BottomTab');
      } else {
        navigation.replace('Login');
      }

    } catch (error) {
      console.log('Error checking auth:', error);
      navigation.replace('Login');
    }
  };

  setTimeout(checkAuth, 3000);
}, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* <StatusBar hidden={true} /> */}
      {theme.backgroundGradient ? (
        <LinearGradient
          colors={theme.backgroundGradient}
          style={styles.container}
        >
          <Image
            source={require('../Screens/Image/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </LinearGradient>
      ) : (
        <View style={[styles.container, { backgroundColor: '#0f162b' }]}>
          <Image
            source={require('../Screens/Image/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
});
