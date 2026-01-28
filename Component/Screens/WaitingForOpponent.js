import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSocket} from '../../Context/Socket';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WaitingForOpponent = () => {
  const socket = useSocket();
  const navigation = useNavigation();
  const route = useRoute();

  const {challengedUser, diff, timer, symbol} = route.params;

  const [challengeId, setChallengeId] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🔄 Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // 🎧 SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    // ✅ When challenge is successfully sent
    const onChallengeSent = data => {
      console.log('✅ Challenge sent successfully:', data);
      setChallengeId(data.challengeId);
    };

    // ✅ LISTEN FOR MATCH-FOUND (sent by backend when challenge accepted)
    const onMatchFound = async data => {
      console.log('🎮 Match found (challenger):', data);

      // Get user data
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const myMongoId = user?._id || user?.id;

      // Wait for game-started event
      const onGameStarted = gameData => {
        console.log('🚀 Game started (challenger):', gameData);

        // Navigate to game
        setTimeout(() => {
          navigation.replace('MultiPlayerGame', {
            currentQuestion: gameData.currentQuestion,
            timer: timer,
            difficulty: diff,
            opponent: {
              ...data.opponent,
              stats: data.opponent?.stats || {
                wins: 0,
                losses: 0,
                winRate: 0,
                currentStreak: 0,
              },
            },
            myMongoId: myMongoId,
            isChallenge: true,
          });
        }, 300);
      };

      socket.once('game-started', onGameStarted);
    };

    // ❌ When opponent declines the challenge
    const onChallengeDeclined = data => {
      console.log('❌ Challenge declined:', data);
      Alert.alert(
        'Challenge Declined',
        `${challengedUser.username} declined your challenge`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    };

    // 🚫 When challenge is cancelled by you
    const onChallengeCancelledByYou = data => {
      console.log('🚫 You cancelled the challenge');
      navigation.goBack();
    };

    // ⏰ When challenge expires
    const onChallengeExpired = data => {
      console.log('⏱️ Challenge expired:', data);
      Alert.alert(
        'Challenge Expired',
        `${challengedUser.username} did not respond in time`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    };

    // ❌ When challenge fails
    const onChallengeError = error => {
      console.error('❌ Challenge error:', error);
      Alert.alert(
        'Challenge Failed',
        error.message || 'Could not send challenge',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    };

    socket.on('challenge-sent-success', onChallengeSent);
    socket.on('match-found', onMatchFound); // ✅ THIS IS THE KEY!
    socket.on('challenge-declined', onChallengeDeclined);
    socket.on('challenge-cancelled-by-you', onChallengeCancelledByYou);
    socket.on('challenge-expired', onChallengeExpired);
    socket.on('challenge-error', onChallengeError);

    return () => {
      socket.off('challenge-sent-success', onChallengeSent);
      socket.off('match-found', onMatchFound);
      socket.off('challenge-declined', onChallengeDeclined);
      socket.off('challenge-cancelled-by-you', onChallengeCancelledByYou);
      socket.off('challenge-expired', onChallengeExpired);
      socket.off('challenge-error', onChallengeError);
    };
  }, [socket, challengedUser, navigation, diff, timer]);

  // Cancel challenge
  const handleCancel = () => {
    if (challengeId && socket) {
      console.log('🚫 Cancelling challenge:', challengeId);
      socket.emit('cancel-challenge', {challengeId});
    }
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#0B0F1A', '#1a1f2e']} style={styles.container}>
      <Animated.View style={{transform: [{scale: pulseAnim}]}}>
        <ActivityIndicator size="large" color="#00e0ff" />
      </Animated.View>

      <Text style={styles.title}>Waiting for {challengedUser.username}</Text>

      <Text style={styles.subtitle}>
        Difficulty: {diff?.toUpperCase()} | Timer: {timer}s
      </Text>

      <Text style={styles.note}>Challenge sent…</Text>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel Challenge</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default WaitingForOpponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  note: {
    marginTop: 14,
    fontSize: 13,
    color: '#00e0ff',
  },
  cancelButton: {
    marginTop: 40,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
