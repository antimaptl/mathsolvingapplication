// Screens/ThemeSelectorScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme, themes} from '../Globalfile/ThemeContext';
import KeyboardSelector from '../Screens/KeyboardSelector';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const ThemeSelectorScreen = () => {
  const navigation = useNavigation();
  const {theme, changeTheme} = useTheme();
  const [selectedTab, setSelectedTab] = useState('colors'); // colors / keyboard

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <View style={{alignItems: 'center', marginBottom: 20, flexDirection: 'row',}}>
        <TouchableOpacity
        style={{position: 'absolute',end: "50%",bottom: 20,}}
          onPress={() => {
            navigation.goBack();
          }}>
          <Icon name="arrow-back" size={normalize(25)} color="#808080" />
        </TouchableOpacity>
        <Text style={[styles.title, {color: theme.text}]}>🎨 THEME</Text>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTab === 'colors' && styles.activeToggle,
          ]}
          onPress={() => setSelectedTab('colors')}>
          <Text
            style={[
              styles.toggleText,
              selectedTab === 'colors' && styles.activeToggleText,
            ]}>
            Colors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTab === 'keyboard' && styles.activeToggle,
          ]}
          onPress={() => setSelectedTab('keyboard')}>
          <Text
            style={[
              styles.toggleText,
              selectedTab === 'keyboard' && styles.activeToggleText,
            ]}>
            Keyboard
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'colors' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {Object.keys(themes).map(key => {
            const t = themes[key];
            return (
              <TouchableOpacity
                key={key}
                onPress={() => changeTheme(key)}
                style={styles.pillContainer}
                activeOpacity={0.8}>
                {/* Pill Gradient */}
                <LinearGradient
                  colors={t.backgroundGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.pill}>
                  <Text style={[styles.pillText, {color: t.text}]}>
                    {t.name}
                  </Text>
                </LinearGradient>

                {/* Small circle below */}
                <LinearGradient
                  colors={t.backgroundGradient}
                  start={{x: 0.3, y: 0}}
                  end={{x: 0.7, y: 1}}
                  style={styles.circle}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <KeyboardSelector />
      )}

      <Text style={[styles.current, {color: theme.primary}]}>
        {selectedTab === 'colors'
          ? `Current Theme: ${theme.name}`
          : `Selected Keyboard: ${''}`}
      </Text>
    </LinearGradient>
  );
};

export default ThemeSelectorScreen;

const styles = StyleSheet.create({
  container: {flex: 1, paddingVertical: 30, alignItems: 'center'},
  title: {fontSize: 22, fontWeight: '700', marginBottom: 20},
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C2433',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
    width: '90%',
    justifyContent: 'center',
  },
  toggleButton: {paddingVertical: 10, paddingHorizontal: 60},
  toggleText: {fontSize: 16, color: '#fff'},
  activeToggle: {
    backgroundColor: '#595CFF',
    width: '60%',
    alignItems: 'center',
  },
  activeToggleText: {fontWeight: '700'},
  scroll: {
    alignItems: 'center',
    paddingBottom: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  // 🔹 Pill style (vertical shape)
  pill: {
    width: 60,
    height: 200,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginLeft: 15,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    transform: [{rotate: '-90deg'}],
  },

  // 🔹 Circle below pill
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.9,
    marginLeft: 25,
  },

  current: {fontSize: 16, marginTop: 20},
});
