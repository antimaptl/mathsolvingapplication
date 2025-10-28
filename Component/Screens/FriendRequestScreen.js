import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  PixelRatio,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scaleFont = (size) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const FriendRequestScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const fetchCalled = useRef(false); // prevent double fetch

  // 🔹 Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      console.log('🌍 Calling API:', 'http://43.204.167.118:3000/api/friend/friend-request');

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please log in again.',
        });
        return;
      }

      const response = await axios.get(
        'http://43.204.167.118:3000/api/friend/friend-request',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setRequests(response.data.requests || []);
      } else if (response.data.message === 'No friend requests received') {
        setRequests([]);
        Toast.show({
          type: 'info',
          text1: 'No friend requests yet',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to load friend requests',
          text2: response.data.message || 'Something went wrong',
        });
      }

    } catch (error) {
      console.log('Error fetching friend requests:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Unable to fetch friend requests. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Accept or reject a request
  const handleAction = async (requesterId, recipientId, actionType) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const url =
        actionType === 'accepted'
          ? 'http://43.204.167.118:3000/api/friend/accept-friend'
          : 'http://43.204.167.118:3000/api/friend/reject-friend';

      // Disable double click
      setRequests((prev) =>
        prev.map((req) =>
          req.requester._id === requesterId
            ? { ...req, processing: true }
            : req
        )
      );

      const response = await axios.post(
        url,
        { requester: requesterId, recipient: recipientId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1:
            actionType === 'accepted'
              ? 'Friend request accepted 🎉'
              : 'Friend request rejected ❌',
        });

        // Remove request locally
        setRequests((prev) =>
          prev.filter(
            (req) => req.requester._id !== requesterId
          )
        );
      } else {
        if (!response.data.message?.includes('Exactly one of topic')) { // skip FCM warning
          Toast.show({
            type: 'error',
            text1: response.data.message || 'Failed to update request',
          });
        }
        // Reset processing flag
        setRequests((prev) =>
          prev.map((req) =>
            req.requester._id === requesterId
              ? { ...req, processing: false }
              : req
          )
        );
      }
    } catch (error) {
      const msg = error.response?.data?.message;
      if (!msg?.includes('Exactly one of topic')) { // skip FCM warning
        Toast.show({
          type: 'error',
          text1: msg || 'Something went wrong, please try again.',
        });
      }
      console.log('Error handling request:', error.response?.data || error.message);
      setRequests((prev) =>
        prev.map((req) =>
          req.requester._id === requesterId
            ? { ...req, processing: false }
            : req
        )
      );
    }
  };

  useEffect(() => {
    if (!fetchCalled.current) {
      fetchCalled.current = true;
      fetchFriendRequests();
    }
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Image
          source={require('../Screens/Image/avater.png')}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>{item.requester?.username}</Text>
          <Text style={styles.subText}>{item.requester?.email}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#22C55E' }]}
          disabled={item.processing}
          onPress={() =>
            handleAction(item.requester._id, item.recipient, 'accepted')
          }>
          <Text style={styles.btnText}>
            {item.processing ? 'Processing...' : 'Accept'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#EF4444' }]}
          disabled={item.processing}
          onPress={() =>
            handleAction(item.requester._id, item.recipient, 'rejected')
          }>
          <Text style={styles.btnText}>
            {item.processing ? 'Processing...' : 'Reject'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Friend Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#FB923C" size="large" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No friend requests yet.</Text>
          }
        />
      )}
    </View>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 6,
  },
  header: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: (SCREEN_WIDTH * 0.12) / 2,
    marginRight: 12,
  },
  name: {
    color: '#fff',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  subText: {
    color: '#94A3B8',
    fontSize: scaleFont(13),
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-around',
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: SCREEN_WIDTH * 0.3,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scaleFont(14),
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: scaleFont(16),
  },
});

export default FriendRequestScreen;
