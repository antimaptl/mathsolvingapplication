import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  Animated,
  StatusBar,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stopBackgroundMusic } from '../Globalfile/playBackgroundMusic';
import {
  initSound,
  playEffect,
  stopEffect,
  releaseAll,
} from '../Globalfile/SoundManager';
import { useTheme } from '../Globalfile/ThemeContext';
import { useSound } from '../../Context/SoundContext';
import { KEYPAD_LAYOUTS } from '../Globalfile/keyboardLayouts';

const { width, height } = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const getMathSymbol = word =>
({
  Sum: '+',
  Difference: '-',
  Product: '*',
  Quotient: '/',
  Modulus: '%',
  Exponent: '^',
}[word] || word);

const MathInputScreen = () => {
  const appState = useRef(AppState.currentState);
  const startTimeRef = useRef(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, keyboardTheme } = useTheme();
  const { difficulty, symbol, timer, qm } = route.params;

  const currentLayout = KEYPAD_LAYOUTS[keyboardTheme] || KEYPAD_LAYOUTS.default;
  const isCustomKeyboard = keyboardTheme === 'type1' || keyboardTheme === 'type2';

  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [minutes, setMinutes] = useState(Math.floor(timer / 60));
  const [seconds, setSeconds] = useState(timer % 60);
  const [animateWatch] = useState(new Animated.Value(1));
  const { isSoundOn, toggleSound } = useSound();
  const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);

  const totalTimeRef = useRef(timer);
  const scoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const skippedCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const beepPlayingRef = useRef(false);
  const isSoundOnRef = useRef(true);
  const last10PlayedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [qmState, setQmState] = useState(parseInt(qm, 10));

  const getKeyButtonWidth = () => {
    // All layouts use standard width now (4 columns primarily)
    return width * 0.2;
  };

  const getKeyButtonHeight = () => {
    // 4 rows standard height
    return height * 0.1;
  };

  useEffect(() => {
    isSoundOnRef.current = isSoundOn;
    if (!isSoundOn) {
      stopEffect('ticktock');
      stopEffect('timer');
      last10PlayedRef.current = false;
    }
  }, [isSoundOn]);

  useFocusEffect(
    useCallback(() => {
      initSound('correct', 'rightanswer.mp3');
      initSound('incorrect', 'wronganswerr.mp3');
      initSound('skipped', 'skip.mp3');
      initSound('timer', 'every30second.wav');
      initSound('ticktock', 'ticktock.mp3');
    }, []),
  );

  useEffect(() => {
    fetchQuestion();
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = timer - elapsed;
      totalTimeRef.current = remaining;
      setMinutes(Math.floor(remaining / 60));
      setSeconds(remaining % 60);

      if (remaining <= 10 && remaining > 0) {
        if (!last10PlayedRef.current) {
          playEffect('ticktock', isSoundOnRef.current);
          last10PlayedRef.current = true;
        }
        Animated.sequence([
          Animated.timing(animateWatch, { toValue: 1.4, duration: 300, useNativeDriver: true }),
          Animated.timing(animateWatch, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }

      if (remaining % 30 === 0 && remaining !== timer && remaining > 0) {
        setIsThirtySecPhase(true);
        playEffect('timer', isSoundOnRef.current);
        Animated.sequence([
          Animated.timing(animateWatch, { toValue: 1.4, duration: 300, useNativeDriver: true }),
          Animated.timing(animateWatch, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setIsThirtySecPhase(false);
        });
      }

      if (remaining <= 0) {
        clearInterval(interval);
        stopEffect('ticktock');
        const incorrectCount = incorrectCountRef.current;
        const attempted = correctAnswersRef.current + incorrectCount;
        const correctPercentage = attempted > 0 ? Math.round((correctAnswersRef.current / attempted) * 100) : 0;
        navigation.replace('WellDoneScreen', {
          totalScore: scoreRef.current,
          correctCount: correctAnswersRef.current,
          inCorrectCount: incorrectCount,
          skippedQuestions: skippedCountRef.current,
          correctPercentage,
          difficulty,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        stopEffect('ticktock');
      } else {
        if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
          playEffect('ticktock', isSoundOnRef.current);
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        const remaining = timer - elapsed;
        totalTimeRef.current = remaining;
        setMinutes(Math.floor(remaining / 60));
        setSeconds(remaining % 60);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const fetchQuestion = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setQuestion('Authorization token missing');
        return;
      }
      const params = new URLSearchParams({ difficulty, symbol, qm: qmState.toString() });
      const response = await fetch(`http://43.204.167.118:3000/api/question?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      const q = data.question;
      setQuestion(`${String(q.input1)} ${getMathSymbol(q.symbol)} ${String(q.input2)}`);
      setCorrectAnswer(String(q.answer));
    } catch {
      setQuestion('Failed to load question.');
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };

  const handleToggleSound = () => {
    toggleSound();
    const newVal = !isSoundOn;
    isSoundOnRef.current = newVal;
    if (!newVal) {
      stopEffect('ticktock');
    } else {
      if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
        last10PlayedRef.current = false;
        playEffect('ticktock', true);
      }
    }
  };

  const handlePress = value => {
    if (isPaused || totalTimeRef.current <= 0 || isLoading || feedback) return;

    const key = value.toString().toLowerCase();

    if (key === 'clear' || key === 'clr') return setInput('');

    if (key === '⌫' || key === 'del') {
      return setInput(prev => prev.slice(0, -1));
    }

    if (key === 'skip' || key === 'ref') {
      setFeedback('skipped');
      playEffect('skipped', isSoundOnRef.current);
      setSkippedCount(prev => {
        skippedCountRef.current = prev + 1;
        return prev + 1;
      });
      return setTimeout(() => {
        fetchQuestion();
        setFeedback(null);
      }, 1000);
    }

    if (key === 'pm') {
      return setInput(prev => {
        if (prev.startsWith('-')) return prev.slice(1);
        return '-' + prev;
      });
    }

    const newInput = input + value;
    setInput(newInput);

    if (newInput.length >= correctAnswer.length) {
      const isCorrect = newInput === correctAnswer;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      playEffect(isCorrect ? 'correct' : 'incorrect', isSoundOnRef.current);

      setTimeout(() => {
        if (isCorrect) {
          scoreRef.current += 2;
          correctAnswersRef.current += 1;
          setScore(scoreRef.current);
          setCorrectAnswers(correctAnswersRef.current);
          setQmState(qmState + 2);
        } else {
          scoreRef.current -= 1;
          incorrectCountRef.current += 1;
          setScore(scoreRef.current);
          if (
            (difficulty === 'easy' && qmState > 0) ||
            (difficulty === 'medium' && qmState > 6) ||
            (difficulty === 'hard' && qmState > 18)
          ) {
            setQmState(qmState - 1);
          }
        }
        fetchQuestion();
        setFeedback(null);
      }, 1500);
    }
  };

  const Content = () => (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 30 }]}>
      <View style={[styles.topBar, { backgroundColor: theme.cardBackground || '#1E293B' }]}>
        <TouchableOpacity onPress={() => { stopEffect('ticktock'); navigation.goBack(); }} style={styles.iconButton}>
          <Icon name="caret-back-outline" size={scaleFont(24)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Animated.Image source={require('../Screens/Image/Stopwatch.png')} style={[styles.timerIcon, { transform: [{ scale: animateWatch }], tintColor: minutes * 60 + seconds <= 10 || isThirtySecPhase ? 'red' : '#fff' }]} />
          <Text style={styles.timerText}>{`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}</Text>
        </View>
        <TouchableOpacity onPress={handleToggleSound} style={styles.iconButton1}>
          <Icon name={isSoundOn ? 'volume-high' : 'volume-mute'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.question}>{question}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: height * 0.04 }}>
        <View style={[styles.answerBox, { backgroundColor: theme.cardBackground || '#1E293B' }, feedback === 'correct' ? { borderColor: 'green', borderWidth: 2 } : feedback === 'incorrect' ? { borderColor: 'red', borderWidth: 2 } : feedback === 'skipped' ? { borderColor: 'orange', borderWidth: 2 } : {}]}>
          <Text style={[styles.answerText, feedback === 'correct' ? { color: 'green' } : feedback === 'incorrect' ? { color: 'red' } : feedback === 'skipped' ? { color: 'orange' } : {}]}>
            {input || (feedback === 'correct' ? 'Correct' : feedback === 'incorrect' ? 'Incorrect' : feedback === 'skipped' ? 'Skipped' : '')}
          </Text>
        </View>
      </View>

      <View style={styles.keypadContainer}>
        {currentLayout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, index) => {
              const strItem = item.toString().toLowerCase();
              const isSpecial = ['clear', 'clr', '⌫', 'del', 'ref', 'pm'].includes(strItem);
              const isSkip = strItem === 'skip';
              const isNa = strItem === 'Na';

              if (isNa) return <View key={index} style={{ width: getKeyButtonWidth(), height: getKeyButtonHeight() }} />;

              let content;
              // Explicitly handle all known types to ensure nothing is missed
              if (strItem === 'del' || strItem === '⌫') {
                content = <MaterialIcons name="backspace" size={24} color="#fff" />;
              } else if (strItem === 'ref') {
                content = <MaterialIcons name="refresh" size={26} color="#fff" />;
              } else if (strItem === 'pm') {
                content = <Text style={[styles.keyText, { color: '#fff' }]}>+/-</Text>;
              } else if (strItem === 'clr' || strItem === 'clear') {
                content = <Text style={[styles.keyText, { color: '#fff' }]}>Clear</Text>;
              } else if (strItem === 'skip') {
                content = (
                  <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                    <Text style={[styles.keyText, { fontSize: scaleFont(14) }]}>Skip</Text>
                    <MaterialIcons name="skip-next" size={24} color="#fff" />
                  </View>
                );
              } else {
                // Default for numbers, '.', '-', etc.
                content = <Text style={styles.keyText}>{item.toUpperCase()}</Text>;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePress(item)}
                  style={[
                    styles.keyButton,
                    { width: getKeyButtonWidth(), height: getKeyButtonHeight() },
                    (isSpecial || strItem === '-') ? styles.specialKey : null
                  ]}>
                  {isSkip ? (
                    <LinearGradient colors={theme.buttonGradient || ['#FFAD90', '#FF4500']} style={[styles.gradientButton, { opacity: 0.8 }]}>
                      {content}
                    </LinearGradient>
                  ) : (!isSpecial && strItem !== '-') ? (
                    <LinearGradient colors={theme.buttonGradient || [theme.primaryColor || '#595CFF', theme.secondaryColor || '#87AEE9']} style={styles.gradientButton}>
                      {content}
                    </LinearGradient>
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      {content}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <LinearGradient colors={theme.buttonGradient || ['#FB923C', '#FF7F50']} style={styles.playButton}>
        <TouchableOpacity onPress={() => console.log('Play pressed')} style={{ width: '100%', alignItems: 'center' }}>
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor || '#0B1220' }}>
      <Content />
    </View>
  );
};

export default MathInputScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginBottom: height * 0.05,
    borderBottomEndRadius: 15,
    borderBottomStartRadius: 15,
  },
  iconButton: {
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton1: {
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timerText: {
    color: '#fff',
    fontSize: scaleFont(13),
    fontWeight: '600',
    opacity: 0.7,
  },
  timerIcon: { width: 18, height: 18 },
  question: {
    fontSize: scaleFont(22),
    color: '#fff',
    textAlign: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.02,
    fontWeight: 'bold',
  },
  answerBox: {
    width: width * 0.6,
    height: height * 0.06,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: '27%',
  },
  answerText: { fontSize: scaleFont(18), color: '#fff', fontWeight: '600' },
  keypadContainer: { width: '100%' },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  keyButton: {
    width: width * 0.2,
    height: height * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1C2433',
  },
  specialKey: { backgroundColor: '#1C2433' },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  keyText: { fontSize: scaleFont(18), color: '#fff', fontWeight: '600' },
  playButton: {
    marginTop: height * 0.04,
    width: width * 0.5,
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: height * 0.015,
  },
  playButtonText: { color: '#fff', fontSize: scaleFont(18), fontWeight: 'bold' },
});
