import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  PixelRatio, ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import { playBackgroundMusic, stopBackgroundMusic } from '../Globalfile/playBackgroundMusic';

const { width, height } = Dimensions.get('window');
const scale = (size) => (width / 375) * size;
const scaleFont = (size) => size * PixelRatio.getFontScale();

const WellDoneScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    totalScore,
    correctCount,
    inCorrectCount,
    skippedQuestions,
    correctPercentage,
    difficulty,
  } = route.params;

  // 🎶 Celebration Sound
  const celebrationRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      // Play sound when screen is focused
      celebrationRef.current = new Sound('endgame.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound', error);
          return;
        }
        celebrationRef.current.play((success) => {
          if (!success) console.log('Sound playback failed');
        });
      });

      // Stop sound when screen is unfocused
      return () => {
        if (celebrationRef.current) {
          celebrationRef.current.stop(() => {
            celebrationRef.current.release();
            celebrationRef.current = null;
          });
        }
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      stopBackgroundMusic();
      return () => {
        playBackgroundMusic();
      };
    }, [])
  );

  console.log('+++++++++++++++params', JSON.stringify(route.params, null, 2));

  return (
    <SafeAreaView>
      <StatusBar backgroundColor="#0B1220" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <ConfettiCannon count={150} origin={{ x: width / 2, y: 0 }} fadeOut autoStart fallSpeed={4000} />

        <Text style={styles.title}>Well Done</Text>

        <View style={styles.scoreBox}><Text style={styles.label}>Total Score</Text><Text style={styles.value}>{totalScore}</Text></View>
        <View style={styles.scoreBox}><Text style={styles.label}>Correct Count</Text><Text style={styles.value}>{correctCount}</Text></View>
        <View style={styles.scoreBox}><Text style={styles.label}>Incorrect Count</Text><Text style={styles.value}>{inCorrectCount}</Text></View>
        <View style={styles.scoreBox}><Text style={styles.label}>Skipped Questions</Text><Text style={styles.value}>{skippedQuestions}</Text></View>
        <View style={styles.scoreBox}><Text style={styles.label}>Correct Percentage</Text><Text style={styles.value}>{correctPercentage}%</Text></View>

        <TouchableOpacity onPress={() => navigation.navigate("PlayGame", { gametype: "play" })} style={styles.newGameBtn}>
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("BottomTab")} style={styles.homeBtn}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WellDoneScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    paddingVertical: height * 0.08,
  },
  title: {
    fontSize: scaleFont(30),
    color: '#fff',
    fontWeight: '700',
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
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  newGameBtn: {
    width: '60%',
    backgroundColor: '#F7931E',
    borderRadius: scale(30),
    paddingVertical: height * 0.012,
    alignItems: 'center',
    marginTop: height * 0.06,
  },
  newGameText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: 'bold',
  },
  homeBtn: {
    width: '60%',
    backgroundColor: '#fff',
    borderRadius: scale(30),
    paddingVertical: height * 0.015,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  homeText: {
    color: '#0B1220',
    fontSize: scaleFont(18),
    fontWeight: 'bold',
  },
});
