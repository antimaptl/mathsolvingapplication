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
  Alert,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useSocket } from '../../Context/Socket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Globalfile/ThemeContext';
import { useSound } from '../../Context/SoundContext';
import { KEYPAD_LAYOUTS } from '../Globalfile/keyboardLayouts';
import { initSound, playEffect, stopEffect } from '../Globalfile/SoundManager';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const REACTIONS = [
  '👍',
  '😄',
  '🤣',
  '😡',
  '🔥',
  '😲',
  '🫡',
  '😎',
  '😴',
  '😈',
  '👎',
  '😞',
  '😭',
  '😱',
  '😓',
  '👏',
  '🤕',
  '🤓',
  '🙈',
  '🤡',
];

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
  const { currentQuestion, timer, difficulty, opponent, myMongoId } =
    route.params || {};

  console.log('🎮 Game Screen Params:', {
    myMongoId,
    opponent,
    difficulty,
    timer,
  });

  const currentLayout = KEYPAD_LAYOUTS[keyboardTheme] || KEYPAD_LAYOUTS.type1;

  /* ================= STATE ================= */
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isReverse, setIsReverse] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [awaitingResult, setAwaitingResult] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [bonusText, setBonusText] = useState('');

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
  const [answerHistory, setAnswerHistory] = useState([]);
  const [opponentEmoji, setOpponentEmoji] = useState(null);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

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
  const hasNavigatedToResultRef = useRef(false);

  // MongoDB ID refs
  const myMongoIdRef = useRef(myMongoId);
  const opponentMongoIdRef = useRef(opponent?.id);

  /* ================= DIAGNOSTIC LOGGING ================= */
  useEffect(() => {
    console.log('=== GAME SCREEN DIAGNOSTIC ===');
    console.log('1. My MongoDB ID (from params):', myMongoId);
    console.log('2. Opponent MongoDB ID:', opponent?.id);
    console.log('3. Opponent Username:', opponent?.username);
    console.log('4. Difficulty:', difficulty);
    console.log('5. Timer:', timer);
    console.log('==============================');
  }, []);

  // ADD THIS NEW useEffect at the top
  useEffect(() => {
    return () => {
      if (
        socketRef.current &&
        socketRef.current.connected &&
        !hasNavigatedToResultRef.current
      ) {
        console.log('🧹 Cleaning up game - emitting game-ended');
        socketRef.current.emit('game-ended');
      }
      stopEffect('ticktock');
    };
  }, []);
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

  /* ================= BACK BUTTON HANDLER ================= */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!gameEnded) {
          Alert.alert(
            'Leave Game?',
            'Are you sure you want to leave? You will lose the match.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Leave',
                style: 'destructive',
                onPress: handleGameExit,
              },
            ],
          );
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [gameEnded]);

  /* ================= EFFECTS: USER & SOCKET ================= */
  useEffect(() => {
    AsyncStorage.getItem('userData')
      .then(stored => {
        if (stored) {
          const userData = JSON.parse(stored);
          console.log('✅ User Data Loaded:', {
            id: userData.id || userData._id,
            username: userData.username,
          });
          setUser(userData);

          if (!myMongoIdRef.current) {
            myMongoIdRef.current = userData.id || userData._id;
            console.log('⚠️ Using fallback MongoDB ID:', myMongoIdRef.current);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    console.log('🔌 Setting up socket listeners...');

    if (opponent?.id) {
      opponentMongoIdRef.current = opponent.id;
      console.log('✅ Opponent MongoDB ID stored:', opponent.id);
    }

    // ✅ CONNECTION STATUS HANDLERS
    const handleConnect = () => {
      console.log('🟢 Reconnected to server');
      setIsConnected(true);
    };

    const handleDisconnect = reason => {
      console.log('🔴 Disconnected from server:', reason);
      setIsConnected(false);

      if (!gameEnded && !hasNavigatedToResultRef.current) {
        Alert.alert(
          'Connection Lost',
          'You have been disconnected from the server.',
          [
            {
              text: 'OK',
              onPress: () => {
                stopEffect('ticktock');
                navigation.replace('BottomTab');
              },
            },
          ],
        );
      }
    };

    const handleConnectError = error => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
    };

    // --- Socket Listeners ---
    const handleNewQuestion = q => {
      console.log('📥 new-question:', q);
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setFeedback(null);
      setAwaitingResult(false);
      setQuestionIndex(prev => prev + 1);
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
      setQuestionIndex(prev => prev + 1);

      if (data.gameState && data.gameState.playerScores) {
        const pScores = data.gameState.playerScores;
        console.log('📊 Player Scores from server:', pScores);

        if (
          opponentMongoIdRef.current &&
          pScores[opponentMongoIdRef.current] !== undefined
        ) {
          const opData = pScores[opponentMongoIdRef.current];
          const opScore = typeof opData === 'object' ? opData.score : opData;
          console.log('📊 Opponent score update:', opScore);
          setOpponentScore(opScore);
          opponentScoreRef.current = opScore;
        }

        if (
          myMongoIdRef.current &&
          pScores[myMongoIdRef.current] !== undefined
        ) {
          const myData = pScores[myMongoIdRef.current];
          const myScore = typeof myData === 'object' ? myData.score : myData;
          if (myScore !== scoreRef.current) {
            console.log('📊 My score update:', myScore);
            scoreRef.current = myScore;
            setScore(myScore);
          }
        }
      }
    };

    const handleOpponentScoreUpdate = data => {
      console.log('📊 opponent-score-update:', data);

      if (data.opponentId === opponentMongoIdRef.current) {
        console.log('✅ Updating opponent score to:', data.score);
        setOpponentScore(data.score);
        opponentScoreRef.current = data.score;
        
        if (data.history && Array.isArray(data.history)) {
            // Check if we have a state for this, if not, just log for verification
            console.log("Opponent history synced:", data.history);
        }
      }
    };

    const handleGameEnded = data => {
      console.log('🏁 game-ended:', data);

      if (hasNavigatedToResultRef.current) {
        console.log('🛑 Already navigated to results, ignoring duplicate');
        return;
      }

      hasNavigatedToResultRef.current = true;
      setGameEnded(true);
      stopEffect('ticktock');

      // ✅ NO need to emit game-ended here - server already knows

      const attempts = correctAnswersRef.current + incorrectCountRef.current;
      const acc =
        attempts > 0
          ? Math.round((correctAnswersRef.current / attempts) * 100)
          : 0;

      setTimeout(() => {
        navigation.replace('MultiplayerResultScreen', {
          totalScore: scoreRef.current,
          correctCount: correctAnswersRef.current,
          inCorrectCount: incorrectCountRef.current,
          skippedQuestions: skippedCountRef.current,
          correctPercentage: acc,
          difficulty,
          player2Id: opponentMongoIdRef.current || 'unknown',
          opponentScore: opponentScoreRef.current,
          durationSeconds: timer,
          winner: data.winner,
          players: data.players,
          gameResults: data.gameResults,
        });
      }, 500);
    };


    const handleOpponentDisconnected = data => {
      console.log('👋 opponent-disconnected:', data);

      if (hasNavigatedToResultRef.current) {
        console.log('🛑 Already navigated to results, ignoring');
        return;
      }

      hasNavigatedToResultRef.current = true;
      setGameEnded(true);
      stopEffect('ticktock');

      // ✅ NO need to emit - server already handled cleanup

      Alert.alert(
        'Opponent Disconnected',
        'Your opponent has left the game. You win!',
        [
          {
            text: 'OK',
            onPress: () => {
              const attempts =
                correctAnswersRef.current + incorrectCountRef.current;
              const acc =
                attempts > 0
                  ? Math.round((correctAnswersRef.current / attempts) * 100)
                  : 0;

              navigation.replace('MultiplayerResultScreen', {
                totalScore: scoreRef.current,
                correctCount: correctAnswersRef.current,
                inCorrectCount: incorrectCountRef.current,
                skippedQuestions: skippedCountRef.current,
                correctPercentage: acc,
                difficulty,
                player2Id: opponentMongoIdRef.current || 'unknown',
                opponentScore: opponentScoreRef.current,
                durationSeconds: timer,
                opponentDisconnected: true,
                winner: myMongoIdRef.current,
              });
            },
          },
        ],
      );
    };
    const handleError = data => {
      console.error('❌ Socket error:', data);
      Alert.alert('Error', data.message || 'An error occurred');
    };

    const handleOpponentEmoji = data => {
      console.log('😄 opponent-emoji-received:', data);
      if (data.emoji) {
        setOpponentEmoji(data.emoji);
        // Clear previous timeout if exists (optional but good)
        setTimeout(() => setOpponentEmoji(null), 3000);
      }
    };

    const handleGracePeriod = data => {
      console.log('⏳ game-in-grace-period:', data);
      Alert.alert(
        'Opponent Disconnected',
        data.message || 'Waiting for opponent to reconnect...',
      );
      // Set a state to show a "Waiting..." banner?
    };

    const handleOpponentReconnected = data => {
      console.log('♻️ opponent-reconnected:', data);
      Alert.alert('Reconnected', data.message || 'Opponent has reconnected!');
    };

    const handleGracePeriodExpired = data => {
      console.log('⏰ grace-period-expired:', data);
      // Treat this like a disconnect win
      handleOpponentDisconnected(data);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('new-question', handleNewQuestion);
    socket.on('next-question', handleNextQuestion);
    socket.on('opponent-score-update', handleOpponentScoreUpdate);
    socket.on('game-ended', handleGameEnded);
    socket.on('opponent-disconnected', handleOpponentDisconnected);
    // ✅ NEW LISTENERS
    socket.on('opponent-emoji-received', handleOpponentEmoji);
    socket.on('game-in-grace-period', handleGracePeriod);
    socket.on('grace-period-expired', handleGracePeriodExpired);
    socket.on('opponent-reconnected', handleOpponentReconnected);
    socket.on('error', handleError);

    if (currentQuestion) {
      console.log('📝 Setting initial question:', currentQuestion);
      const mathSymbol = getMathSymbol(currentQuestion.symbol);
      setQuestion(
        `${currentQuestion.input1} ${mathSymbol} ${currentQuestion.input2}`,
      );
      setCorrectAnswer(String(currentQuestion.answer));
      setLoading(false);
      setQuestionIndex(1);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('new-question', handleNewQuestion);
      socket.off('next-question', handleNextQuestion);
      socket.off('opponent-score-update', handleOpponentScoreUpdate);
      socket.off('game-ended', handleGameEnded);
      socket.off('opponent-disconnected', handleOpponentDisconnected);
      // ✅ REMOVE LISTENERS
      socket.off('opponent-emoji-received', handleOpponentEmoji);
      socket.off('game-in-grace-period', handleGracePeriod);
      socket.off('grace-period-expired', handleGracePeriodExpired);
      socket.off('opponent-reconnected', handleOpponentReconnected);
      socket.off('error', handleError);
    };
  }, [
    socket,
    currentQuestion,
    opponent,
    difficulty,
    timer,
    navigation,
    gameEnded,
  ]);

  /* ================= TIMER LOGIC ================= */
  useEffect(() => {
    if (gameEnded) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        totalTimeRef.current -= 1;
        const remaining = totalTimeRef.current;
        setMinutes(Math.floor(remaining / 60));
        setSeconds(remaining % 60);

        if (remaining <= 10 && remaining > 0) {
          if (!last10PlayedRef.current) {
            playEffect('ticktock', isSoundOnRef.current);
            last10PlayedRef.current = true;
          }
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

        if (remaining % 30 === 0 && remaining !== timer && remaining > 0) {
          setIsThirtySecPhase(true);
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
          ]).start(() => setIsThirtySecPhase(false));
        }

        if (remaining <= 0) {
          clearInterval(interval);
          handleTimeUp();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timer, difficulty, navigation, socket, opponent, gameEnded]);

  /* ================= HANDLERS ================= */
  const handleTimeUp = () => {
    if (hasNavigatedToResultRef.current || gameEnded) return;

    hasNavigatedToResultRef.current = true;
    setGameEnded(true);
    stopEffect('ticktock');

    console.log('⏰ Time up! Final score:', scoreRef.current);

    // ✅ EMIT game-ended to trigger server cleanup
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('game-ended');
    }

    const attempts = correctAnswersRef.current + incorrectCountRef.current;
    const acc =
      attempts > 0
        ? Math.round((correctAnswersRef.current / attempts) * 100)
        : 0;

    setTimeout(() => {
      navigation.replace('MultiplayerResultScreen', {
        totalScore: scoreRef.current,
        correctCount: correctAnswersRef.current,
        inCorrectCount: incorrectCountRef.current,
        skippedQuestions: skippedCountRef.current,
        correctPercentage: acc,
        difficulty,
        player2Id: opponentMongoIdRef.current || 'unknown',
        opponentScore: opponentScoreRef.current,
        durationSeconds: timer,
      });
    }, 500);
  };

  /* ================= REPLACE handleGameExit FUNCTION ================= */

  const handleGameExit = () => {
    stopEffect('ticktock');

    // ✅ EMIT game-ended to trigger server cleanup
    if (socketRef.current && socketRef.current.connected) {
      console.log('🚪 Player exiting - emitting game-ended');
      socketRef.current.emit('game-ended');
    }

    hasNavigatedToResultRef.current = true;
    setGameEnded(true);
    navigation.replace('BottomTab');
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

  const handleToggleReactions = () => {
    setIsReactionPickerOpen(prev => !prev);
  };

  const handleSelectReaction = emoji => {
    setIsReactionPickerOpen(false);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-reaction', {
        emoji,
        from: myMongoIdRef.current,
        to: opponentMongoIdRef.current,
      });
    }
  };

  const handlePress = async value => {
    if (
      loading ||
      awaitingResult ||
      totalTimeRef.current <= 0 ||
      feedback ||
      gameEnded
    )
      return;

    const key = value.toString().toLowerCase();

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

    if (key === 'skip') {
      skippedCountRef.current += 1;
      setSkippedCount(skippedCountRef.current);
      setFeedback('skipped');
      playEffect('skipped', isSoundOnRef.current);

      console.log('⏭️ Skipping question');

      setAnswerHistory(prev => [{isCorrect: null}, ...prev].slice(0, 8));

      socketRef.current?.emit('submit-answer', {
        answer: null,
        playerId: myMongoIdRef.current,
        timeSpent: 0,
        skipped: true,
      });

      setTimeout(() => setFeedback(null), 900);
      return;
    }

    const newInput = isReverse ? value + input : input + value;
    setInput(newInput);

    if (newInput.length >= correctAnswer.length) {
      const isCorrect = newInput === correctAnswer;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      playEffect(isCorrect ? 'correct' : 'incorrect', isSoundOnRef.current);

      setAnswerHistory(prev => [{isCorrect}, ...prev].slice(0, 8));

      if (isCorrect) {
        setBonusText('+4 Bonus');
      } else {
        setBonusText('');
      }

      if (isCorrect) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        correctAnswersRef.current += 1;
        setCorrectAnswers(correctAnswersRef.current);
      } else {
        incorrectCountRef.current += 1;
      }

      console.log('📤 Submitting answer:', {
        playerId: myMongoIdRef.current,
        answer: newInput,
        isCorrect,
      });

      socketRef.current?.emit('submit-answer', {
        answer: newInput,
        playerId: myMongoIdRef.current,
        timeSpent: 0,
      });

      setAwaitingResult(true);
      setTimeout(() => {
        setAwaitingResult(false);
        if (feedback) setFeedback(null);
        setBonusText('');
      }, 5000);
    }
  };

  const getKeyButtonWidth = () => width * 0.2;
  const getKeyButtonHeight = () => width * 0.2;

  const Content = () => (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top + 10}]}>
      {!isConnected && (
        <View style={styles.disconnectedBanner}>
          <Text style={styles.disconnectedText}>⚠️ Disconnected from server</Text>
        </View>
      )}

      <View
        style={[
          styles.topBar,
          {backgroundColor: theme.cardBackground || '#1E293B'},
        ]}>
        <TouchableOpacity
          onPress={() => {
            if (!gameEnded) {
              Alert.alert(
                'Leave Game?',
                'Are you sure you want to leave? You will lose the match.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: handleGameExit,
                  },
                ],
              );
            } else {
              navigation.goBack();
            }
          }}
          style={styles.iconButton}>
          <Icon name="caret-back-outline" size={scaleFont(22)} color="#fff" />
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
          <Text style={styles.timerText}>
            {`${minutes}:${String(seconds).padStart(2, '0')}`}
          </Text>
        </View>

        <TouchableOpacity onPress={handleToggleSound} style={styles.iconButton1}>
          <Icon
            name={isSoundOn ? 'volume-high' : 'volume-mute'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.playerHeader}>
        <View style={styles.playerMini}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.username?.charAt(0).toUpperCase() || 'Y'}
            </Text>
          </View>
          <Text style={styles.playerMiniName}>{user?.username || 'You'}</Text>
        </View>

        <Text style={styles.centerScoreText}>
          {score} - {opponentScore}
        </Text>

        <View style={styles.playerMini}>
          <View style={[styles.avatarCircle, {backgroundColor: '#0F766E'}]}>
            <Text style={styles.avatarInitial}>
              {opponent?.username?.charAt(0).toUpperCase() || 'O'}
            </Text>
            {/* ✅ OPPONENT EMOJI POPUP */}
            {opponentEmoji && (
              <Animated.View style={[styles.emojiPopup, { transform: [{ scale: 1 }] }]}>
                 <Text style={styles.emojiText}>{opponentEmoji}</Text>
              </Animated.View>
            )}
          </View>
          <Text style={styles.playerMiniName}>
            {opponent?.username || 'Opponent'}
          </Text>
        </View>
      </View>

      <View style={styles.historyRow}>
        {answerHistory.slice(0, 8).map((item, index) => {
          const iconName =
            item.isCorrect === null
              ? 'close'
              : item.isCorrect
              ? 'checkmark'
              : 'close';
          const color =
            item.isCorrect === null
              ? '#FF6B6B'
              : item.isCorrect
              ? '#4CAF50'
              : '#FF6B6B';
          return (
            <View key={index} style={styles.historyIconWrapper}>
              <Icon name={iconName} size={14} color={color} />
            </View>
          );
        })}
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.questionCard}>
        <View style={styles.questionHeaderRow}>
          <Text style={styles.questionHeaderLeft}>
            Q{questionIndex}
          </Text>
          <View style={styles.questionHeaderRight}>
            {bonusText ? (
              <Text style={styles.bonusText}>{bonusText}</Text>
            ) : null}
            <Text style={styles.questionHeaderPts}>Pts</Text>
          </View>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>
            {loading ? 'Question' : question}
          </Text>
        </View>

        <View style={styles.answerRow}>
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
                  : {color: theme.text || '#fff'},
              ]}>
              {input ||
                (feedback
                  ? feedback.charAt(0).toUpperCase() + feedback.slice(1)
                  : '')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.speechBubble}
            onPress={handleToggleReactions}
            activeOpacity={0.8}>
            <Icon name="chatbubble-ellipses" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {isReactionPickerOpen && (
          <View style={styles.reactionPanel}>
            {REACTIONS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectReaction(emoji)}
                style={styles.reactionItem}>
                <Text style={styles.reactionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.keypadContainer}>
          {currentLayout.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((item, index) => {
                const strItem = item.toString().toLowerCase();
                const isSpecial = [
                  'clear',
                  'clr',
                  '⌫',
                  'del',
                  'ref',
                  'pm',
                  'skip',
                  '.',
                  'reverse',
                ].includes(strItem);
                const isSkip = strItem === 'skip';
                const isNa = strItem === 'na';

                if (isNa)
                  return (
                    <View
                      key={index}
                      style={{
                        width: getKeyButtonWidth(),
                        height: getKeyButtonHeight(),
                      }}
                    />
                  );

                let content;
                if (strItem === 'del' || strItem === '⌫') {
                  content = (
                    <MaterialIcons name="backspace" size={20} color="#fff" />
                  );
                } else if (strItem === 'ref' || strItem === 'reverse') {
                  content = (
                    <Feather
                      name={isReverse ? 'refresh-ccw' : 'refresh-cw'}
                      size={20}
                      color="#fff"
                    />
                  );
                } else if (strItem === 'pm') {
                  content = <Text style={styles.keyText}>+/-</Text>;
                } else if (strItem === 'clr' || strItem === 'clear') {
                  content = (
                    <Text style={[styles.keyText, {fontSize: scaleFont(12)}]}>
                      C
                    </Text>
                  );
                } else if (isSkip) {
                  content = (
                    <Text style={[styles.keyText, {fontSize: scaleFont(12)}]}>
                      S
                    </Text>
                  );
                } else {
                  content = (
                    <Text style={styles.keyText}>{item.toUpperCase()}</Text>
                  );
                }

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() =>
                      handlePress(strItem === 'ref' ? 'reverse' : item)
                    }
                    disabled={gameEnded}
                    style={[
                      styles.keyButton,
                      {
                        width: getKeyButtonWidth(),
                        height: getKeyButtonHeight(),
                      },
                      isSpecial || strItem === '-' ? styles.specialKey : null,
                      gameEnded && {opacity: 0.5},
                    ]}>
                    {!isSpecial && strItem !== '-' ? (
                      <LinearGradient
                        colors={
                          theme.buttonGradient || [
                            theme.primaryColor || '#595CFF',
                            theme.secondaryColor || '#87AEE9',
                          ]
                        }
                        style={styles.gradientButton}>
                        {content}
                      </LinearGradient>
                    ) : (
                      <View style={styles.specialButtonContent}>{content}</View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{ flex: 1, backgroundColor: theme.backgroundColor || '#0B1220' }}>
      <Content />
    </View>
  );
};

export default MultiPlayerGame;

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderBottomEndRadius: 15,
    borderBottomStartRadius: 15,
  },
  iconButton: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton1: {
    width: width * 0.08,
    height: width * 0.08,
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
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: width * 0.04,
    marginTop: height * 0.015,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  playerTextBlock: {
    justifyContent: 'center',
  },
  playerName: {
    color: '#0F172A',
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  playerNameUnderline: {
    marginTop: 2,
    width: 50,
    height: 2,
    backgroundColor: '#0F172A',
  },
  questionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionBadgeText: {
    color: '#111827',
    fontSize: scaleFont(11),
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.01,
    marginHorizontal: width * 0.06,
  },
  centerScoreText: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerMiniName: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  historyIconWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  sectionDivider: {
    height: 4,
    backgroundColor: '#0F172A',
    marginTop: height * 0.015,
  },
  questionCard: {
    flex: 1,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.015,
    marginBottom: height * 0.02,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    justifyContent: 'space-between',
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.01,
  },
  questionHeaderLeft: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  questionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questionHeaderPts: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#0F172A',
  },
  bonusText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#EF4444',
  },
  questionBox: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  questionText: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
  },
  answerBox: {
    flex: 1,
    height: height * 0.06,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubble: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {fontSize: scaleFont(18), color: '#fff', fontWeight: '600'},
  keypadContainer: {
    marginTop: height * 0.01,
    paddingBottom: height * 0.01,
  },
  reactionPanel: {
    position: 'absolute',
    right: width * 0.08,
    top: height * 0.17,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: width * 0.6,
    zIndex: 20,
    elevation: 8,
  },
  reactionItem: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  reactionText: {
    fontSize: scaleFont(18),
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.015,
  },
  keyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width * 0.1,
    backgroundColor: '#1C2433',
  },
  specialKey: {backgroundColor: '#1C2433'},
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: width * 0.1,
  },
  specialButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {fontSize: scaleFont(18), color: '#fff', fontWeight: '600'},
  emojiPopup: {
    position: 'absolute',
    top: -40,
    right: -25,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emojiText: {
    fontSize: 24,
    color: 'black',
  },
});
