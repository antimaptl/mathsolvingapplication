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
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const ThemeSelectorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const from = route.params?.from || 'settings'; // default settings
  const {theme, changeTheme} = useTheme();
  const [selectedTab, setSelectedTab] = useState('colors');

  const handleNext = () => {
    navigation.replace('AddFriendScreen');
  };

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View
        style={{alignItems: 'center', marginBottom: 20, flexDirection: 'row'}}>
        {/*  Show Back Button only if NOT from onboarding */}
        {from !== 'onboarding' && (
          <TouchableOpacity
            style={{position: 'absolute', left: 20, bottom: 20}}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={normalize(25)} color="#808080" />
          </TouchableOpacity>
        )}
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

      {/* Theme or Keyboard Section */}
      {selectedTab === 'colors' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {Object.keys(themes).map(key => {
            const t = themes[key];
            const isSelected = theme.name === t.name;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => changeTheme(key)}
                style={styles.pillContainer}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={t.backgroundGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.pill}>
                  <Text style={[styles.pillText, {color: t.text}]}>
                    {t.name}
                  </Text>
                </LinearGradient>

                <View style={{alignItems: 'center', justifyContent: 'center'}}>
                  <LinearGradient
                    colors={t.backgroundGradient}
                    start={{x: 0.3, y: 0}}
                    end={{x: 0.7, y: 1}}
                    style={styles.circle}>
                    {isSelected && (
                      <Icon
                        name="checkmark"
                        size={normalize(20)}
                        color="#fff"
                        style={{alignSelf: 'center', fontWeight: 'bold'}}
                      />
                    )}
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <KeyboardSelector />
      )}

      {/* ✅ Only show NEXT button if onboarding */}
      {from === 'onboarding' && (
        <TouchableOpacity
          style={[styles.nextButton, {backgroundColor: theme.primary}]}
          onPress={handleNext}>
          <Text style={[styles.nextText, {color: theme.buttonText || '#fff'}]}>
            Next
          </Text>
        </TouchableOpacity>
      )}
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
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.9,
    marginLeft: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 25,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
