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
    buttonGradient: ['#595CFF', '#87AEE9'],
  },
  blue: {
    name: 'Blue Nova',
    backgroundGradient: ['#0A192F', '#112D4E', '#1B4F72'], 
    text: '#E3F2FD', 
    primary: '#00BFFF', 
    buttonGradient: ['#0D47A1', '#1976D2'],
  },
  purple: {
    name: 'Purple Galaxy',
    backgroundGradient: ['#2E003E', '#3D0075', '#6A00B5'],
    text: '#FFFFFF',
    primary: '#F5B3FF',
    buttonGradient: ['#3D0075', '#6A00B5'],
  },
  teal: {
    name: 'Teal Fusion',
    backgroundGradient: ['#012E40', '#026773', '#3CA6A6'],
    text: '#FFFFFF',
    primary: '#F7DC6F',
    buttonGradient: ['#026773', '#3CA6A6'],
  },
  pink: {
    name: 'Pink Sunset',
    backgroundGradient: ['#33001b', '#ff0084'],
    text: '#FFFFFF',
    primary: '#FFC0CB',
    buttonGradient: ['#FF0084', '#00cccc'],
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
