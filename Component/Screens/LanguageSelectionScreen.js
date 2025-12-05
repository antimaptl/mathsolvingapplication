import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../Globalfile/ThemeContext';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../Globalfile/localization/i18n';

const { width, height } = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const LanguageSelectionScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(null);

  const languages = [
    { id: 1, label: 'English', code: 'en' },
    { id: 2, label: 'हिंदी', code: 'hi' },
    { id: 3, label: 'Español', code: 'es' },
    { id: 4, label: '中文', code: 'zh' },
  ];

useEffect(() => {
  const setFirstLaunchFlag = async () => {
    await AsyncStorage.setItem('firstLaunch', 'false');
  };
  setFirstLaunchFlag();
}, []);

  const primaryColor = theme?.primary || '#FB923C';

  const handleLanguageSelect = async lang => {
    setSelectedLang(lang.id);
    await AsyncStorage.setItem('appLanguage', lang.code);
    i18n.changeLanguage(lang.code); // 🔹 instantly change
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {theme.backgroundGradient ? (
        <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
          {/* 🌍 Header */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../Screens/Image/language1.png')}
              style={styles.languageIcon}
            />
            <Text style={styles.title}>{t('Select your preferred language')}</Text>
          </View>

          {/* 🌐 Language List */}
          <View style={styles.languageContainer}>
            {languages.map(lang => (
              <TouchableOpacity
                key={lang.id}
                onPress={() => handleLanguageSelect(lang)}
                activeOpacity={0.7}
                style={[
                  styles.langButton,
                  {
                    borderColor:
                      selectedLang === lang.id ? primaryColor : '#ffffff40',
                    backgroundColor:
                      selectedLang === lang.id ? '#ffffff20' : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.langText,
                    {
                      color: selectedLang === lang.id ? '#fff' : '#e0e0e0',
                    },
                  ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🚀 Continue */}
          <TouchableOpacity
            disabled={!selectedLang}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LanguageConfirmationScreen', { selectedLanguage: languages.find(l => l.id === selectedLang).label })}
            style={[
              styles.continueButton,
              { backgroundColor: primaryColor, opacity: selectedLang ? 1 : 0.6 },
            ]}>
            <Text style={styles.continueText}>{t('CONTINUE')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <View style={[styles.container, { backgroundColor: theme.backgroundColor || '#0B1220' }]} />
      )}
    </SafeAreaView>
  );
};

export default LanguageSelectionScreen;

// ✅ Make sure this part is BELOW the component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.07,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  languageIcon: {
    width: width * 0.18,
    height: width * 0.18,
    resizeMode: 'contain',
    marginBottom: height * 0.015,
  },
  title: {
    fontSize: scaleFont(20),
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 28,
  },
  languageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  langButton: {
    width: '90%',
    borderWidth: 1,
    borderRadius: width * 0.03,
    paddingVertical: height * 0.018,
    marginVertical: height * 0.012,
    alignItems: 'center',
  },
  langText: {
    fontSize: scaleFont(18),
    fontWeight: '600',
  },
  continueButton: {
    width: width * 0.6,
    height: height * 0.065,
    borderRadius: width * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
});
