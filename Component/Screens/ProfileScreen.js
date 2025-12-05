import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../Globalfile/ThemeContext'; // ✅ Theme hook

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const ProfileScreen = () => {
  const Navigation = useNavigation();
  const {theme} = useTheme(); // ✅ Theme from context
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.log('Token not found');
          setLoading(false);
          return;
        }
        const response = await fetch(
          'http://43.204.167.118:3000/api/auth/getUser',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

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

  console.log('UserData', userData);
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, '0');

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[date.getMonth()];

    const year = date.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  const getFlagEmoji = countryCode => {
    if (!countryCode) return '';
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  // ✅ Main screen content separated for cleaner theme wrapping
  const Content = () => (
    <SafeAreaView style={[styles.container]}>
      <StatusBar
        backgroundColor={
          theme.backgroundGradient ? theme.backgroundGradient[0] : '#0D0D26'
        }
        barStyle="light-content"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => Navigation.goBack()}>
            <Icon name="caret-back-outline" size={normalize(23)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <FontAwesome5 name="user-edit" size={normalize(16)} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{marginTop: 50}}
          />
        ) : (
          <View style={styles.profileSection}>
            {/* Profile Section */}
            <View style={styles.profileTop}>
              <View style={styles.imageContainer}>
                <Image
                  source={require('../Screens/Image/dummyProfile.jpg')}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.userName}>
                  {userData?.username || 'Unknown'}
                </Text>
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
              <Text style={styles.detail}>
                First Name: {userData?.username || 'N/A'}
              </Text>
              <Text style={styles.detail}>
                Last Name: {userData?.lastName || 'N/A'}
              </Text>
              <Text style={styles.detail}>
                Year of Birth : {userData?.yearOfBirth || 'N/A'}
              </Text>
              <Text style={styles.detail}>
                Gender: {userData?.gender || 'N/A'}
              </Text>
              <Text style={styles.detail}>
                Country: {getFlagEmoji(userData?.country)}
              </Text>
            </View>

            {/* Rank Tabs */}
            <View style={styles.tabRow}>
              {['E2', 'E4', 'M2', 'M4', 'H2', 'H4'].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tab, item === 'M4' && styles.activeTab]}>
                  <Text
                    style={[
                      styles.tabText,
                      item === 'M4' && styles.activeTabText,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rank Bar */}
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>Current Rank: 10,456</Text>
              <View style={styles.rankBar}>
                <View style={[styles.rankBarFillGreen, {width: '50%'}]} />
                <View style={[styles.rankBarFillRed, {width: '45%'}]} />
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
        {showEditModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Icon
                    name="caret-back-outline"
                    size={normalize(20)}
                    color="#333"
                  />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>PROFILE</Text>
                <View style={{width: normalize(20)}} />
              </View>

              {/* Profile Image + Upload */}
              <View style={styles.modalImageRow}>
                <View style={styles.modalImageBox}></View>

                <Text style={styles.uploadText}>Upload/ Camera/ Icons</Text>
              </View>

              {/* Inputs */}
              <View style={{marginTop: normalize(15)}}>
                <Text style={styles.label}>First Name:</Text>
                <Text style={styles.label}>Last Name:</Text>
                <Text style={styles.label}>Year of Birth: ____</Text>
                <Text style={styles.label}>Gender: ____</Text>
              </View>

              {/* Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.discardBtn}>
                  <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // ✅ Apply theme background here
  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.backgroundColor || '#0D0D26',
      }}>
      <Content />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: normalize(10)},
  scrollContent: {
    paddingBottom: normalize(30),
    paddingHorizontal: normalize(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(15),
  },
  headerTitle: {color: '#fff', fontSize: normalize(18), fontWeight: '700'},
  profileSection: {marginVertical: normalize(10)},
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: normalize(30),
    overflow: 'hidden',
  },
  profileImage: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(40),
  },
  profileText: {marginLeft: normalize(30)},
  userName: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
    marginBottom: normalize(4),
  },
  joinDate: {color: '#999', fontSize: normalize(12)},
  userInfo: {marginTop: normalize(10), alignItems: 'flex-start'},
  email: {color: '#bbb', fontSize: normalize(14), marginBottom: normalize(2)},
  emailText: {color: '#4da6ff'},
  detail: {
    color: '#ccc',
    fontSize: normalize(14),
    marginVertical: normalize(2),
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(35),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize(8),
    alignItems: 'center',
    marginHorizontal: normalize(2),
    backgroundColor: '#1b1b3a',
    borderRadius: normalize(6),
  },
  activeTab: {backgroundColor: '#4e54c8'},
  tabText: {color: '#bbb', fontSize: normalize(14)},
  activeTabText: {color: '#fff', fontWeight: '600'},
  rankContainer: {marginTop: normalize(28)},
  rankText: {
    color: '#fff',
    fontSize: normalize(13),
    textAlign: 'center',
    marginBottom: normalize(20),
  },
  rankBar: {
    flexDirection: 'row',
    height: normalize(8),
    borderRadius: 6,
    overflow: 'hidden',
  },
  rankBarFillGreen: {backgroundColor: '#4CAF50'},
  rankBarFillRed: {backgroundColor: '#F44336'},
  achievementsContainer: {marginTop: normalize(25)},
  achievementTitle: {
    color: '#fff',
    fontSize: normalize(14),
    marginBottom: normalize(10),
    textAlign: 'center',
  },
  achievementRow: {flexDirection: 'row', justifyContent: 'space-between'},
  achievementBox: {
    flex: 1,
    backgroundColor: '#1e1e40',
    paddingVertical: normalize(10),
    marginHorizontal: normalize(4),
    borderRadius: normalize(8),
    alignItems: 'center',
  },
  achievementText: {color: '#ddd', fontSize: normalize(12)},
   modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: normalize(18),
    borderRadius: normalize(12),
    elevation: 10,
    transform: [{ scale: 0.95 }],
    opacity: 0.95,
  },

  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(10),
  },

  modalTitle: {
    fontSize: normalize(16),
    color: '#000',
    fontWeight: '700',
  },

  modalImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(20),
    marginTop: normalize(10),
  },

  modalImageBox: {
    width: normalize(60),
    height: normalize(60),
    borderWidth: 1,
    borderColor: '#777',
  },

  uploadText: {
    color: '#d19a00',
    fontSize: normalize(13),
    width: normalize(100),
  },

  label: {
    fontSize: normalize(13),
    color: '#333',
    fontStyle: 'italic',
    marginTop: normalize(6),
  },

  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(25),
  },

  discardBtn: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: normalize(8),
    alignItems: 'center',
  },

  saveBtn: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: normalize(8),
    alignItems: 'center',
  },

  discardText: {
    color: '#000',
  },

  saveText: {
    color: '#000',
  },
});

export default ProfileScreen;
