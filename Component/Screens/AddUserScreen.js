import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';

const { width, height } = Dimensions.get('window');
const scale = size => (width / 375) * size;
const scaleFont = size => size * (width / 375);

const AddUserScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { theme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingCount();
    fetchUsers();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const fetchPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        'http://43.204.167.118:3000/api/friend/friend-request',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPendingCount(response.data.total);
    } catch (error) {
      console.log('❌ Error fetching pending count:', error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        'http://43.204.167.118:3000/api/friend/alluser-list',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("All User", response);

      if (response.data.success) {
        const filtered = response.data.users.filter(
          u => u.friendshipStatus !== 'accepted',
        );
        setUsers(filtered);
        setFilteredUsers(filtered);
      }
    } catch (error) {
      console.log('❌ Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchedUsers = async text => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://43.204.167.118:3000/api/friend/search-user-list',
        { searchText: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const filtered = response.data.users.filter(
        u => u.friendshipStatus !== 'accepted',
      );
      setFilteredUsers(filtered);
    } catch (error) {
      console.log('❌ Error searching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async recipientId => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('userData');
      if (!token || !user) return;

      const parsedUser = JSON.parse(user);
      console.log('DEBUG: Parsed User Data from AsyncStorage:', parsedUser);

      // Fix: Check for both 'id' and '_id'
      const requesterId = parsedUser?.id || parsedUser?._id;

      console.log(`DEBUG: Requester ID: ${requesterId}, Recipient ID: ${recipientId}`);

      if (!requesterId || !recipientId) {
        console.error('❌ Missing Requester or Recipient ID');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Missing user information. Please login again.',
        });
        return;
      }

      const payload = {
        requester: requesterId,
        recipient: recipientId,
      };

      console.log('DEBUG: Sending Frontend Payload (Refixed):', JSON.stringify(payload, null, 2));

      const response = await fetch(
        'http://43.204.167.118:3000/api/friend/add-friend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      console.log('DEBUG: Response Status:', response.status);
      const data = await response.json();
      console.log('DEBUG: Backend Response Data:', data);

      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Friend Request Sent',
        });
        setFilteredUsers(prev =>
          prev.map(u =>
            u._id === recipientId ? { ...u, friendshipStatus: 'pending' } : u,
          ),
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Request Failed',
          text2: data.message || 'Something went wrong',
        });
      }
    } catch (error) {
      console.log('Error sending friend request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong. Please try again.',
      });
    }
  };
  const handleSearch = text => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      fetchSearchedUsers(text);
    }
  };

  const renderItem = ({ item }) => {
    const status = item.friendshipStatus;

    return (
      <View
        style={[
          styles.friendRow,
          { backgroundColor: theme.backgroundGradient || '#1E293B' },
        ]}>
        <View style={styles.friendInfo}>
          <Image
            source={require('../Screens/Image/avater.png')}
            style={styles.avatar}
          />
          <View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[styles.usernameText, { color: theme.subText }]}>
                Username:{' '}
              </Text>
              <Text style={[styles.usernameText1, { color: theme.text }]}>
                {item.username}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[styles.nameText, { color: theme.subText }]}>
                Name:{' '}
              </Text>
              <Text style={[styles.usernameText1, { color: theme.text }]}>
                John Doe
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[styles.ratingText, { color: theme.subText }]}>
                Rating:{' '}
              </Text>
              <Text style={[styles.usernameText1, { color: theme.text }]}>
                1200
              </Text>
            </View>
          </View>
        </View>

        {status === 'pending' ? (
          <View
            style={[
              styles.addButton,
              { backgroundColor: theme.secondary || '#64748B' },
            ]}>
            <Text style={styles.addText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.primary || '#17677F' },
            ]}
            onPress={() => handleAddFriend(item._id)}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchUsers();
      fetchPendingCount();
    }
  }, [isFocused]);

  useEffect(() => {
    // 🔹 Modular style usage for onMessage
    const auth = messaging();
    const unsubscribe = auth.onMessage(async remoteMessage => {
      const { data } = remoteMessage;
      // ... existing logic ...
      if (!data) return;

      const userData = await AsyncStorage.getItem('fullLoginResponse');
      const parsedData = userData ? JSON.parse(userData) : null;
      const myUserId = parsedData?.player?.id;
      if (!myUserId) return;

      const { requester, recipient, type } = data;

      if (type === 'FRIEND_ACCEPTED' || type === 'FRIEND_REJECTED') {
        setFilteredUsers(prev =>
          prev.filter(u => u._id !== requester && u._id !== recipient),
        );
        fetchPendingCount();
      }

      if (type === 'FRIEND_REQUEST' && recipient === myUserId) {
        fetchPendingCount();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <LinearGradient
      colors={theme.backgroundGradient || ['#0F172A', '#1E293B']}
      style={{ flex: 1, }}>
      <View style={[styles.container]}>
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton]}>
              <Icon
                name="caret-back-outline"
                size={scale(22)}
                color={theme.text || '#fff'}
              />
            </TouchableOpacity>
            <Text style={[styles.header, { color: theme.text }]}>Friends</Text>
          </View>

          <View style={styles.notificationContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FriendRequestScreen')}>
              <Icon
                name="notifications-outline"
                size={scale(22)}
                color={theme.text || '#fff'}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.error || '#EF4444' },
              ]}>
              <Text style={styles.badgeText}>{pendingCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* 🔹 Added Separator Line */}
        <View
          style={{
            height: 1,
            backgroundColor: '#94A3B8',
            opacity: 0.3,
            marginBottom: height * 0.02,
            borderColor: '#94A3B8',
            borderWidth: 1,
            marginHorizontal: -width * 0.05,
            top: 10
          }}
        />

        {/* 🔍 Search */}
        <View style={{ top: 20, flex: 1 }}>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.cardBackground || '#1E293B' },
            ]}>
            <Icon
              name="search"
              size={scale(22)}
              color={theme.subText || '#94A3B8'}
            />
            <TextInput
              placeholder="Search Contacts"
              placeholderTextColor={theme.subText || '#94A3B8'}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary || '#FB923C'}
              style={{ marginTop: height * 0.05 }}
            />
          ) : (
            <>
              <View
                style={[
                  styles.inviteSection,
                  { backgroundColor: theme.cardBackground || '#1E293B' },
                ]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Invite & Connect
                </Text>

                <TouchableOpacity
                  style={[styles.inviteButton1, { backgroundColor: '#25D366' }]}>
                  <FontAwesome
                    name="whatsapp"
                    size={scale(20)}
                    color="#fff"
                    style={styles.iconLeft}
                  />
                  <Text style={styles.inviteText}>
                    Invite Friends via WhatsApp or SMS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.inviteButton,
                    { backgroundColor: theme.cardBackground || '#1E293B' },
                  ]}>
                  <View style={styles.fbIconCircle}>
                    <FontAwesome name="facebook" size={scale(22)} color="#fff" />
                  </View>
                  <Text style={[styles.inviteText, { color: theme.text }]}>
                    Facebook Friends
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Friends ({filteredUsers.length})
              </Text>
              <ScrollView
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}>
                <FlatList
                  data={filteredUsers}
                  keyExtractor={item => item._id}
                  renderItem={renderItem}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingBottom: height * 0.1 }}
                />
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </LinearGradient>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.03,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: width * 0.3,
    borderRadius: 10,
    padding: width * 0.015,
  },
  header: {
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFont(10),
    fontWeight: '700',
  },
  searchContainer: {
    borderRadius: 8,
    marginBottom: height * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: '3%',
  },
  searchInput: {
    height: height * 0.055,
    paddingHorizontal: 12,
    flex: 1,
  },
  inviteSection: {
    borderRadius: 10,
    padding: width * 0.03,
    marginBottom: height * 0.03,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginBottom: height * 0.015,
  },
  inviteButton1: {
    borderRadius: 8,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.03,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: height * 0.012,
  },
  inviteButton: {
    borderRadius: 8,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.03,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconLeft: {
    marginRight: width * 0.03,
  },
  inviteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scaleFont(14),
  },
  fbIconCircle: {
    backgroundColor: '#1877F2',
    width: scale(34),
    height: scale(34),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: width * 0.03,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.015,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(50),
    height: scale(50),
    marginRight: width * 0.03,
  },
  addButton: {
    borderRadius: 6,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.006,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scaleFont(18),
  },
  usernameText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  usernameText1: {
    fontSize: scaleFont(13),
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: scaleFont(12),
    marginTop: 2,
  },
  ratingText: {
    fontSize: scaleFont(11),
    marginTop: 2,
  },
});

export default AddUserScreen;
