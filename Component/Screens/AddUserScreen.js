import React, {useState, useEffect} from 'react';
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
import {useIsFocused, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';

const {width} = Dimensions.get('window');

const AddUserScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
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
  // 🔔 Fetch pending requests count (only for this user)
  const fetchPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        'http://43.204.167.118:3000/api/friend/friend-request',
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      setPendingCount(response.data.total);
    } catch (error) {
      console.log('❌ Error fetching pending count:', error.message);
    }
  };
  // 📡 Fetch all users and remove accepted
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        'http://43.204.167.118:3000/api/friend/alluser-list',
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      if (response.data.success) {
        const filtered = response.data.users.filter(
          u => u.friendshipStatus !== 'accepted',
        );
        setUsers(filtered);
        setFilteredUsers(filtered);
      } else {
        console.log('API response:', response.data);
      }
    } catch (error) {
      console.log('❌ Error fetching users:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Backend search API
  const fetchSearchedUsers = async text => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://43.204.167.118:3000/api/friend/search-user-list',
        {searchText: text},
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

  // 🟢 Add Friend
  const handleAddFriend = async recipientId => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('userData');
      if (!token || !user) return;

      const parsedUser = JSON.parse(user);
      const requesterId = parsedUser?.id;

      const response = await fetch(
        'http://43.204.167.118:3000/api/friend/add-friend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requester: requesterId,
            recipient: recipientId,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Friend Request Sent',
        });

        // update friendshipStatus in local list
        setFilteredUsers(prev =>
          prev.map(u =>
            u._id === recipientId ? {...u, friendshipStatus: 'pending'} : u,
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

  // 🔍 Search input change
  const handleSearch = text => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      fetchSearchedUsers(text);
    }
  };

  // 🧩 Render User
  const renderItem = ({item}) => {
    const status = item.friendshipStatus;

    return (
      <View style={styles.friendRow}>
        <View style={styles.friendInfo}>
          <Image
            source={require('../Screens/Image/avater.png')}
            style={styles.avatar}
          />
          <Text style={styles.friendName}>{item.username}</Text>
        </View>

        {status === 'pending' ? (
          <View style={[styles.addButton, {backgroundColor: '#64748B'}]}>
            <Text style={styles.addText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddFriend(item._id)}>
            <Text style={styles.addText}>Add</Text>
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

  // 🔔 FCM listener for real-time updates
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const {data} = remoteMessage;
      if (!data) return;

      const userData = await AsyncStorage.getItem('fullLoginResponse');
      const parsedData = userData ? JSON.parse(userData) : null;
      const myUserId = parsedData?.player?.id;
      if (!myUserId) return;

      const {requester, recipient, type} = data;

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
    <View style={styles.container}>
      {/* 🔙 Header */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.header}>Friends</Text>
        </View>

        <View style={styles.notificationContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('FriendRequestScreen');
            }}>
            <Icon name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount || 0}</Text>
          </View>
        </View>
      </View>

      {/* 🔍 Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={22} color="#94A3B8" />
        <TextInput
          placeholder="Search by username..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* 🟢 Loader */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FB923C"
          style={{marginTop: 40}}
        />
      ) : (
        <>
          {/* 📱 Invite Section */}
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite & Connect</Text>

            <TouchableOpacity style={styles.inviteButton1}>
              <FontAwesome
                name="whatsapp"
                size={20}
                color="#fff"
                style={styles.iconLeft}
              />
              <Text style={styles.inviteText}>
                Invite Friends via WhatsApp or SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.inviteButton}>
              <View style={styles.fbIconCircle}>
                <FontAwesome name="facebook" size={23} color="#fff" />
              </View>
              <Text style={styles.inviteText}>Connect to Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* 👯‍♂️ Friends List */}
          <Text style={styles.sectionTitle}>
            All Users ({filteredUsers.length})
          </Text>
          <ScrollView
           horizontal={false}
            vertical={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
           showsVerticalScrollIndicator={false}>
            <FlatList
              data={filteredUsers}
              keyExtractor={item => item._id}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={{paddingBottom: 30}}
            />
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 6,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  notificationContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbIconCircle: {
    backgroundColor: '#1877F2',
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inviteSection: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inviteButton1: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  inviteButton: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconLeft: {
    marginRight: 10,
  },
  inviteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: '3%',
  },
  searchInput: {
    height: 45,
    paddingHorizontal: 12,
    color: '#fff',
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#1E293B',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FB923C',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddUserScreen;
