import React, { useEffect, useContext } from 'react';
import { StyleSheet, View, Image, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleWidth,scaleHeight } from '../Globalfile/Responsive';
import { AuthContext } from '../Globalfile/AuthProvider';

export default function Splash() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          // context me user data set kare
          setUser(JSON.parse(userData));
          navigation.replace('BottomTab');
        } else {
          navigation.replace('OnBoarding');
        }
      } catch (error) {
        console.log('Error checking auth:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(checkAuth, 3000); // 3 sec splash
    return () => clearTimeout(timer);
  }, [navigation, setUser]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#0f162b" barStyle="light-content" />
      <Image
        source={require('../Screens/Image/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f162b',
  },
  logo: {
    width: scaleWidth(200), 
    height: scaleHeight(200), 
  },
});
