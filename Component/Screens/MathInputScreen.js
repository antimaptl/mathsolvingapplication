import React, {useState, useEffect, useRef, useCallback} from 'react';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {stopBackgroundMusic} from '../Globalfile/playBackgroundMusic';
import {
  initSound,
  playEffect,
  stopEffect,
  releaseAll,
} from '../Globalfile/SoundManager';
import {useTheme} from '../Globalfile/ThemeContext';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const numPad = [
  ['7', '8', '9', '-'],
  ['4', '5', '6', '.'],
  ['1', '2', '3', 'na'],
  ['Clear', '0', '⌫', 'skip'],
];

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
  const {theme} = useTheme();
  const {difficulty, symbol, timer, qm} = route.params;

  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [minutes, setMinutes] = useState(Math.floor(timer / 60));
  const [seconds, setSeconds] = useState(timer % 60);
  const [animateWatch] = useState(new Animated.Value(1));
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);

  const totalTimeRef = useRef(timer);
  const scoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const skippedCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const beepPlayingRef = useRef(false);
  const isSoundOnRef = useRef(true);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [qmState, setQmState] = useState(parseInt(qm, 10));

  useFocusEffect(
    useCallback(() => {
      // stopBackgroundMusic();
      initSound('correct', 'rightanswer.mp3');
      initSound('incorrect', 'wronganswer.mp3');
      initSound('skipped', 'skip.mp3');
      // 🔇 Commented out keypad and beep initialization
      // initSound('keypad', 'keypad.mp3');
      initSound('timer', 'every30second.wav');
      initSound('ticktock', 'ticktock.mp3');
      // initSound('beep', 'beep.mp3');
    }, []),
  );

  useEffect(() => {
    fetchQuestion();

    // Timer start time
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      const remaining = timer - elapsed;

      totalTimeRef.current = remaining;

      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setMinutes(mins);
      setSeconds(secs);

      // 🔔 Last 10 seconds ticktock
      if (remaining <= 10 && remaining > 0) {
        playEffect('ticktock', isSoundOnRef.current);
        Animated.sequence([
          Animated.timing(animateWatch, {
            toValue: 1.4,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animateWatch, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // 🔔 Every 30 seconds
      if (remaining % 30 === 0 && remaining !== timer && remaining > 0) {
        setIsThirtySecPhase(true);
        let repeatCount = 0;

        const secInterval = setInterval(() => {
          playEffect('timer', isSoundOnRef.current);

          Animated.sequence([
            Animated.timing(animateWatch, {
              toValue: 1.4,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animateWatch, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();

          repeatCount++;
          if (repeatCount >= 10) {
            clearInterval(secInterval);
            setIsThirtySecPhase(false);
          }
        }, 1000);
      }

      // ⛔ Timer finished
      if (remaining <= 0) {
        clearInterval(interval);
        stopEffect('ticktock');

        const incorrectCount = incorrectCountRef.current;
        const attempted = correctAnswersRef.current + incorrectCount;
        const correctPercentage =
          attempted > 0
            ? Math.round((correctAnswersRef.current / attempted) * 100)
            : 0;

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
      const params = new URLSearchParams({
        difficulty,
        symbol,
        qm: qmState.toString(),
      });
      const response = await fetch(
        `http://43.204.167.118:3000/api/question?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      const q = data.question;
      console.log('mmmmmmmmmmmmmmmmmmmm', q);
      setQuestion(
        `${String(q.input1)} ${getMathSymbol(q.symbol)} ${String(q.input2)}`,
      );
      setCorrectAnswer(String(q.answer));

      // 🔇 Beep sound removed
      // playEffect('beep', isSoundOnRef.current);
      // beepPlayingRef.current = true;
    } catch {
      setQuestion('Failed to load question.');
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };

  const toggleSound = () => {
    const newVal = !isSoundOnRef.current;
    setIsSoundOn(newVal);
    isSoundOnRef.current = newVal;
  };

  const handlePress = value => {
    if (isPaused || totalTimeRef.current <= 0 || isLoading || feedback) return;

    // 🔇 Removed beep stop logic
    // if (beepPlayingRef.current) {
    //   stopEffect('beep');
    //   beepPlayingRef.current = false;
    // }

    const key = value.toLowerCase();
    if (key === 'clear') return setInput('');
    if (key === '⌫') {
      // 🔇 Removed keypad sound
      // playEffect('keypad', isSoundOnRef.current);
      return setInput(prev => prev.slice(0, -1));
    }
    if (key === 'skip') {
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

    // 🔇 Removed keypad sound
    // playEffect('keypad', isSoundOnRef.current);
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

  // ✅ Content component
  const Content = () => (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top + 30}]}>
      <StatusBar
        backgroundColor={
          theme.backgroundGradient ? theme.backgroundGradient[0] : '#0B1220'
        }
        barStyle="light-content"
      />

      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {backgroundColor: theme.cardBackground || '#1E293B'},
        ]}>
        <TouchableOpacity
          onPress={() => {
            releaseAll();
            navigation.goBack();
          }}
          style={styles.iconButton}>
          <Icon name="chevron-back" size={scaleFont(24)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Animated.Image
            source={require('../Screens/Image/Stopwatch.png')}
            style={[
              styles.timerIcon,
              {
                transform: [{scale: animateWatch}],
                tintColor:
                  minutes * 60 + seconds <= 10 || isThirtySecPhase
                    ? 'red'
                    : '#fff',
              },
            ]}
          />
          <Text style={styles.timerText}>{`${minutes}:${
            seconds < 10 ? '0' : ''
          }${seconds}`}</Text>
        </View>

        <TouchableOpacity onPress={toggleSound} style={styles.iconButton1}>
          <Icon
            name={isSoundOn ? 'volume-high' : 'volume-mute'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Answer Box */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: height * 0.04,
        }}>
        <View
          style={[
            styles.answerBox,
            {backgroundColor: theme.cardBackground || '#1E293B'},
            feedback === 'correct'
              ? {borderColor: 'green', borderWidth: 2}
              : feedback === 'incorrect'
              ? {borderColor: 'red', borderWidth: 2}
              : feedback === 'skipped'
              ? {borderColor: 'orange', borderWidth: 2}
              : {},
          ]}>
          <Text
            style={[
              styles.answerText,
              feedback === 'correct'
                ? {color: 'green'}
                : feedback === 'incorrect'
                ? {color: 'red'}
                : feedback === 'skipped'
                ? {color: 'orange'}
                : {},
            ]}>
            {input ||
              (feedback === 'correct'
                ? 'Correct'
                : feedback === 'incorrect'
                ? 'Incorrect'
                : feedback === 'skipped'
                ? 'Skipped'
                : '')}
          </Text>
        </View>
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {numPad.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, index) => {
              const isSpecial = item.toLowerCase() === 'clear' || item === '⌫';
              const isSkip = item.toLowerCase() === 'skip';
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePress(item)}
                  style={[
                    styles.keyButton,
                    isSpecial ? styles.specialKey : null,
                  ]}>
                  {isSkip ? (
                    <LinearGradient
                      colors={theme.buttonGradient || ['#FFAD90', '#FF4500']}
                      style={[styles.gradientButton, {opacity: 0.8}]}>
                      <View
                        style={{alignItems: 'center', flexDirection: 'row'}}>
                        <Text
                          style={[styles.keyText, {fontSize: scaleFont(14)}]}>
                          Skip
                        </Text>
                        <MaterialIcons
                          name="skip-next"
                          size={25}
                          color="#fff"
                        />
                      </View>
                    </LinearGradient>
                  ) : !isSpecial ? (
                    <LinearGradient
                      colors={
                        theme.buttonGradient || [
                          theme.primaryColor || '#595CFF',
                          theme.secondaryColor || '#87AEE9',
                        ]
                      }
                      style={styles.gradientButton}>
                      <Text style={styles.keyText}>{item.toUpperCase()}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.keyText, {color: '#fff'}]}>
                      {item}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Play Button */}
      <LinearGradient
        colors={theme.buttonGradient || ['#FB923C', '#FF7F50']}
        style={styles.playButton}>
        <TouchableOpacity
          onPress={() => console.log('Play pressed')}
          style={{width: '100%', alignItems: 'center'}}>
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{flex: 1, backgroundColor: theme.backgroundColor || '#0B1220'}}>
      <Content />
    </View>
  );
};

export default MathInputScreen;

const styles = StyleSheet.create({
  container: {flex: 1},
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
  timerContainer: {flexDirection: 'row', alignItems: 'center', gap: 5},
  timerText: {
    color: '#fff',
    fontSize: scaleFont(13),
    fontWeight: '600',
    opacity: 0.7,
  },
  timerIcon: {width: 18, height: 18},
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
  answerText: {fontSize: scaleFont(18), color: '#fff', fontWeight: '600'},
  keypadContainer: {width: '100%'},
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
  specialKey: {backgroundColor: '#1C2433'},
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  keyText: {fontSize: scaleFont(18), color: '#fff', fontWeight: '600'},
  playButton: {
    marginTop: height * 0.04,
    width: width * 0.5,
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: height * 0.015,
  },
  playButtonText: {color: '#fff', fontSize: scaleFont(18), fontWeight: 'bold'},
});
