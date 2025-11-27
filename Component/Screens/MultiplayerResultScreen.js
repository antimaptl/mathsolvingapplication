import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';

const { width, height } = Dimensions.get('window');
const scale = size => (width / 375) * size;
const scaleFont = size => size * PixelRatio.getFontScale();

const MultiplayerResultScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const {
    totalScore,
    correctCount,
    inCorrectCount,
    skippedQuestions,
    correctPercentage,
    isWinner,   // 👈 TRUE = Win , FALSE = Lose
  } = route.params;

  const confettiRef = useRef(null);

  const Content = () => (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>

      {/* 🎉 Confetti Only if Win */}
      {isWinner && (
        <ConfettiCannon
          count={150}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          autoStart
          fallSpeed={4000}
        />
      )}

      {/* 🔥 Dynamic Title */}
      <Text style={[styles.title, { color: isWinner ? '#fff' : '#FF5252' }]}>
        {isWinner ? "You Win!" : "Better Luck\nNext Time!"}
      </Text>

      {/* 🔥 Score Boxes (Same UI) */}
      <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.label}>Total Score</Text>
        <Text style={styles.value}>{totalScore}</Text>
      </View>

      <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.label}>Correct Answers</Text>
        <Text style={styles.value}>{correctCount}</Text>
      </View>

      <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.label}>Incorrect Answers</Text>
        <Text style={styles.value}>{inCorrectCount}</Text>
      </View>

      <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.label}>Skipped</Text>
        <Text style={styles.value}>{skippedQuestions}</Text>
      </View>

      <View style={[styles.scoreBox, { backgroundColor: theme.cardBackground }]}>
        <Text style={styles.label}>Accuracy</Text>
        <Text style={styles.value}>{correctPercentage}%</Text>
      </View>

      {/* 🎮 New Game */}
      <LinearGradient
        colors={[theme.primary, theme.primary]}
        style={styles.newGameBtn}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('PlayGame', { gametype: 'MULTIPLAYER' })}
          style={{ width: '100%', alignItems: 'center' }}
        >
          <Text style={styles.newGameText}>Play Again</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 🏠 Home */}
      <TouchableOpacity
        onPress={() => navigation.navigate('BottomTab')}
        style={[styles.homeBtn, { backgroundColor: theme.cardBackground }]}
      >
        <Text style={[styles.homeText, { color: '#fff' }]}>Home</Text>
      </TouchableOpacity>

    </ScrollView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <StatusBar backgroundColor={theme.backgroundGradient[0]} barStyle="light-content" />
      <Content />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <StatusBar backgroundColor="#0B1220" barStyle="light-content" />
      <Content />
    </View>
  );
};

export default MultiplayerResultScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: height * 0.08,
  },
  title: {
    fontSize: scaleFont(34),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: height * 0.1,
    marginTop: height * 0.1,
  },
  scoreBox: {
    width: '80%',
    backgroundColor: '#1E293B',
    borderRadius: scale(12),
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.015,
  },
  label: {
    color: '#B0BEC5',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  value: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  newGameBtn: {
    width: '60%',
    borderRadius: scale(30),
    paddingVertical: height * 0.012,
    alignItems: 'center',
    marginTop: height * 0.06,
    overflow: 'hidden',
  },
  newGameText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: 'bold',
  },
  homeBtn: {
    width: '60%',
    borderRadius: scale(30),
    paddingVertical: height * 0.015,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  homeText: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
  },
});
