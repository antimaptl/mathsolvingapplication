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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const scale = width / 375;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const ProfileScreen = () => {
  const Navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('Token not found');
          setLoading(false);
          return;
        }

        const response = await fetch('http://43.204.167.118:3000/api/auth/getUser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setUserData(result.user);
        } else {
          console.log('Failed to fetch user:', result);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <LinearGradient colors={['#0D0D26', '#121234']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => Navigation.goBack()}>
            <Icon name="arrow-back" size={normalize(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <TouchableOpacity>
            <FontAwesome5 name="user-edit" size={normalize(16)} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.profileSection}>
            {/* Profile Section */}
            <View style={styles.profileTop}>
              <View style={styles.imageContainer}>
                <Image
                  source={require('../Screens/Image/avater.png')}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.userName}>{userData?.username || 'Unknown'}</Text>
                <Text style={styles.joinDate}>
                  Joined: {formatDate(userData?.createdAt)}
                </Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.userInfo}>
              <Text style={styles.email}>
                Email:{' '}
                <Text style={styles.emailText}>{userData?.email || 'N/A'}</Text>
              </Text>
              <Text style={styles.detail}>Gender: {userData?.gender || 'N/A'}</Text>
              <Text style={styles.detail}>Country: India</Text>
            </View>

            {/* Rank Tabs */}
            <View style={styles.tabRow}>
              {['E2', 'E4', 'M2', 'M4', 'H2', 'H4'].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tab, item === 'M4' && styles.activeTab]}>
                  <Text
                    style={[styles.tabText, item === 'M4' && styles.activeTabText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rank Bar */}
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>Current Rank: 10,456</Text>
              <View style={styles.rankBar}>
                <View style={[styles.rankBarFillGreen, { width: '50%' }]} />
                <View style={[styles.rankBarFillRed, { width: '45%' }]} />
              </View>
            </View>

            {/* Achievements */}
            <View style={styles.achievementsContainer}>
              <Text style={styles.achievementTitle}>Achievements</Text>
              <View style={styles.achievementRow}>
                {['Ach. 1', 'Ach. 2', 'Ach. 3', 'Ach. 4'].map((item, index) => (
                  <View key={index} style={styles.achievementBox}>
                    <Text style={styles.achievementText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: normalize(10) },
  scrollContent: { paddingBottom: normalize(30), paddingHorizontal: normalize(16) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(15),
  },
  headerTitle: { color: '#fff', fontSize: normalize(18), fontWeight: '700' },
  profileSection: { marginVertical: normalize(10) },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: normalize(12) },
  imageContainer: { borderWidth: 2, borderColor: '#444', borderRadius: normalize(30), overflow: 'hidden' },
  profileImage: { width: normalize(70), height: normalize(70), borderRadius: normalize(40) },
  profileText: { marginLeft: normalize(30) },
  userName: { color: '#fff', fontSize: normalize(18), fontWeight: '600', marginBottom: normalize(4) },
  joinDate: { color: '#999', fontSize: normalize(12) },
  userInfo: { marginTop: normalize(10), alignItems: 'flex-start' },
  email: { color: '#bbb', fontSize: normalize(14), marginBottom: normalize(2) },
  emailText: { color: '#4da6ff' },
  detail: { color: '#ccc', fontSize: normalize(14), marginVertical: normalize(2) },
  tabRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: normalize(35) },
  tab: { flex: 1, paddingVertical: normalize(8), alignItems: 'center', marginHorizontal: normalize(2), backgroundColor: '#1b1b3a', borderRadius: normalize(6) },
  activeTab: { backgroundColor: '#4e54c8' },
  tabText: { color: '#bbb', fontSize: normalize(14) },
  activeTabText: { color: '#fff', fontWeight: '600' },
  rankContainer: { marginTop: normalize(28) },
  rankText: { color: '#fff', fontSize: normalize(13), textAlign: 'center', marginBottom: normalize(20) },
  rankBar: { flexDirection: 'row', height: normalize(8), borderRadius: 6, overflow: 'hidden' },
  rankBarFillGreen: { backgroundColor: '#4CAF50' },
  rankBarFillRed: { backgroundColor: '#F44336' },
  achievementsContainer: { marginTop: normalize(25) },
  achievementTitle: { color: '#fff', fontSize: normalize(14), marginBottom: normalize(10), textAlign: 'center' },
  achievementRow: { flexDirection: 'row', justifyContent: 'space-between' },
  achievementBox: { flex: 1, backgroundColor: '#1e1e40', paddingVertical: normalize(10), marginHorizontal: normalize(4), borderRadius: normalize(8), alignItems: 'center' },
  achievementText: { color: '#ddd', fontSize: normalize(12) },
});

export default ProfileScreen;
