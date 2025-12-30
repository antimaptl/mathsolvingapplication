import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  StatusBar,
  Animated,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useSocket } from '../../Context/Socket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Globalfile/ThemeContext';
import { useSound } from '../../Context/SoundContext';
import { KEYPAD_LAYOUTS } from '../Globalfile/keyboardLayouts';
import {
  initSound,
  playEffect,
  stopEffect,
} from '../Globalfile/SoundManager';

const { width, height } = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const getMathSymbol = word => {
  const symbolMap = {
    Sum: '+',
    Difference: '-',
    Product: '*',
    Quotient: '/',
    Modulus: '%',
    Exponent: '^',
  };
  return symbolMap[word] || word;
};

const MultiPlayerGame = () => {
  /* ================= HOOKS & CONTEXT ================= */
  const socket = useSocket();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, keyboardTheme } = useTheme();
  const { isSoundOn, toggleSound } = useSound();

  /* ================= PARAMS ================= */
  const { currentQuestion, timer, difficulty, opponent, myGamePlayerId } = route.params || {};

  const currentLayout = KEYPAD_LAYOUTS[keyboardTheme] || KEYPAD_LAYOUTS.type1;
  const isCustomKeyboard = keyboardTheme === 'type1' || keyboardTheme === 'type2';

  /* ================= STATE ================= */
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isReverse, setIsReverse] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [awaitingResult, setAwaitingResult] = useState(false);

  // Timer State
  const [minutes, setMinutes] = useState(Math.floor((timer ?? 60) / 60));
  const [seconds, setSeconds] = useState((timer ?? 60) % 60);
  const [animateWatch] = useState(new Animated.Value(1));
  const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Local Stats State
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  /* ================= REFS ================= */
  const socketRef = useRef(null);
  const totalTimeRef = useRef(timer ?? 60);
  const scoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const skippedCountRef = useRef(0);
  const opponentScoreRef = useRef(0);
  const isSoundOnRef = useRef(isSoundOn);
  const last10PlayedRef = useRef(false);
  const appState = useRef(AppState.currentState);

  /* ================= EFFECTS: SOUND & APP STATE ================= */
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
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        stopEffect('ticktock');
      } else {
        if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
          playEffect('ticktock', isSoundOnRef.current);
        }
      }
      appState.current = state;
    });
    return () => sub.remove();
  }, []);

  /* ================= EFFECTS: USER & SOCKET ================= */
  useEffect(() => {
    AsyncStorage.getItem('userData')
      .then(stored => {
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    // --- Socket Listeners ---

    const handleNewQuestion = q => {
      console.log('📥 Received new-question:', q);
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setFeedback(null);
      setAwaitingResult(false);
    };

    const handleNextQuestion = data => {
      console.log('📥 next-question:', data);
      const q = data.question;
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setFeedback(null);
      setAwaitingResult(false);

      // Score Sync
      if (data.gameState && data.gameState.playerScores) {
        const pScores = data.gameState.playerScores;

        // Opponent
        if (opponent?.id && pScores[opponent.id] !== undefined) {
          const opData = pScores[opponent.id];
          const opScore = typeof opData === 'object' ? opData.score : opData;
          setOpponentScore(opScore);
          opponentScoreRef.current = opScore;
        }

        // My Score
        const myId = myGamePlayerId || user?._id;
        if (myId && pScores[myId] !== undefined) {
          const myData = pScores[myId];
          const myScore = typeof myData === 'object' ? myData.score : myData;
          if (myScore !== scoreRef.current) {
            scoreRef.current = myScore;
            setScore(myScore);
          }
        }
      }
    };

    const handleScoreUpdate = (data) => {
      if (data.userId === opponent?.id) {
        setOpponentScore(data.score);
        opponentScoreRef.current = data.score;
      }
    };

    socket.on('new-question', handleNewQuestion);
    socket.on('next-question', handleNextQuestion);
    socket.on('score-update', handleScoreUpdate);
    socket.on('opponent-score', (s) => setOpponentScore(s));

    // Initial Question
    if (currentQuestion) {
      const mathSymbol = getMathSymbol(currentQuestion.symbol);
      setQuestion(`${currentQuestion.input1} ${mathSymbol} ${currentQuestion.input2}`);
      setCorrectAnswer(String(currentQuestion.answer));
      setLoading(false);
    }

    return () => {
      socket.off('new-question', handleNewQuestion);
      socket.off('next-question', handleNextQuestion);
      socket.off('score-update', handleScoreUpdate);
      socket.off('opponent-score');
      socket.off('game-winner');
    };
  }, [socket, currentQuestion, opponent, user, myGamePlayerId]);

  /* ================= TIMER LOGIC ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        totalTimeRef.current -= 1;
        const remaining = totalTimeRef.current;
        setMinutes(Math.floor(remaining / 60));
        setSeconds(remaining % 60);

        // Sound & Animation: Last 10s
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

        // Sound & Animation: Every 30s
        if (remaining % 30 === 0 && remaining !== timer && remaining > 0) {
          setIsThirtySecPhase(true);
          playEffect('timer', isSoundOnRef.current);
          Animated.sequence([
            Animated.timing(animateWatch, { toValue: 1.4, duration: 300, useNativeDriver: true }),
            Animated.timing(animateWatch, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start(() => setIsThirtySecPhase(false));
        }

        // Game Over
        if (remaining <= 0) {
          clearInterval(interval);
          stopEffect('ticktock');

          // Notify server
          socket.emit('game-completed', {
            score: scoreRef.current,
            correct: scoreRef.current,
            time: timer,
          });

          // Navigate
          const attempts = correctAnswersRef.current + incorrectCountRef.current;
          const acc = attempts > 0 ? Math.round((correctAnswersRef.current / attempts) * 100) : 0;

          navigation.replace('MultiplayerResultScreen', {
            totalScore: scoreRef.current,
            correctCount: correctAnswersRef.current,
            inCorrectCount: incorrectCountRef.current,
            skippedQuestions: skippedCountRef.current,
            correctPercentage: acc,
            difficulty,
            player2Id: opponent?.id || 'unknown',
            opponentScore: opponentScoreRef.current,
            durationSeconds: timer,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timer, difficulty, navigation, socket, opponent]);

  /* ================= HANDLERS ================= */
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

  const handlePress = async value => {
    if (loading || awaitingResult || totalTimeRef.current <= 0 || feedback) return;

    const key = value.toString().toLowerCase();
    const playerId = await AsyncStorage.getItem('playerId');

    // --- Special Keys Logic (from MathInputScreen) ---
    if (key === 'clear' || key === 'clr') return setInput('');

    if (key === '⌫' || key === 'del') {
      return setInput(prev => prev.slice(0, -1));
    }

    if (key === 'reverse' || key === 'rev') {
      return setIsReverse(prev => !prev);
    }

    if (key === 'pm') {
      return setInput(prev => {
        if (prev.startsWith('-')) return prev.slice(1);
        return '-' + prev;
      });
    }

    // --- Skip Logic ---
    if (key === 'skip') {
      skippedCountRef.current += 1;
      setSkippedCount(skippedCountRef.current);
      setFeedback('skipped');
      playEffect('skipped', isSoundOnRef.current);

      socketRef.current?.emit('next-question', { userId: user?.id });

      setTimeout(() => setFeedback(null), 900);
      return;
    }

    // --- Number/Input Logic ---
    const newInput = isReverse ? value + input : input + value;
    setInput(newInput);

    // --- Submission Logic ---
    if (newInput.length >= correctAnswer.length) {
      const isCorrect = newInput === correctAnswer;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      playEffect(isCorrect ? 'correct' : 'incorrect', isSoundOnRef.current);

      if (isCorrect) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        correctAnswersRef.current += 1;
        setCorrectAnswers(correctAnswersRef.current);
      } else {
        incorrectCountRef.current += 1;
      }

      // Emit to server
      socketRef.current?.emit('submit-answer', {
        answer: newInput,
        playerId,
        userName: user?.username,
      });

      // Clear feedback for next Q (if not relying solely on server 'next-question')
      // NOTE: Original multiplayer code waited for 'new-question' event to clear feedback/input.
      // But adding a safety timeout or relying on server event is fine.
      // Here we trust the server event 'next-question' or 'new-question' to clear input/feedback.
      setAwaitingResult(true);
      setTimeout(() => setAwaitingResult(false), 5000); // Safety fallback
    }
  };

  /* ================= LAYOUT HELPERS ================= */
  const getKeyButtonWidth = () => width * 0.2;
  const getKeyButtonHeight = () => height * 0.1;

  /* ================= RENDER ================= */
  const Content = () => (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 30 }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.cardBackground || '#1E293B' }]}>
        <TouchableOpacity onPress={() => { stopEffect('ticktock'); navigation.goBack(); }} style={styles.iconButton}>
          <Icon name="caret-back-outline" size={scaleFont(24)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Animated.Image
            source={require('../Screens/Image/Stopwatch.png')}
            style={[
              styles.timerIcon,
              {
                transform: [{ scale: animateWatch }],
                tintColor: (minutes * 60 + seconds <= 10 || isThirtySecPhase) ? 'red' : '#fff'
              }
            ]}
          />
          <Text style={styles.timerText}>{`${minutes}:${String(seconds).padStart(2, '0')}`}</Text>
        </View>

        <TouchableOpacity onPress={handleToggleSound} style={styles.iconButton1}>
          <Icon name={isSoundOn ? 'volume-high' : 'volume-mute'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Question */}
      <Text style={styles.question}>{loading ? 'Loading...' : question}</Text>

      {/* Answer Box */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: height * 0.04 }}>
        <View style={[
          styles.answerBox,
          { backgroundColor: theme.cardBackground || '#1E293B' },
          feedback === 'correct' ? { borderColor: 'green', borderWidth: 2 } :
            feedback === 'incorrect' ? { borderColor: 'red', borderWidth: 2 } :
              feedback === 'skipped' ? { borderColor: 'orange', borderWidth: 2 } : {}
        ]}>
          <Text style={[
            styles.answerText,
            feedback === 'correct' ? { color: 'green' } :
              feedback === 'incorrect' ? { color: 'red' } :
                feedback === 'skipped' ? { color: 'orange' } : {}
          ]}>
            {input || (feedback ? feedback.charAt(0).toUpperCase() + feedback.slice(1) : '')}
          </Text>
        </View>
      </View>

      {/* Stats (Optional - Keeping small stats for MP context) */}
      <View style={styles.statsRow}>
        <Text style={[styles.statText, { color: theme.text || '#B0BEC5' }]}>You: {score}</Text>
        <Text style={[styles.statText, { color: theme.text || '#B0BEC5' }]}>Opp: {opponentScore}</Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {currentLayout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((item, index) => {
              const strItem = item.toString().toLowerCase();
              const isSpecial = ['clear', 'clr', '⌫', 'del', 'ref', 'pm', 'skip', '.', 'reverse'].includes(strItem);
              const isSkip = strItem === 'skip';
              const isNa = strItem === 'Na';

              if (isNa) return <View key={index} style={{ width: getKeyButtonWidth(), height: getKeyButtonHeight() }} />;

              let content;
              if (strItem === 'del' || strItem === '⌫') {
                content = <MaterialIcons name="backspace" size={24} color="#fff" />;
              } else if (strItem === 'ref' || strItem === 'reverse') {
                content = <Feather name={isReverse ? "refresh-ccw" : "refresh-cw"} size={26} color="#fff" />;
              } else if (strItem === 'pm') {
                content = <Text style={[styles.keyText, { color: '#fff' }]}>+/-</Text>;
              } else if (strItem === 'clr' || strItem === 'clear') {
                content = <Text style={[styles.keyText, { color: '#fff' }]}>Clear</Text>;
              } else if (isSkip) {
                content = (
                  <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                    <Text style={[styles.keyText, { fontSize: scaleFont(14) }]}>Skip</Text>
                    <MaterialIcons name="skip-next" size={24} color="#fff" />
                  </View>
                );
              } else {
                content = <Text style={styles.keyText}>{item.toUpperCase()}</Text>;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePress(strItem === 'ref' ? 'reverse' : item)}
                  style={[
                    styles.keyButton,
                    { width: getKeyButtonWidth(), height: getKeyButtonHeight() },
                    (isSpecial || strItem === '-') ? styles.specialKey : null
                  ]}>
                  {!isSpecial && strItem !== '-' ? (
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

export default MultiPlayerGame;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginBottom: height * 0.03,
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
    marginBottom: '5%',
  },
  answerText: { fontSize: scaleFont(18), color: '#fff', fontWeight: '600' },
  keypadContainer: { width: '100%', marginTop: 'auto', marginBottom: 20 },
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  statText: { fontSize: scaleFont(14), fontWeight: '600', opacity: 0.9 },
});
