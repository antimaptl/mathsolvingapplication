import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Search, X, Users, Clock, Star} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import {useSocket} from '../../Context/Socket';

// const SOCKET_SERVER_URL = 'http://192.168.1.10:3000/';

export default function Lobby() {
  const socket = useSocket();
  const route = useRoute();
  const {difficulty, digit, symbol, timer, qm} = route.params;
  const navigation = useNavigation();
  let playerId;
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [playersInQueue, setPlayersInQueue] = useState(47);
  const [estimatedWait, setEstimatedWait] = useState('2-3 min');
  const [userRating, setUserRating] = useState(1847);
  const [userName, setUserName] = useState('Player');
  const [player, setPlayer] = useState();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const socketRef = useRef(null);

  const storePlrId = async playerId => {
    await AsyncStorage.setItem('playerId', playerId);
  };
  useEffect(() => {
    // const socket = io(SOCKET_SERVER_URL);
    if (!socket) return;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Connected to socket server');
    });

    socket.on('lobby-joined', data => {
      // ✅ Correct
      storePlrId(data.player.id);
      console.log('📥 lobby-joined:', data);
    });

    socket.on('potential-opponents', data => {
      console.log('🔥 potential-opponents:', data);
    });

    socket.on('match-found', ({gameRoom, opponent, initialQuestionMeter}) => {
      console.log('match Found Line 49');

      console.log(
        '2222222222222222222222' + gameRoom.id,
        opponent,
        initialQuestionMeter,
      );
    });

    socket.on('game-started', ({gameState, currentQuestion}) => {
      navigation.navigate('MultiPlayerGame', {currentQuestion});
      console.log(gameState, currentQuestion);
    });

    return () => {
      socket.disconnect();
      socket.off('connect');
      socket.off('lobby-joined');
      socket.off('potential-opponents');
    };
  }, [socket]);

  useEffect(() => {
    const getUserData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('✅ User Info:', user);
        setPlayer(user);
      }
    };
    getUserData();
  }, []);
  useEffect(() => {
    if (isSearching) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );

      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      );

      pulseAnimation.start();
      rotateAnimation.start();

      const timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
        pulseAnimation.stop();
        rotateAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [isSearching]);

  const handleStartSearch = async () => {
    setIsSearching(true);
    setSearchTime(0);

    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      console.log('===================%%%%%%%%%', userData);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('join-lobby', {
          userId: userData.id,
          username: userData.username,
          email: userData.email,
          rating: userData.pr?.pvp?.[difficulty] ?? 1000,
          diff: difficulty,
          timer: timer,
          symbol: symbol,
        });
      } else {
        console.warn('User data not found or socket not ready');
      }
    } catch (error) {
      console.error('Error getting user data from AsyncStorage:', error);
    }

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchTime(0);
    if (socketRef.current) {
      socketRef.current.emit('cancel_search');
    }
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#0B1220', '#0B1220']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game Lobby</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.content, {transform: [{scale: scaleAnim}]}]}>
        <View style={styles.playerCard}>
          <View style={styles.ratingSection}>
            <Star color="#ffd700" size={20} />
            <Text style={styles.ratingText}>
              Rating:{player?.pr?.pvp[difficulty]}
            </Text>
          </View>
          <Text style={styles.playerName}>{userName}</Text>
        </View>

        <View style={styles.matchCard}>
          {!isSearching ? (
            <View style={styles.readyState}>
              <View style={styles.iconContainer}>
                <Search color="#90caf9" size={48} />
              </View>
              <Text style={styles.statusTitle}>Ready to Find Match</Text>
              <Text style={styles.statusSubtitle}>
                You'll be matched with players of similar rating
              </Text>

              <View style={styles.queueInfo}>
                <View style={styles.infoRow}>
                  <Users color="#90caf9" size={16} />
                  <Text style={styles.infoText}>
                    {playersInQueue} players in queue
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Clock color="#90caf9" size={16} />
                  <Text style={styles.infoText}>
                    Est. wait: {estimatedWait}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleStartSearch}>
                <Text style={styles.searchButtonText}>Find Match</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.searchingState}>
              <Animated.View
                style={[
                  styles.searchIconContainer,
                  {
                    transform: [{scale: pulseAnim}, {rotate: spin}],
                  },
                ]}>
                <Search color="#90caf9" size={48} />
              </Animated.View>

              <Text style={styles.searchingTitle}>Searching for Match...</Text>
              <Text style={styles.searchingSubtitle}>
                Looking for players with rating {userRating - 100} -{' '}
                {userRating + 100}
              </Text>

              {/* <View style={styles.searchStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatTime(searchTime)}</Text>
                  <Text style={styles.statLabel}>Search Time</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{playersInQueue}</Text>
                  <Text style={styles.statLabel}>In Queue</Text>
                </View>
              </View> */}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSearch}>
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  playerName: {
    color: '#90caf9',
    fontSize: 14,
    opacity: 0.8,
  },
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  readyState: {alignItems: 'center'},
  iconContainer: {
    backgroundColor: 'rgba(144, 202, 249, 0.1)',
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#90caf9',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  queueInfo: {
    width: '100%',
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  infoText: {
    color: '#90caf9',
    fontSize: 14,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#FB923C',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchingState: {alignItems: 'center'},
  searchIconContainer: {
    backgroundColor: 'rgba(144, 202, 249, 0.1)',
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 14,
    color: '#90caf9',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  searchStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {alignItems: 'center', flex: 1},
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#90caf9',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  cancelButtonText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '600',
  },
  gameSettingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    color: '#90caf9',
    fontSize: 14,
  },
  settingValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
