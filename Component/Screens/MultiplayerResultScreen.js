import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../Globalfile/ThemeContext';

const { width, height } = Dimensions.get('window');
const scale = size => (width / 375) * size;
const scaleFont = size => size * PixelRatio.getFontScale();

const MultiplayerResultScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  // State
  const [finalIsWinner, setFinalIsWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(true);

  const hasSubmittedRef = useRef(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  /* ================= ROUTE PARAMS ================= */
  const {
    totalScore,
    opponentScore,
    player2Id,
    durationSeconds,
    correctCount,
    inCorrectCount,
    skippedQuestions,
    correctPercentage,
  } = route.params;

  /* ================= GET LOGIN DATA ================= */
  useEffect(() => {
    const getLoginData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        const storedToken = await AsyncStorage.getItem('authToken');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);
        setAuthToken(storedToken);
      } catch (err) {
        console.log('AsyncStorage Error:', err?.message);
        setIsProcessing(false);
      }
    };
    getLoginData();
  }, []);

  /* ================= RESULT API ================= */
  useEffect(() => {
    // Start Animation immediately
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      })
    ]).start();

    if (!user?._id || !authToken || !player2Id) return;
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    const submitResult = async () => {
      try {
        const payload = {
          player1Id: String(user._id),
          player2Id: String(player2Id),
          scorePlayer1: totalScore,
          scorePlayer2: opponentScore,
          durationSeconds,
        };
        await axios.post(
          'http://43.204.167.118:3000/api/match/result',
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        setFinalIsWinner(totalScore > opponentScore);
      } catch (err) {
        console.log('RESULT ERROR:', err?.message);
        setFinalIsWinner(totalScore > opponentScore);
      } finally {
        setIsProcessing(false);
      }
    };
    submitResult();
  }, [user?._id, authToken, player2Id]);

  /* ================= UI COMPONENTS ================= */

  return (
    <View style={styles.mainContainer}>

      {/* 1. BACKGROUND: ORIGINAL STATS PAGE */}
      <LinearGradient
        colors={theme.backgroundGradient || ['#0B1220', '#0B1220']}
        style={styles.background}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { marginTop: insets.top }]}>

        <Text style={[styles.title, { color: finalIsWinner ? '#4ade80' : '#f7d1d1ff' }]}>
          {finalIsWinner ? 'You Win!' : 'Better Luck\nNext Time!😔'}
        </Text>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Your Score</Text>
          <Text style={styles.value}>{totalScore}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Opponent Score</Text>
          <Text style={styles.value}>{opponentScore}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Correct Answers</Text>
          <Text style={styles.value}>{correctCount}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Correct Answers</Text>
          <Text style={styles.value}>{correctCount || 0}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Incorrect Answers</Text>
          <Text style={styles.value}>{inCorrectCount || 0}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Skipped</Text>
          <Text style={styles.value}>{skippedQuestions || 0}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground || '#1f2937' }]}>
          <Text style={styles.label}>Accuracy</Text>
          <Text style={styles.value}>{correctPercentage || 0}%</Text>
        </View>

        {/* New Game Button */}
        <LinearGradient
          colors={[theme.primary || '#f97316', theme.primary || '#f97316']}
          style={styles.newGameBtn}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PlayGame', { gametype: 'MULTIPLAYER' })}
            style={{ width: '100%', alignItems: 'center' }}>
            <Text style={styles.newGameText}>Play Again</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Home Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('BottomTab')}
          style={[styles.homeBtn, { backgroundColor: theme.cardBackground || '#052757ff' }]}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>

      </ScrollView>


      {/* 2. OVERLAY MODAL: PREMIUM CARD */}
      {showModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[
            styles.resultCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}>

            {/* Players Row */}
            <View style={styles.playersRow}>
              {/* Player */}
              <View style={styles.playerSide}>
                <View style={styles.playerHeader}>
                  <Text style={styles.starIcon}>⭐</Text>
                  <Text style={styles.labelTitle}>PLAYER</Text>
                </View>
                <Text style={styles.playerRating}>{user?.rating || 1000}</Text>
                <Text style={styles.mainScore}>{totalScore}</Text>
              </View>

              {/* VS */}
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Opponent */}
              <View style={styles.opponentSide}>
                <View style={styles.playerHeader}>
                  <Text style={styles.labelTitle}>Opponent</Text>
                  <View style={styles.miniAvatar}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>OP</Text>
                  </View>
                </View>
                <Text style={styles.playerRating}>1000</Text>
                <Text style={styles.mainScore}>{opponentScore}</Text>
              </View>
            </View>

            {/* Result Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.resultTitle}>
                {finalIsWinner ? 'You Win 🏆' : 'Better Luck Next Time 😥'}
              </Text>
              {/* Duration */}
              <Text style={styles.durationText}>
                Duration seconds: <Text style={{ fontWeight: 'bold', color: '#fff' }}>{durationSeconds}</Text>
              </Text>
            </View>

            {/* OK Button - Closes Modal */}
            <TouchableOpacity
              style={styles.okButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      )}

    </View>
  );
};

export default MultiplayerResultScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space at bottom
  },

  // ORIGINAL SCREEN STYLES
  title: {
    fontSize: scaleFont(30),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  scoreBox: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  newGameBtn: {
    width: '80%',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 40,
    overflow: 'hidden',
  },
  newGameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeBtn: {
    width: '80%',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  homeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },


  // MODAL OVERLAY STYLES
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker dim
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 40,
  },
  playerSide: { flex: 1, alignItems: 'center' },
  opponentSide: { flex: 1, alignItems: 'center' },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: { fontSize: 12, marginRight: 4, color: '#FFD700' },
  labelTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  miniAvatar: {
    width: 20, height: 20, backgroundColor: '#334155', borderRadius: 4, marginLeft: 5,
    justifyContent: 'center', alignItems: 'center'
  },
  playerRating: { color: '#64748b', fontSize: 10, marginBottom: 10 },
  mainScore: { fontSize: 32, fontWeight: '700', color: '#fff' },

  vsBadge: {
    position: 'absolute',
    left: '50%',
    top: 10,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  vsText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  messageContainer: { alignItems: 'center', marginBottom: 40 },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  durationText: { color: '#64748b', fontSize: 12 },

  okButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  okButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
