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
  Modal,
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
import {useTheme} from '../Globalfile/ThemeContext';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const PlayGame = ({route}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {gametype} = route.params || {};
  const {theme} = useTheme();

  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [selectedTimer, setSelectedTimer] = useState('1 Minute');
  const [selectedSymbol, setSelectedSymbol] = useState('(+), (-), (x) and (/)');
  const [selectedOpponent, setSelectedOpponent] = useState('Random'); // ✅ NEW STATE
  const [showOpponentDropdown, setShowOpponentDropdown] = useState(false); // ✅ NEW STATE

  const gameMusicRef = useRef(null);

  // ✅ Load saved settings
  useEffect(() => {
    AsyncStorage.getItem('diff').then(diff => {
      setSelectedDifficulty(diff || 'easy');
    });
    AsyncStorage.getItem('timer').then(t => {
      setSelectedTimer(t || '1 Minute');
    });
    AsyncStorage.getItem('symbol').then(s => {
      setSelectedSymbol(s || '(+), (-), (x) and (/)');
    });
    AsyncStorage.getItem('opponent').then(opp => {
      setSelectedOpponent(opp || 'Random');
    });
  }, []);

  const renderOption = (label, selected, onPress) => (
    <TouchableOpacity onPress={onPress}>
      {selected ? (
        <LinearGradient
          colors={theme.buttonGradient || ['#595CFF', '#87AEE9']}
          style={styles.selectedOptionButton}>
          <Text style={styles.selectedOptionText}>{label}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.optionButton,
            {backgroundColor: theme.cardBackground || '#1E293B'},
          ]}>
          <Text style={styles.optionText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ✅ OPPONENT OPTIONS
  const opponentOptions = ['Random', 'Computer', 'Friends'];

  // ✅ HANDLE OPPONENT SELECT
  const handleOpponentSelect = async opponent => {
    setSelectedOpponent(opponent);
    await AsyncStorage.setItem('opponent', opponent);
    setShowOpponentDropdown(false);
  };

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

      // ✅ PRACTICE MODE (UNCHANGED)
      if (gametype === 'PRACTICE') {
        navigation.navigate('MathInputScreen', {
          difficulty: selectedDifficulty,
          symbol: symbolValue,
          qm: parseInt(storedQm),
          timer: timerInSeconds,
        });
        return;
      }

      // ✅ MULTIPLAYER CONFIG
      const gameConfig = {
        difficulty: selectedDifficulty,
        symbol: symbolValue,
        qm: parseInt(storedQm),
        timer: timerInSeconds,
      };

      // ✅ FIXED FLOW (Random ≠ direct lobby)
      navigation.navigate('SelectOpponent', {
        gametype,
        gameConfig,
        preSelectedOpponent: selectedOpponent, // Random | Computer | Friends
      });
    } catch (error) {
      console.error('❌ Error during handlePlayPress:', error);
    }
  };

  const Content = () => (
    <ScrollView
      contentContainerStyle={[styles.container, {paddingTop: insets.top + 40}]}>
      <View style={{flexDirection: 'row', gap: width * 0.025}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}>
          <Icon name="caret-back-outline" size={scaleFont(26)} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>
        {gametype === 'PRACTICE' ? 'Practice Game' : 'Play Game'}
      </Text>
      <View
        style={{
          borderWidth: 1,
          bottom: '1%',
          borderColor: '#ffffff',
          opacity: 0.5,
          marginHorizontal: -width * 0.05,
          marginBottom: height * 0.04,
        }}></View>

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
        {renderOption('1 Minute', selectedTimer === '1 Minute', async () => {
          await AsyncStorage.setItem('timer', '1 Minute');
          setSelectedTimer('1 Minute');
        })}
        {renderOption('2 Minute', selectedTimer === '2 Minute', async () => {
          await AsyncStorage.setItem('timer', '2 Minute');
          setSelectedTimer('2 Minute');
        })}
        {renderOption('3 Minute', selectedTimer === '3 Minute', async () => {
          await AsyncStorage.setItem('timer', '3 Minute');
          setSelectedTimer('3 Minute');
        })}
      </View>

      {/* Symbol Section */}
      <Text style={styles.sectionTitle}>Symbol</Text>
      <View style={styles.row1}>
        {renderOption(
          '(+) and (-)',
          selectedSymbol === '(+) and (-)',
          async () => {
            await AsyncStorage.setItem('symbol', '(+) and (-)');
            setSelectedSymbol('(+) and (-)');
          },
        )}
        {renderOption(
          '(+), (-), (x) and (/)',
          selectedSymbol === '(+), (-), (x) and (/)',
          async () => {
            await AsyncStorage.setItem('symbol', '(+), (-), (x) and (/)');
            setSelectedSymbol('(+), (-), (x) and (/)');
          },
        )}
      </View>

      {/* ✅ OPPONENT DROPDOWN SECTION - Only for Multiplayer */}
      {gametype !== 'PRACTICE' && (
        <>
          <Text style={styles.sectionTitle}>VS</Text>
          <TouchableOpacity
            onPress={() => setShowOpponentDropdown(true)}
            style={[
              styles.dropdownButton,
              {backgroundColor: theme.cardBackground || '#1E293B'},
            ]}>
            <Text style={styles.dropdownText}>{selectedOpponent}</Text>
            <Icon name="chevron-down" size={20} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Play Button */}
      <LinearGradient
        colors={[theme.primary || '#FB923C', theme.primary || '#FF7F50']}
        style={styles.playButton}>
        <TouchableOpacity
          onPress={handlePlayPress}
          style={{width: '100%', alignItems: 'center'}}>
          <Text style={styles.playButtonText}>
            {gametype === 'PRACTICE' ? 'Start Practice' : 'Start Game'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ✅ OPPONENT DROPDOWN MODAL */}
      <Modal
        visible={showOpponentDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOpponentDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOpponentDropdown(false)}>
          <View style={styles.dropdownModal}>
            {opponentOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleOpponentSelect(option)}
                style={[
                  styles.dropdownOption,
                  selectedOpponent === option && {
                    backgroundColor: theme.primary || '#d35231ff',
                  },
                ]}>
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedOpponent === option && {color: '#fff'},
                  ]}>
                  {option}
                </Text>
                {selectedOpponent === option && (
                  <Icon name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: width * 0.06,
    paddingBottom: height * 0.07,
  },
  iconButton: {
    width: width * 0.06,
    height: width * 0.07,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: scaleFont(25),
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: height * 0.04,
    marginTop: height * -0.04,
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
    marginRight: width * 0.02,
    marginTop: height * 0.01,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: scaleFont(14),
  },
  // ✅ DROPDOWN STYLES
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    marginBottom: height * 0.015,
  },
  dropdownText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 8,
    width: width * 0.7,
    maxHeight: height * 0.4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
  },
  dropdownOptionText: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: '600',
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
