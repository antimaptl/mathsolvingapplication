import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

// 🎵 Import SoundManager
import {
  playBackgroundMusic,
  stopBackgroundMusic,
  muteBackgroundMusic,
  unmuteBackgroundMusic,
} from '../Globalfile/playBackgroundMusic';

const { width, height } = Dimensions.get('window');
const scaleFont = (size) => size * PixelRatio.getFontScale();

const Home = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Start background music when Home mounts
    playBackgroundMusic();

    return () => {
      // Stop music when leaving Home
      stopBackgroundMusic();
    };
  }, []);

  const toggleSound = () => {
    if (isMuted) {
      unmuteBackgroundMusic();
    } else {
      muteBackgroundMusic();
    }
    setIsMuted(!isMuted);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 25 }]}>
      <StatusBar backgroundColor="#0B1220" barStyle="light-content" />

      <View style={styles.iconGrid}>
        <View style={styles.iconColumn}>
          <TouchableOpacity onPress={() => navigation.navigate('CommingSoon')}>
            <Image source={require('../Screens/Image/funcation.png')} style={styles.gridIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image source={require('../Screens/Image/profile.png')} style={styles.gridIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconColumn}>
          <TouchableOpacity onPress={() => navigation.navigate('CommingSoon')}>
            <Image source={require('../Screens/Image/setting.png')} style={styles.gridIcon} />
          </TouchableOpacity>

          {/* Sound Toggle Button */}
          <TouchableOpacity onPress={toggleSound}>
            <MaskedView
              maskElement={
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-high'}
                  size={width * 0.07}
                  color="black"
                  style={{ marginBottom: height * 0.010 }}
                />
              }
            >
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                colors={['#00F5FF', '#00C3FF', '#006BFF']}
                style={{ width: width * 0.08, height: width * 0.08 }}
              />
            </MaskedView>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center Buttons */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PlayGame', { gametype: 'play' })}
        style={styles.newButton1}>
        <Image source={require('../Screens/Image/pluse.png')} style={styles.ticketIcon} />
        <Text style={styles.newText}>Play</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('PlayGame', { gametype: 'playOnline' })}
        style={styles.newButton}>
        <Image source={require('../Screens/Image/pluse.png')} style={styles.ticketIcon} />
        <Text style={styles.newText}>Play Online</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', paddingHorizontal: width * 0.04 },
  iconGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  iconColumn: { flexDirection: 'column', justifyContent: 'space-between', height: height * 0.12 },
  gridIcon: { width: width * 0.08, height: width * 0.08, resizeMode: 'contain', marginBottom: height * 0.015 },
  newButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#FB923C', paddingVertical: height * 0.015, paddingHorizontal: width * 0.12, marginTop: height * 0.02, width: width * 0.70, height: height * 0.07, borderRadius: width * 0.053, justifyContent: 'center' },
  newButton1: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#FB923C', paddingVertical: height * 0.015, paddingHorizontal: width * 0.12, marginTop: height * 0.3, width: width * 0.70, height: height * 0.07, borderRadius: width * 0.053, justifyContent: 'center' },
  ticketIcon: { width: width * 0.07, height: width * 0.07, resizeMode: 'contain', marginRight: width * 0.03 },
  newText: { fontSize: scaleFont(18), color: '#fff', fontWeight: '700' },
});
