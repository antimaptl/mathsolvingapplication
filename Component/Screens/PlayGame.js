import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  PixelRatio,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import {
  playBackgroundMusic,
  stopBackgroundMusic,
} from '../Globalfile/playBackgroundMusic';
import {useTheme} from '../Globalfile/ThemeContext'; // ✅ Theme import

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const PlayGame = ({route}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {gametype} = route.params || {};
  const {theme} = useTheme(); // ✅ Get current theme
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [selectedTimer, setSelectedTimer] = useState('1 Minute');
  const [selectedSymbol, setSelectedSymbol] = useState('(+), (-), (x) and (/)');

  const gameMusicRef = useRef(null);
  useEffect(() => {
    gameMusicRef.current = new Sound(
      'startgame.mp3',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) return console.log('Failed to load game music', error);
        gameMusicRef.current.play(() => gameMusicRef.current.release());
      },
    );

    return () => {
      if (gameMusicRef.current) {
        gameMusicRef.current.stop(() => gameMusicRef.current.release());
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      stopBackgroundMusic();
      return () => {};
    }, []),
  );

  AsyncStorage.getItem('diff').then(diff => {
    setSelectedDifficulty(diff || 'easy');
  });

  // ✅ Dynamic theme-based selected option
  const renderOption = (label, selected, onPress) => (
    <TouchableOpacity onPress={onPress}>
      {selected ? (
        <LinearGradient
          colors={theme.buttonGradient || ['#595CFF', '#87AEE9']}
          style={styles.selectedOptionButton}>
          <Text style={styles.selectedOptionText}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.optionButton}>
          <Text style={styles.optionText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const handlePlayPress = async () => {
    try {
      let timerInSeconds = 60;
      if (selectedTimer === '2 Minute') timerInSeconds = 120;
      else if (selectedTimer === '3 Minute') timerInSeconds = 180;

      let symbolValue = 'sum,difference';
      if (selectedSymbol === '(+), (-), (x) and (/)')
        symbolValue = 'sum,difference,product,quotient';

      let storedQm = '0';
      if (selectedDifficulty === 'medium') storedQm = '6';
      else if (selectedDifficulty === 'hard') storedQm = '18';

      await AsyncStorage.setItem('qm', storedQm);

      const params = {
        difficulty: selectedDifficulty,
        symbol: symbolValue,
        qm: parseInt(storedQm),
        timer: timerInSeconds,
      };

      navigation.navigate(
        gametype === 'play' ? 'MathInputScreen' : 'Lobby',
        params,
      );
    } catch (error) {
      console.error('❌ Error during handlePlayPress:', error);
    }
  };

  const Content = () => (
    <ScrollView
      contentContainerStyle={[styles.container, {paddingTop: insets.top + 30}]}>
      <StatusBar
        backgroundColor={
          theme.backgroundGradient ? theme.backgroundGradient[0] : '#0B1220'
        }
        barStyle="light-content"
      />
      <View style={{flexDirection: 'row', gap: width * 0.025}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}>
          <Icon name="chevron-back" size={scaleFont(18)} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Play Game</Text>

      {/* Difficulty Section */}
      <Text style={styles.sectionTitle}>Select Difficulty</Text>
      <View style={styles.row}>
        {renderOption('Easy', selectedDifficulty === 'easy', async () => {
          await AsyncStorage.setItem('diff', 'easy');
          setSelectedDifficulty('easy');
        })}
        {renderOption('Medium', selectedDifficulty === 'medium', async () => {
          await AsyncStorage.setItem('diff', 'medium');
          setSelectedDifficulty('medium');
        })}
        {renderOption('Hard', selectedDifficulty === 'hard', async () => {
          await AsyncStorage.setItem('diff', 'hard');
          setSelectedDifficulty('hard');
        })}
      </View>

      {/* Timer Section */}
      <Text style={styles.sectionTitle}>Timer</Text>
      <View style={styles.row}>
        {renderOption('1 Minute', selectedTimer === '1 Minute', () =>
          setSelectedTimer('1 Minute'),
        )}
        {renderOption('2 Minute', selectedTimer === '2 Minute', () =>
          setSelectedTimer('2 Minute'),
        )}
        {renderOption('3 Minute', selectedTimer === '3 Minute', () =>
          setSelectedTimer('3 Minute'),
        )}
      </View>

      {/* Symbol Section */}
      <Text style={styles.sectionTitle}>Symbol</Text>
      <View style={styles.row1}>
        {renderOption('(+) and (-)', selectedSymbol === '(+) and (-)', () =>
          setSelectedSymbol('(+) and (-)'),
        )}
        {renderOption(
          '(+), (-), (x) and (/)',
          selectedSymbol === '(+), (-), (x) and (/)',
          () => setSelectedSymbol('(+) , (-), (x) and (/)'),
        )}
      </View>

      {/* ✅ Themed Gradient Play Button */}
      <LinearGradient
        colors={[
          theme.primary || '#FB923C',
          theme.primary || '#FF7F50',
        ]}
        style={styles.playButton}>
        <TouchableOpacity
          onPress={handlePlayPress}
          style={{width: '100%', alignItems: 'center'}}>
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{flex: 1, backgroundColor: '#0B1220'}}>
      <Content />
    </View>
  );
};

export default PlayGame;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: width * 0.07,
    paddingBottom: height * 0.07,
  },
  iconButton: {
    width: width * 0.06,
    height: width * 0.06,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: scaleFont(33),
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: height * 0.04,
    marginTop: height * 0.05,
    fontFamily: 'jaro',
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    color: '#fff',
    marginBottom: height * 0.012,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.025,
    marginBottom: height * 0.015,
    justifyContent: 'space-between',
  },
  row1: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: width * 0.025,
    marginBottom: height * 0.015,
  },
  optionButton: {
    backgroundColor: '#1E293B',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.052,
    borderRadius: 0,
    marginRight: width * 0.025,
    marginTop: height * 0.01,
  },
  optionText: {
    color: '#ccc',
    fontSize: scaleFont(14),
  },
  selectedOptionButton: {
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.04,
    borderRadius: 0,
    marginRight: width * 0.025,
    marginTop: height * 0.01,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scaleFont(14),
  },
  playButton: {
    marginTop: height * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: 20,
    width: width * 0.6,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
});
