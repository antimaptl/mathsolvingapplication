import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../Globalfile/ThemeContext';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const AuthLandingScreen = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const primaryColor = theme?.primary || '#FB923C';

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={theme.backgroundGradient || ['#00F5FF', '#00C3FF', '#006BFF']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        <StatusBar
          backgroundColor={theme.backgroundGradient?.[0] || '#00F5FF'}
          barStyle="light-content"
        />

        {/* Background Logo Image */}
        <ImageBackground
          source={require('../Screens/Image/logo.png')} // 👈 apna logo path yahan lagao
          resizeMode="contain"
          style={styles.logoBg}
          imageStyle={{opacity: 0.5}} // low transparency
        />

        {/* Bottom Buttons */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SignUp')}
              style={[styles.btn, {borderColor: primaryColor}]}>
              <Text style={[styles.btnText, {color: primaryColor}]}>
                {t('Sign-Up') || 'Sign - Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Login')}
              style={[styles.btn, {backgroundColor: primaryColor}]}>
              <Text style={[styles.btnText, {color: '#fff'}]}>
                {t('Sign-In') || 'Sign - In'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('GuestHome')}>
            <Text style={styles.guestText}>
              {t('continue_as_guest') || 'Continue as Guest'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AuthLandingScreen;

const styles = StyleSheet.create({
  safeArea: {flex: 1},
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoBg: {
    position: 'absolute',
    top: height * 0.15,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: height * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    borderRadius: 50,
    borderWidth: 1.2,
    paddingVertical: height * 0.02,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  guestText: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
    fontStyle: 'italic',
  },
});
