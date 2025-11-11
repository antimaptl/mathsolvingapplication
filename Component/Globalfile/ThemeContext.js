// ThemeContext.js
import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  dark: {
    name: 'Dark',
    backgroundGradient: ['#0B1220', '#0B1220'],
    text: '#FFFFFF',
    primary: '#FB923C',
    cardBackground : '#1E293B',
    buttonGradient: ['#595CFF', '#87AEE9'],
    subText:'#bdb8b8ff'
  },
  blue: {
    name: 'Blue Nova',
    backgroundGradient: ['#0A192F', '#112D4E', '#1B4F72'], 
    text: '#E3F2FD', 
    primary: '#00BFFF', 
    cardBackground : '#1E293B',
    buttonGradient: ['#0D47A1', '#1976D2'],
    subText:'#bdb8b8ff'
  },
  purple: {
    name: 'Purple Galaxy',
    backgroundGradient: ['#2E003E', '#3D0075', '#6A00B5'],
    text: '#FFFFFF',
    primary: '#a346b1ff',
    cardBackground : '#1F0A36',
    buttonGradient: ['#3D0075', '#6A00B5'],
    subText:'#bdb8b8ff'
  },
  teal: {
    name: 'Teal Fusion',
    backgroundGradient: ['#012E40', '#026773', '#3CA6A6'],
    text: '#FFFFFF',
    primary: '#074963ff',
    cardBackground : '#0d4a56ff',
    buttonGradient: ['#026773', '#3CA6A6'],
    subText:'#bdb8b8ff'
  },
  pink: {
    name: 'Pink Sunset',
    backgroundGradient: ['#33001b', '#ff0084'],
    text: '#FFFFFF',
    primary: '#ff6bb5',
    cardBackground : '#4A1A2C',
    buttonGradient: ['#c62d7cff', '#ed81a3ff'],
    subText:'#bdb8b8ff'
  },
};

export const ThemeProvider = ({children}) => {
  const [theme, setTheme] = useState(themes.dark);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('theme');
      if (saved && themes[saved]) {
        setTheme(themes[saved]);
      }
    })();
  }, []);

  const changeTheme = async selected => {
    setTheme(themes[selected]);
    await AsyncStorage.setItem('theme', selected);
  };

  return (
    <ThemeContext.Provider value={{theme, changeTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
