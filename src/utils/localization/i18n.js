import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔹 Language Resources
const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      play: "Play",
      continue: "Continue",
      select_language: "Select your preferred language",
    },
  },
  hi: {
    translation: {
      welcome: "स्वागत है",
      play: "खेलें",
      continue: "जारी रखें",
      select_language: "अपनी पसंदीदा भाषा चुनें",
    },
  },
  es: {
    translation: {
      welcome: "Bienvenido",
      play: "Jugar",
      continue: "Continuar",
      select_language: "Seleccione su idioma preferido",
    },
  },
  zh: {
    translation: {
      welcome: "欢迎",
      play: "玩",
      continue: "继续",
      select_language: "选择您喜欢的语言",
    },
  },
};

// 🔹 Initialize function (async-safe)
const initI18n = async () => {
  try {
    // Get saved language from AsyncStorage
    const storedLang = await AsyncStorage.getItem('appLanguage');

    // 🔹 Default to English since RNLocalize is removed
    const selectedLang = storedLang || 'en';

    // Initialize i18next
    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v3',
      resources,
      lng: selectedLang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      react: {
        useSuspense: false,
      },
    });

    console.log('✅ i18n initialized with language:', selectedLang);
  } catch (error) {
    console.log('⚠️ Error initializing i18n:', error);
  }
};

// 🔹 Run initialization
initI18n();

export default i18n;
