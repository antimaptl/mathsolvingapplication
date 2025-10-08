import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const FriendRequestScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalType, setModalType] = useState('success'); // success | error
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];

  // 🔹 Fade animation for modal
  const showModal = (type, text) => {
    setModalType(type);
    setModalText(text);
    setModalVisible(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto close in 2 sec
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }, 2000);
  };

  // 🔹 Fetch requests
  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
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
      } else {
        showModal('error', 'Failed to load requests');
      }
    } catch (error) {
      console.log('Error fetching friend requests:', error);
      showModal('error', 'Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Accept / Reject request
  const handleAction = async (requesterId, recipientId, actionType) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url =
        actionType === 'accepted'
          ? 'http://43.204.167.118:3000/api/friend/accept-friend'
          : 'http://43.204.167.118:3000/api/friend/reject-friend';

      const response = await axios.post(
        url,
        {
          requester: requesterId,
          recipient: recipientId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        // Success popup
        showModal(
          'success',
          actionType === 'accepted'
            ? 'Friend request accepted 🎉'
            : 'Friend request rejected ❌'
        );

        // Remove from list
        setRequests((prev) =>
          prev.filter(
            (req) =>
              req.requester._id !== requesterId &&
              req.recipient !== recipientId
          )
        );
      } else {
        showModal('error', response.data.message || 'Failed to update request');
      }
    } catch (error) {
      console.log('Error handling request:', error.response?.data || error.message);
      showModal(
        'error',
        error.response?.data?.message ||
          'Something went wrong, please try again.'
      );
    }
  };

  useEffect(() => {
    fetchFriendRequests();
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
          onPress={() =>
            handleAction(item.requester._id, item.recipient, 'accepted')
          }>
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#EF4444' }]}
          onPress={() =>
            handleAction(item.requester._id, item.recipient, 'rejected')
          }>
          <Text style={styles.btnText}>Reject</Text>
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

      {/* 🔹 Custom Popup Modal */}
      <Modal transparent visible={modalVisible} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  modalType === 'success' ? '#22C55E' : '#EF4444',
                opacity: fadeAnim,
              },
            ]}>
            <Icon
              name={modalType === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={40}
              color="#fff"
            />
            <Text style={styles.modalText}>{modalText}</Text>
          </Animated.View>
        </View>
      </Modal>
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
    fontSize: 18,
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
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subText: {
    color: '#94A3B8',
    fontSize: 13,
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
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    width: 250,
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default FriendRequestScreen;
