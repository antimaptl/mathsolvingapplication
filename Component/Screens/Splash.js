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
import { useTheme } from '../Globalfile/ThemeContext'; // ✅ Correct import
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme(); // ✅ only theme needed

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          navigation.replace('BottomTab');
        } else {
          navigation.replace('OnBoarding');
        }
      } catch (error) {
        console.log('Error checking auth:', error);
        navigation.replace('Login');
      }
    };
    setTimeout(checkAuth, 3000);
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top }]}
    >
      {/* ✅ If the current theme has gradient use it */}
      {theme.backgroundGradient ? (
        <LinearGradient
          colors={theme.backgroundGradient}
          style={styles.container}
        >
          <StatusBar backgroundColor={theme.backgroundGradient[0]} barStyle="light-content" />
          <Image
            source={require('../Screens/Image/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </LinearGradient>
      ) : (
        // ✅ Default (dark theme) fallback background
        <View style={[styles.container, { backgroundColor: '#0f162b' }]}>
          <StatusBar backgroundColor="#0f162b" barStyle="light-content" />
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
