// MultiPlayerGame.js
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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../Context/Socket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initSound,
  playEffect,
  stopEffect,
  releaseAll,
} from '../Globalfile/SoundManager'; // adjust path if needed
import { stopBackgroundMusic } from '../Globalfile/playBackgroundMusic'; // optional

const { width, height } = Dimensions.get('window');
const scaleFont = (size) => size * PixelRatio.getFontScale();

const numPad = [
  ['7', '8', '9', '-'],
  ['4', '5', '6', '.'],
  ['1', '2', '3', 'na'],
  ['Clear', '0', '⌫', 'skip'],
];

const getMathSymbol = (word) => {
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
  const socket = useSocket();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { currentQuestion } = route.params || {};

  // UI / state
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | 'skipped' | null
  const [isPaused, setIsPaused] = useState(false);

  // timer / animation
  const totalTimeRef = useRef( (route.params && route.params.timer) ? route.params.timer : 120 ); // default 120s
  const [minutes, setMinutes] = useState(Math.floor(totalTimeRef.current / 60));
  const [seconds, setSeconds] = useState(totalTimeRef.current % 60);
  const [animateWatch] = useState(new Animated.Value(1));
  const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);

  // scoring refs (so timer cleanup doesn't lose values)
  const scoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const skippedCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const isSoundOnRef = useRef(true);
  const beepPlayingRef = useRef(false);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [qmState, setQmState] = useState((route.params && route.params.qm) ? parseInt(route.params.qm, 10) : 0);

  // init sounds when screen focused
  useFocusEffect(
    useCallback(() => {
      stopBackgroundMusic?.();
      initSound('correct', 'rightanswer.mp3');
      initSound('incorrect', 'wronganswer.mp3');
      initSound('skipped', 'skip.mp3');
      initSound('keypad', 'keypad.mp3');
      initSound('timer', 'every30second.wav');
      initSound('beep', 'beep.mp3');
      return () => {
        // optionally release on unfocus
      };
    }, []),
  );

  // socket handlers & question receive
  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const handleNewQuestion = (q) => {
      // q expected shape: { input1, input2, symbol, answer, ...}
      console.log('📥 Received new-question:', q);
      if (!q) return;
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${String(q.input1)} ${mathSymbol} ${String(q.input2)}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setError(null);

      // play beep
      playEffect('beep', isSoundOnRef.current);
      beepPlayingRef.current = true;
    };

    const handleNextQuestion = (data) => {
      console.log('📥 next-question:', data);
      if (!data) return;
      const q = data.question || data;
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${String(q.input1)} ${mathSymbol} ${String(q.input2)}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setError(null);
      playEffect('beep', isSoundOnRef.current);
      beepPlayingRef.current = true;
    };

    // server acknowledges our submission and sends result
    const handleAnswerResult = (res) => {
      // expected res: { correct: boolean, points: number, nextQuestion?: {...}, message?: string }
      console.log('📥 answer-result:', res);
      setIsSubmitting(false);
      if (!res) return;

      if (res.correct) {
        setFeedback('correct');
        playEffect('correct', isSoundOnRef.current);
        scoreRef.current += (res.points ?? 2);
        correctAnswersRef.current += 1;
        setScore(scoreRef.current);
        setCorrectAnswers(correctAnswersRef.current);
        // advance qm if server expects
        setQmState(prev => prev + (res.qmIncrement ?? 2));
      } else {
        setFeedback('incorrect');
        playEffect('incorrect', isSoundOnRef.current);
        incorrectCountRef.current += 1;
        setIncorrectCount(incorrectCountRef.current);
        scoreRef.current -= (res.pointsLost ?? 1);
        setScore(scoreRef.current);
        // reduce qm maybe
        if (res.qmDecrease) setQmState(prev => Math.max(0, prev - res.qmDecrease));
      }

      // after short feedback, load next question if provided or ask server
      setTimeout(() => {
        setFeedback(null);
        if (res.nextQuestion) {
          handleNextQuestion({ question: res.nextQuestion });
        } else {
          // request next
          socketRef.current?.emit('next-question', { userId: user?.id });
        }
      }, 1200);
    };

    const handleGameOver = (payload) => {
      // payload could contain final scores / rankings; navigate to WellDoneScreen or results
      console.log('📥 game-over:', payload);
      releaseAll();
      navigation.replace('WellDoneScreen', {
        totalScore: payload?.totalScore ?? scoreRef.current,
        correctCount: payload?.correctCount ?? correctAnswersRef.current,
        inCorrectCount: payload?.inCorrectCount ?? incorrectCountRef.current,
        skippedQuestions: payload?.skippedQuestions ?? skippedCountRef.current,
        correctPercentage: payload?.correctPercentage ?? (
          correctAnswersRef.current + incorrectCountRef.current > 0
            ? Math.round((correctAnswersRef.current / (correctAnswersRef.current + incorrectCountRef.current)) * 100)
            : 0
        ),
        difficulty: route.params?.difficulty,
        multiplayerResults: payload?.results ?? null,
      });
    };

    const handleErrorEvent = (err) => {
      console.warn('socket error:', err);
      setError(err?.message || 'Socket error');
      setLoading(false);
      setIsSubmitting(false);
    };

    socket.on('new-question', handleNewQuestion);
    socket.on('next-question', handleNextQuestion);
    socket.on('answer-result', handleAnswerResult);
    socket.on('game-over', handleGameOver);
    socket.on('error', handleErrorEvent);

    // if initial question passed from lobby
    if (currentQuestion) {
      console.log('📥 Initial question from lobby:', currentQuestion);
      const mathSymbol = getMathSymbol(currentQuestion.symbol);
      setQuestion(`${String(currentQuestion.input1)} ${mathSymbol} ${String(currentQuestion.input2)}`);
      setCorrectAnswer(String(currentQuestion.answer));
      setLoading(false);
    }

    return () => {
      socket.off('new-question', handleNewQuestion);
      socket.off('next-question', handleNextQuestion);
      socket.off('answer-result', handleAnswerResult);
      socket.off('game-over', handleGameOver);
      socket.off('error', handleErrorEvent);
    };
  }, [socket, currentQuestion, user, navigation, route.params]);

  // load user data (local)
  useEffect(() => {
    AsyncStorage.getItem('userData')
      .then(stored => {
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(err => console.error('Failed to load userData', err));
  }, []);

  // timer logic - runs every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;
      if (totalTimeRef.current <= 0) return;

      totalTimeRef.current -= 1;
      const mins = Math.floor(totalTimeRef.current / 60);
      const secs = totalTimeRef.current % 60;
      setMinutes(mins);
      setSeconds(secs);

      // last 10 seconds pulse & beep
      if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
        playEffect('timer', isSoundOnRef.current);
        Animated.sequence([
          Animated.timing(animateWatch, { toValue: 1.4, duration: 300, useNativeDriver: true }),
          Animated.timing(animateWatch, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }

      // every 30 sec phase
      if (totalTimeRef.current % 30 === 0 && totalTimeRef.current !== 0) {
        setIsThirtySecPhase(true);
        let repeatCount = 0;
        const animateInterval = setInterval(() => {
          Animated.sequence([
            Animated.timing(animateWatch, { toValue: 1.4, duration: 300, useNativeDriver: true }),
            Animated.timing(animateWatch, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start();

          if (repeatCount === 0 || repeatCount === 3 || repeatCount === 6) {
            playEffect('timer', isSoundOnRef.current);
          }
          repeatCount += 1;
          if (repeatCount >= 10) {
            clearInterval(animateInterval);
            setIsThirtySecPhase(false);
          }
        }, 1000);
      }

      if (totalTimeRef.current <= 0) {
        // time up - tell server and navigate (server may send game-over)
        socketRef.current?.emit('time-up', { userId: user?.id });
        // fallback navigate if server doesn't emit
        setTimeout(() => {
          releaseAll();
          navigation.replace('WellDoneScreen', {
            totalScore: scoreRef.current,
            correctCount: correctAnswersRef.current,
            inCorrectCount: incorrectCountRef.current,
            skippedQuestions: skippedCountRef.current,
            correctPercentage:
              correctAnswersRef.current + incorrectCountRef.current > 0
                ? Math.round((correctAnswersRef.current / (correctAnswersRef.current + incorrectCountRef.current)) * 100)
                : 0,
            difficulty: route.params?.difficulty,
          });
        }, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, navigation, user, route.params]);

  // toggle sound
  const toggleSound = () => {
    const newVal = !isSoundOnRef.current;
    isSoundOnRef.current = newVal;
    // optional visual state if you want to show icon change
    // we're not keeping separate state var, can extend if needed
  };

  // explicit submit via button (also auto-submit when length reached)
  const handleSubmit = async (optionalInput) => {
    if (!socketRef.current) {
      setError('Socket not connected.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const answerToSend = (optionalInput ?? input).toString();
    if (!answerToSend || answerToSend.length === 0) {
      setError('Please enter an answer.');
      setIsSubmitting(false);
      return;
    }

    try {
      const playerId = await AsyncStorage.getItem('playerId');
      const userName = user?.username ?? (await AsyncStorage.getItem('username')) ?? 'player';

      // emit submit event; server should respond on 'answer-result'
      socketRef.current.emit('submit-answer', {
        answer: answerToSend,
        timeLeft: totalTimeRef.current,
        userName,
        playerId,
        qm: qmState,
      });

      // optimistic UI: play keypad sound and set small UX flag
      playEffect('keypad', isSoundOnRef.current);
      // we now wait for 'answer-result' which will clear isSubmitting
    } catch (err) {
      console.error('submit error', err);
      setError('Failed to submit answer.');
      setIsSubmitting(false);
    }
  };

  // handle keypad presses
  const handlePress = async (value) => {
    if (isPaused || totalTimeRef.current <= 0 || loading || feedback) return;

    if (beepPlayingRef.current) {
      stopEffect('beep');
      beepPlayingRef.current = false;
    }

    const key = value.toLowerCase();
    if (key === 'clear') return setInput('');
    if (key === '⌫') {
      playEffect('keypad', isSoundOnRef.current);
      return setInput(prev => prev.slice(0, -1));
    }
    if (key === 'skip') {
      // skip -> notify server for next question
      playEffect('skipped', isSoundOnRef.current);
      skippedCountRef.current += 1;
      setSkippedCount(skippedCountRef.current);
      socketRef.current?.emit('skip-question', { userId: user?.id });
      return;
    }

    playEffect('keypad', isSoundOnRef.current);
    const newInput = input + value;
    setInput(newInput);

    // auto submit if length reaches correctAnswer length (but keep explicit submit button too)
    if (correctAnswer && newInput.length >= correctAnswer.length) {
      // small delay to allow user see the last digit
      setTimeout(() => {
        handleSubmit(newInput);
        setInput(''); // clear input after sending; feedback will show from answer-result
      }, 250);
    }
  };

  // simple retry function
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    socketRef.current?.emit('request-question', { userId: user?.id });
  };

  // clean up sounds on unmount
  useEffect(() => {
    return () => {
      releaseAll();
    };
  }, []);

  // UI
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#0B1220" barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            releaseAll();
            navigation.goBack();
          }}
          style={styles.iconButton}>
          <Icon name="chevron-back" size={scaleFont(18)} color="#000" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Animated.Image
            source={require('../Screens/Image/Stopwatch.png')}
            style={[
              styles.timerIcon,
              {
                transform: [{ scale: animateWatch }],
                tintColor:
                  minutes * 60 + seconds <= 10 || isThirtySecPhase ? 'red' : '#fff',
              },
            ]}
          />
          <Text style={styles.timerText}>
            {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
          </Text>
        </View>

        <TouchableOpacity onPress={toggleSound} style={styles.iconButton1}>
          <Icon name={isSoundOnRef.current ? 'volume-high' : 'volume-mute'} size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Multiplayer Match</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{String(error)}</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.question}>{loading ? 'Loading...' : question}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: height * 0.02 }}>
        <View style={[
          styles.answerBox,
          feedback === 'correct' ? { borderColor: 'green', borderWidth: 2 } :
            feedback === 'incorrect' ? { borderColor: 'red', borderWidth: 2 } : {}
        ]}>
          <Text style={styles.answerText}>
            { input ||
              (feedback === 'correct' ? 'Correct' :
                feedback === 'incorrect' ? 'Incorrect' : '') }
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
                  style={[styles.keyButton, isSpecial ? styles.specialKey : null]}>
                  {isSkip ? (
                    <LinearGradient colors={['#FFAD90', '#FF4500']} style={styles.gradientButton}>
                      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                        <Text style={[styles.keyText, { fontSize: scaleFont(14) }]}>Skip</Text>
                        <MaterialIcons name="skip-next" size={25} color="#fff" />
                      </View>
                    </LinearGradient>
                  ) : !isSpecial ? (
                    <LinearGradient colors={['#595CFF', '#87AEE9']} style={styles.gradientButton}>
                      <Text style={styles.keyText}>{item.toUpperCase()}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.keyText, { color: '#fff' }]}>{item}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Submit button + small status */}
      <View style={{ marginTop: 12, alignItems: 'center' }}>
        <LinearGradient colors={['#FB923C', '#FF7F50']} style={styles.playButton}>
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={isSubmitting || loading}
            style={{ width: '100%', alignItems: 'center', paddingVertical: 6 }}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.playButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
        <Text style={{ color: '#fff', marginTop: 8 }}>
          Score: {score}  •  Correct: {correctAnswers}  •  Incorrect: {incorrectCount}  •  Skipped: {skippedCount}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MultiPlayerGame;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginBottom: height * 0.02,
    borderBottomEndRadius: 15,
    borderBottomStartRadius: 15,
  },
  iconButton: {
    width: width * 0.06,
    height: width * 0.06,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton1: {
    width: width * 0.06,
    height: width * 0.06,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: {
    color: '#fff',
    fontSize: scaleFont(13),
    fontWeight: '600',
    opacity: 0.9,
  },
  timerIcon: { width: 18, height: 18 },
  title: {
    color: '#fff',
    textAlign: 'center',
    fontSize: scaleFont(16),
    marginBottom: 6,
    fontWeight: '600',
  },
  question: {
    fontSize: scaleFont(22),
    color: '#fff',
    textAlign: 'center',
    marginTop: height * 0.01,
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
    marginTop: height * 0.01,
    width: width * 0.45,
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: height * 0.008,
  },
  playButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: 'bold',
  },
  errorBox: {
    marginHorizontal: 20,
    padding: 10,
    backgroundColor: '#3b1f1f',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: { color: '#fff', textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: { color: '#000' },
});
