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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const {width} = Dimensions.get('window');

const AddUserScreen = () => {
  const navigation = useNavigation();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({}); 
  const [pendingCount, setPendingCount] = useState(0);

  // 🔔 Fetch pending requests count
  const fetchPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get('http://43.204.167.118:3000/api/friend/friend-request', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingCount(response.data.count);
    } catch (error) {
      console.log('❌ Error fetching pending count:', error.message);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  // 📡 Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        'http://43.204.167.118:3000/api/friend/alluser-list',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
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
        { searchText: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setFilteredUsers(response.data.users);
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
      console.log('Add Friend Response:', data);

      if (
        data.message?.toLowerCase().includes('already sent') ||
        data.message?.toLowerCase().includes('recived friend request') ||
        data.message?.toLowerCase().includes('request sent') ||
        data.success
      ) {
        setPendingRequests(prev => ({...prev, [recipientId]: 'pending'}));
        Toast.show({
          type: 'success',
          text1: data.message || 'Friend Request Sent',
        });
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔍 Search input change
  const handleSearch = text => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredUsers(users);
    } else {
      fetchSearchedUsers(text); // ✅ call backend search
    }
  };

  // 🧩 Render User
  const renderItem = ({item}) => {
    const isPending = pendingRequests[item._id] === 'pending';
    return (
      <View style={styles.friendRow}>
        <View style={styles.friendInfo}>
          <Image
            source={require('../Screens/Image/avater.png')}
            style={styles.avatar}
          />
          <Text style={styles.friendName}>{item.username}</Text>
        </View>

        {isPending ? (
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.badgeText}>{pendingCount}</Text>
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
            Friends ({filteredUsers.length})
          </Text>
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={{paddingBottom: 30}}
          />
        </>
      )}
    </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: '3%',
  },
  searchInput: {
    height: 45,
    paddingHorizontal: 12,
    color: '#fff',
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
