import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSocket } from '../../Context/Socket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { currentQuestion } = route.params;

  const [input, setInput] = useState('');
  const [question, setQuestion] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    // Handler for incoming new question
    const handleNewQuestion = (q) => {
      console.log('📥 Received new-question:', q);  // <--- log the question
      const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
    };

    // Handler for next-question acknowledgement or payload
    const handleNextQuestion = (data) => {
      console.log('next-question:', data);
      const q = data.question;
       const mathSymbol = getMathSymbol(q.symbol);
      setQuestion(`${q.input1} ${mathSymbol} ${q.input2}`);
      setCorrectAnswer(String(q.answer));
      setInput('');
      setLoading(false);
    };

    socket.on('new-question', handleNewQuestion);
    socket.on('next-question', handleNextQuestion);

    // Apply the initial question if passed from lobby
    if (currentQuestion) {
      console.log('📥 Initial question from lobby:', currentQuestion);  // log initial question
      const mathSymbol = getMathSymbol(currentQuestion.symbol);
      setQuestion(`${currentQuestion.input1} ${mathSymbol} ${currentQuestion.input2}`);
      setCorrectAnswer(String(currentQuestion.answer));
      setLoading(false);
    }

    return () => {
      socket.off('new-question', handleNewQuestion);
      socket.off('next-question', handleNextQuestion);
    };
  }, [socket, currentQuestion]);

  useEffect(() => {
    // Load user data
    AsyncStorage.getItem('userData').then(stored => {
      if (stored) setUser(JSON.parse(stored));
    }).catch(console.error);
  }, []);

  const handlePress = async (value) => {
    const key = value.toLowerCase();
    const playerId = await AsyncStorage.getItem('playerId');

    if (key === 'clear') {
      setInput('');
    } else if (key === '⌫') {
      setInput(prev => prev.slice(0, -1));
    } else if (key === 'skip') {
      socketRef.current?.emit('next-question', { userId: user?.id });
    } else {
      const newInput = input + value;
      setInput(newInput);

      if (newInput.length >= correctAnswer.length) {
        setTimeout(() => {
          socketRef.current?.emit('submit-answer', {
            answer: newInput,
            timeSpent: 100,
            userName: user?.username,
            playerId: playerId,
          });
        }, 500);
      }
    }
  };


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
     <StatusBar backgroundColor="#0B1220" barStyle="light-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="chevron-back" size={scaleFont(18)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Game</Text>
        <View style={{ width: width * 0.06 }} />
      </View>

      <Text style={styles.question}>{loading ? 'Loading...' : question}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: height * 0.04 }}>
        <View style={styles.answerBox}>
          <Text style={styles.answerText}>{input}</Text>
        </View>
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
                  style={[styles.keyButton, isSpecial ? styles.specialKey : null]}
                >
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
  title: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
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
});
