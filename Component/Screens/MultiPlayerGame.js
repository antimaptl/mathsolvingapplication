// import React, {useState, useEffect, useRef, useContext} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   PixelRatio,
//   SafeAreaView,
//   StatusBar,
//   Animated,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/Ionicons';
// import {useNavigation, useRoute} from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useSocket} from '../../Context/Socket';
// import {useSafeAreaInsets} from 'react-native-safe-area-context';

// // ⭐ ADD THE THEME CONTEXT — SAME AS MathInputScreen
// import { useTheme } from '../Globalfile/ThemeContext';

// const {width, height} = Dimensions.get('window');
// const scaleFont = size => size * PixelRatio.getFontScale();

// const numPad = [
//   ['7', '8', '9', '-'],
//   ['4', '5', '6', '.'],
//   ['1', '2', '3', 'na'],
//   ['Clear', '0', '⌫', 'skip'],
// ];

// const getMathSymbol = word => {
//   const symbolMap = {
//     Sum: '+',
//     Difference: '-',
//     Product: '*',
//     Quotient: '/',
//     Modulus: '%',
//     Exponent: '^',
//   };
//   return symbolMap[word] || word;
// };

// const MultiPlayerGame = () => {
//   const socket = useSocket();
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();
//   const route = useRoute();

//   // ⭐ GET THE THEME
//   const {theme} = useTheme();

//   const {currentQuestion, timer, difficulty} = route.params || {};

//   const [input, setInput] = useState('');
//   const [question, setQuestion] = useState('');
//   const [correctAnswer, setCorrectAnswer] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const socketRef = useRef(null);

//   const totalTimeRef = useRef(timer ?? 60);
//   const [minutes, setMinutes] = useState(Math.floor((timer ?? 60) / 60));
//   const [seconds, setSeconds] = useState((timer ?? 60) % 60);
//   const [animateWatch] = useState(new Animated.Value(1));
//   const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);

//   const scoreRef = useRef(0);
//   const correctAnswersRef = useRef(0);
//   const incorrectCountRef = useRef(0);
//   const skippedCountRef = useRef(0);

//   const [score, setScore] = useState(0);
//   const [correctAnswers, setCorrectAnswers] = useState(0);
//   const [skippedCount, setSkippedCount] = useState(0);

//   const [feedback, setFeedback] = useState(null);
//   const [awaitingResult, setAwaitingResult] = useState(false);

//   useEffect(() => {
//     AsyncStorage.getItem('userData')
//       .then(stored => {
//         if (stored) setUser(JSON.parse(stored));
//       })
//       .catch(console.error);
//   }, []);

//   useEffect(() => {
//     if (!socket) return;
//     socketRef.current = socket;

//     const handleNewQuestion = q => {
//       const mathSymbol = getMathSymbol(q.symbol);
//       setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
//       setCorrectAnswer(String(q.answer));
//       setInput('');
//       setLoading(false);
//       setFeedback(null);
//       setAwaitingResult(false);
//     };

//     const handleNextQuestion = data => {
//       const q = data.question;
//       const mathSymbol = getMathSymbol(q.symbol);
//       setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
//       setCorrectAnswer(String(q.answer));
//       setInput('');
//       setLoading(false);
//       setFeedback(null);
//       setAwaitingResult(false);
//     };

//     socket.on('new-question', handleNewQuestion);
//     socket.on('next-question', handleNextQuestion);

//     if (currentQuestion) {
//       const mathSymbol = getMathSymbol(currentQuestion.symbol);
//       setQuestion(
//         `${currentQuestion.input1} ${mathSymbol} ${currentQuestion.input2}`,
//       );
//       setCorrectAnswer(String(currentQuestion.answer));
//       setLoading(false);
//     }

//     return () => {
//       socket.off('new-question', handleNewQuestion);
//     };
//   }, [socket, currentQuestion]);

//   // Timer
//   useEffect(() => {
//     if (typeof timer === 'number') {
//       totalTimeRef.current = timer;
//       setMinutes(Math.floor(timer / 60));
//       setSeconds(timer % 60);
//     }

//     const interval = setInterval(() => {
//       if (!isPaused) {
//         totalTimeRef.current -= 1;

//         const mins = Math.floor(totalTimeRef.current / 60);
//         const secs = totalTimeRef.current % 60;
//         setMinutes(mins);
//         setSeconds(secs);

//         if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
//           Animated.sequence([
//             Animated.timing(animateWatch, {
//               toValue: 1.4,
//               duration: 300,
//               useNativeDriver: true,
//             }),
//             Animated.timing(animateWatch, {
//               toValue: 1,
//               duration: 300,
//               useNativeDriver: true,
//             }),
//           ]).start();
//         }

//         if (totalTimeRef.current <= 0) {
//           clearInterval(interval);

//           navigation.replace('MultiplayerResultScreen', {
//             totalScore: scoreRef.current,
//             correctCount: correctAnswersRef.current,
//             inCorrectCount: incorrectCountRef.current,
//             skippedQuestions: skippedCountRef.current,
//             difficulty,
//             isWinner: true,
//           });
//         }
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [isPaused]);

//   const handlePress = async value => {
//     if (loading || awaitingResult) return;

//     const key = value.toLowerCase();
//     const playerId = await AsyncStorage.getItem('playerId');

//     if (key === 'clear') {
//       setInput('');
//       return;
//     }
//     if (key === '⌫') {
//       setInput(prev => prev.slice(0, -1));
//       return;
//     }
//     if (key === 'skip') {
//       skippedCountRef.current += 1;
//       setSkippedCount(skippedCountRef.current);
//       setFeedback('skipped');

//       socketRef.current?.emit('next-question', {userId: user?.id});

//       setTimeout(() => setFeedback(null), 900);
//       return;
//     }

//     const newInput = input + value;
//     setInput(newInput);

//     if (newInput.length >= correctAnswer.length) {
//       const isCorrect = newInput === correctAnswer;
//       setFeedback(isCorrect ? 'correct' : 'incorrect');

//       if (isCorrect) {
//         scoreRef.current += 1;
//         setScore(scoreRef.current);
//       }

//       socketRef.current?.emit('submit-answer', {
//         answer: newInput,
//         playerId,
//         userName: user?.username,
//       });
//     }
//   };

//   return (
//     <SafeAreaView style={[styles.container, {backgroundColor: theme. backgroundGradient[0] ||  '#1E293B' , paddingTop: insets.top}]}>
//       <StatusBar  backgroundColor={
//           theme.backgroundGradient ? theme.backgroundGradient[0] : '#0B1220'
//         }
//         barStyle="light-content" />

//       {/* TOP BAR */}
//       <View style={[styles.topBar, {backgroundColor: theme.cardBackground || '#1E293B'}]}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconButton, {backgroundColor: theme.card}]}>
//           <Icon name="chevron-back" size={scaleFont(18)} color={theme.text} />
//         </TouchableOpacity>

//         {/* TIMER */}
//         <View style={{flexDirection: 'row', alignItems: 'center'}}>
//           <Animated.Image
//             source={require('../Screens/Image/Stopwatch.png')}
//             style={[
//               styles.timerIcon,
//               {
//                 tintColor:
//                   minutes * 60 + seconds <= 10 ? 'red' : theme.text,
//                 transform: [{scale: animateWatch}],
//               },
//             ]}
//           />
//           <Text style={{color: theme.text, fontSize: scaleFont(15), marginLeft: 6}}>
//             {`${minutes}:${String(seconds).padStart(2, '0')}`}
//           </Text>
//         </View>

//         <View style={{width: width * 0.06}} />
//       </View>

//       {/* QUESTION */}
//       <Text style={[styles.question, {color: theme.text}]}>
//         {loading ? 'Loading...' : question}
//       </Text>

//       {/* ANSWER BOX */}
//       <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: height * 0.04}}>
//         <View
//           style={[
//             styles.answerBox,
//             {backgroundColor: theme.cardBackground || '#1E293B'},
//             feedback === 'correct'
//               ? {borderColor: 'green', borderWidth: 2}
//               : feedback === 'incorrect'
//               ? {borderColor: 'red', borderWidth: 2}
//               : feedback === 'skipped'
//               ? {borderColor: 'orange', borderWidth: 2}
//               : {},
//           ]}>
//           <Text
//             style={[
//               styles.answerText,
//               {color: theme.text},
//               feedback === 'correct'
//                 ? {color: 'green'}
//                 : feedback === 'incorrect'
//                 ? {color: 'red'}
//                 : feedback === 'skipped'
//                 ? {color: 'orange'}
//                 : {},
//             ]}>
//             {feedback ? feedback.toUpperCase() : input}
//           </Text>
//         </View>
//       </View>

//       {/* STATS */}
//       <View style={styles.statsRow}>
//         <Text style={[styles.statText, {color: theme.text}]}>Score: {score}</Text>
//         <Text style={[styles.statText, {color: theme.text}]}>Correct: {correctAnswers}</Text>
//         <Text style={[styles.statText, {color: theme.text}]}>Skipped: {skippedCount}</Text>
//       </View>

//       {/* KEYPAD */}
//       <View style={styles.keypadContainer}>
//         {numPad.map((row, rowIndex) => (
//           <View key={rowIndex} style={styles.keypadRow}>
//             {row.map((item, index) => {
//               const isSpecial = item.toLowerCase() === 'clear' || item === '⌫';
//               const isSkip = item.toLowerCase() === 'skip';

//               return (
//                 <TouchableOpacity
//                   key={index}
//                   onPress={() => handlePress(item)}
//                   style={[
//                     styles.keyButton,
//                     {backgroundColor: theme.card},
//                     isSpecial ? {} : {},
//                   ]}>
//                   {isSkip ? (
//                     <LinearGradient colors={theme.buttonGradient || ['#FFAD90', '#FF4500']}>
//                       <View style={{alignItems: 'center', flexDirection: 'row'}}>
//                         <Text style={[styles.keyText, {color: theme.buttonText}]}>Skip</Text>
//                         <MaterialIcons name="skip-next" size={25} color={theme.buttonText} />
//                       </View>
//                     </LinearGradient>
//                   ) : !isSpecial ? (
//                     <LinearGradient  colors={
//                         theme.buttonGradient || [
//                           theme.primaryColor || '#595CFF',
//                           theme.secondaryColor || '#87AEE9',
//                         ]
//                       } style={styles.gradientButton}>
//                       <Text style={[styles.keyText, {color: theme.buttonText}]}>
//                         {item.toUpperCase()}
//                       </Text>
//                     </LinearGradient>
//                   ) : (
//                     <Text style={[styles.keyText, {color: theme.text}]}>{item}</Text>
//                   )}
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         ))}
//       </View>
//     </SafeAreaView>
//   );
// };

// export default MultiPlayerGame;

// const styles = StyleSheet.create({
//   container: {flex: 1},
//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: width * 0.04,
//     paddingVertical: height * 0.02,
//     marginBottom: height * 0.03,
//     borderBottomEndRadius: 15,
//     borderBottomStartRadius: 15,
//   },
//   iconButton: {
//     width: width * 0.06,
//     height: width * 0.06,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   timerIcon: {width: 18, height: 18},
//   question: {
//     fontSize: scaleFont(22),
//     textAlign: 'center',
//     marginTop: height * 0.05,
//     marginBottom: height * 0.02,
//     fontWeight: 'bold',
//   },
//   answerBox: {
//     width: width * 0.6,
//     height: height * 0.06,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: '27%',
//   },
//   answerText: {fontSize: scaleFont(18), fontWeight: '600'},
//   keypadContainer: {width: '100%'},
//   keypadRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: height * 0.02,
//     paddingHorizontal: width * 0.05,
//   },
//   keyButton: {
//     width: width * 0.2,
//     height: height * 0.1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//   },
//   gradientButton: {
//     width: '100%',
//     height: '100%',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//   },
//   keyText: {fontSize: scaleFont(18), fontWeight: '600'},
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 12,
//   },
//   statText: {fontSize: scaleFont(12), opacity: 0.8},
// });

//Old code
import React, {useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSocket} from '../../Context/Socket';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
// If you have SoundManager and theme, you can import like MathInputScreen does.
// import { initSound, playEffect } from '../Globalfile/SoundManager';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

const numPad = [
  ['7', '8', '9', '-'],
  ['4', '5', '6', '.'],
  ['1', '2', '3', 'na'],
  ['Clear', '0', '⌫', 'skip'],
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
  const socket = useSocket();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const {currentQuestion, timer, difficulty} = route.params || {};

  // Question & input state (socket-driven)
  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);

  // Timer (local UI)
  const totalTimeRef = useRef(timer ?? 60);
  const [minutes, setMinutes] = useState(Math.floor((timer ?? 60) / 60));
  const [seconds, setSeconds] = useState((timer ?? 60) % 60);
  const [animateWatch] = useState(new Animated.Value(1));
  const [isThirtySecPhase, setIsThirtySecPhase] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Score & stats (local UI; server remains source-of-truth for correctness)
  const scoreRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const skippedCountRef = useRef(0);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Feedback UI
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | 'skipped' | 'pending' | null
  const [awaitingResult, setAwaitingResult] = useState(false);

  useEffect(() => {
    // Load user
    AsyncStorage.getItem('userData')
      .then(stored => {
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;
    // Handler for incoming new question
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

    // Handler for next-question payload
    const handleNextQuestion = data => {
      console.log('📥 next-question:', data);
      const q = data.question;
      console.log(' Q question:', q);
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
      setFeedback(null);
      setAwaitingResult(false);
    };

    // Handler: server's answer result (common names)
    const handleAnswerResult = payload => {
      // payload shape may vary; handle common fields
      console.log('📥 answer-result / submit-response:', payload);

      // Example expected payloads handled gracefully:
      // { status: 'correct' } or { correct: true } or { isCorrect: true }
      const status =
        payload?.status ||
        (payload?.correct === true
          ? 'correct'
          : payload?.correct === false
          ? 'incorrect'
          : null) ||
        (payload?.isCorrect === true
          ? 'correct'
          : payload?.isCorrect === false
          ? 'incorrect'
          : null) ||
        null;

      if (status === 'answer') {
        // update local UI counters (server should be authoritative; this is just UI)
        scoreRef.current += payload?.points ?? 2; // if server sends points use them, else +2
        correctAnswersRef.current += 1;
        setScore(scoreRef.current);
        setCorrectAnswers(correctAnswersRef.current);
        setFeedback('correct');
      } else if (status === 'incorrect') {
        scoreRef.current -= payload?.penalty ?? 1;
        incorrectCountRef.current += 1;
        setScore(scoreRef.current);
        setFeedback('incorrect');
      } else if (payload?.skipped) {
        skippedCountRef.current += 1;
        setSkippedCount(skippedCountRef.current);
        setFeedback('skipped');
      } else {
        // fallback: if payload has a 'message' or 'result' field
        if (payload?.result === 'correct') {
          scoreRef.current += payload?.points ?? 2;
          correctAnswersRef.current += 1;
          setScore(scoreRef.current);
          setCorrectAnswers(correctAnswersRef.current);
          setFeedback('correct');
        } else if (payload?.result === 'incorrect') {
          scoreRef.current -= payload?.penalty ?? 1;
          incorrectCountRef.current += 1;
          setScore(scoreRef.current);
          setFeedback('incorrect');
        } else {
          // unknown payload — just clear pending state
          setFeedback(null);
        }
      }

      setAwaitingResult(false);

      // Clear feedback after short delay and let server emit next-question
      setTimeout(() => {
        setFeedback(null);
      }, 1200);
    };

    // Register listeners (preserve existing names)
    socket.on('new-question', handleNewQuestion);
    socket.on('next-question', handleNextQuestion);

    // also listen for common result event names without changing emits
    // socket.on('answer-result', handleAnswerResult);
    // socket.on('submit-response', handleAnswerResult);
    // socket.on('answer-status', handleAnswerResult);

    // If initial question passed from lobby, apply it
    if (currentQuestion) {
      console.log('📥 Initial question from lobby:', currentQuestion);
      const mathSymbol = getMathSymbol(currentQuestion.symbol);
      setQuestion(
        `${currentQuestion.input1} ${mathSymbol} ${currentQuestion.input2}`,
      );
      setCorrectAnswer(String(currentQuestion.answer));
      setLoading(false);
    }

    return () => {
      socket.off('new-question', handleNewQuestion);
      socket.off('game-winner');
      // socket.off('next-question', handleNextQuestion);
      // socket.off('answer-result', handleAnswerResult);
      // socket.off('submit-response', handleAnswerResult);
      // socket.off('answer-status', handleAnswerResult);
    };
  }, [socket, currentQuestion]);

  // Timer behavior (mirrors MathInputScreen UI)
  useEffect(() => {
    // initialize from route param if provided
    if (typeof timer === 'number') {
      totalTimeRef.current = timer;
      setMinutes(Math.floor(timer / 60));
      setSeconds(timer % 60);
    }

    const interval = setInterval(() => {
      if (!isPaused) {
        totalTimeRef.current -= 1;
        const mins = Math.floor(totalTimeRef.current / 60);
        const secs = totalTimeRef.current % 60;
        setMinutes(mins);
        setSeconds(secs);

        // last 10 seconds animation
        if (totalTimeRef.current <= 10 && totalTimeRef.current > 0) {
          // playEffect('timer', true); // optional sound
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

        // every 30 seconds short phase
        if (totalTimeRef.current % 30 === 0 && totalTimeRef.current !== 0) {
          setIsThirtySecPhase(true);
          let repeatCount = 0;
          const animateInterval = setInterval(() => {
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

            // playEffect('timer', true); // optional
            repeatCount += 1;
            if (repeatCount >= 10) {
              clearInterval(animateInterval);
              setIsThirtySecPhase(false);
            }
          }, 1000);
        }

        // local timeout handling — in multiplayer server may handle too
        if (totalTimeRef.current <= 0) {
          clearInterval(interval);
          // Navigate to WellDone or notify server — here we mimic MathInputScreen behavior
          const incorrectCount = incorrectCountRef.current;
          const attempted = correctAnswersRef.current + incorrectCount;
          const correctPercentage =
            attempted > 0
              ? Math.round((correctAnswersRef.current / attempted) * 100)
              : 0;
          socket.emit('game-completed', {
            score: scoreRef.current,
            correct: scoreRef.current,
            time: timer,
          });
          console.log('completed Score', scoreRef.current);
          console.log('time', timer);
          console.log('correct', score);
          socket.on('game-winner', winner => {
            console.log('🏆 WINNER RECEIVED:', winner);
          });

          navigation.replace('MultiplayerResultScreen', {
            totalScore: scoreRef.current,
            correctCount: correctAnswersRef.current,
            inCorrectCount: incorrectCount,
            skippedQuestions: skippedCountRef.current,
            correctPercentage,
            difficulty,
            isWinner: true,
            // isWinner: winner?.winnerId === user?.id,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const handlePress = async value => {
    if (loading || awaitingResult) return; // don't accept while waiting for server

    const key = value.toLowerCase();
    const playerId = await AsyncStorage.getItem('playerId');

    if (key === 'clear') {
      setInput('');
      return;
    }
    if (key === '⌫') {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    if (key === 'skip') {
      // mark skipped locally, emit to server
      skippedCountRef.current += 1;
      setSkippedCount(skippedCountRef.current);
      setFeedback('skipped');
      socketRef.current?.emit('next-question', {userId: user?.id});
      setTimeout(() => {
        setFeedback(null);
      }, 900);
      return;
    }

    // normal numeric/symbol input
    const newInput = input + value;
    setInput(newInput);

    // if length meets expected answer length -> emit to server
    if (newInput.length >= correctAnswer.length) {
      const isCorrect = newInput === correctAnswer;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        console.log('SCore1', scoreRef.current);
      }
      // setAwaitingResult(true);
      // setFeedback('pending');
      socketRef.current?.emit('submit-answer', {
        answer: newInput,
        // In multiplayer you were sending timeSpent:100 earlier; keep same
        userName: user?.username,
        playerId: playerId,
      });

      // keep UI pending until server emits result (listeners above will update feedback/score)
      // fallback: if server doesn't respond in X ms, clear awaiting state (optional)
      setTimeout(() => {
        if (awaitingResult) {
          // give a soft timeout fallback (keeps UX responsive)
          setAwaitingResult(false);
          setFeedback(null);
        }
      }, 5000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar backgroundColor="#0B1220" barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}>
          <Icon name="chevron-back" size={scaleFont(18)} color="#000" />
        </TouchableOpacity>

        <View style={{flexDirection: 'row', alignItems: 'center'}}>
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
          <Text style={{color: '#fff', fontSize: scaleFont(15), marginLeft: 6}}>
            {`${minutes}:${String(seconds).padStart(2, '0')}`}
          </Text>
        </View>

        <View style={{width: width * 0.06}} />
      </View>

      <Text style={styles.question}>{loading ? 'Loading...' : question}</Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: height * 0.04,
        }}>
        <View
          style={[
            styles.answerBox,
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
            {feedback === 'pending'
              ? 'Checking...'
              : feedback === 'correct'
              ? 'Correct'
              : feedback === 'incorrect'
              ? 'Incorrect'
              : feedback === 'skipped'
              ? 'Skipped'
              : input}
          </Text>
        </View>
      </View>

      {/* Display small stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>Score: {score}</Text>
        <Text style={styles.statText}>Correct: {correctAnswers}</Text>
        <Text style={styles.statText}>Skipped: {skippedCount}</Text>
      </View>

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
                      colors={['#FFAD90', '#FF4500']}
                      style={styles.gradientButton}>
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
                      colors={['#595CFF', '#87AEE9']}
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
    </SafeAreaView>
  );
};

export default MultiPlayerGame;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0B1220'},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    marginBottom: height * 0.03,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statText: {color: '#fff', fontSize: scaleFont(12), opacity: 0.8},
});
