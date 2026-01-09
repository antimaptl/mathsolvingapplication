import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  PixelRatio,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useSocket } from '../../Context/Socket'; // ✅ FIX 1: Import useSocket

const { width, height } = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const GameNotifications = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const socket = useSocket(); // ✅ FIX 2: Get socket at component level

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [challengeNotifications, setChallengeNotifications] = useState([]);
  const [inAppNotifications, setInAppNotifications] = useState([]); // ✅ FIX 3: Add missing state

  // 1. Fetch Notifications (Friend Requests)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const res = await axios.get(
        'http://43.204.167.118:3000/api/friend/friend-request',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        const mappedData = (res.data.requests || [])
          .filter(req => req.requester && req.requester._id)
          .map(req => ({
            id: req.requester._id,
            user: req.requester.username || 'Unknown User',
            time: req.createdAt,
            type: 'friend_request',
            message: 'Has sent you a friend request.',
            fullMessage: `User ${req.requester.username || 'Unknown'
              } wants to be your friend. Access their profile to see more details.`,
            actions: ['Accept', 'Reject'],
            recipient: req.recipient,
          }));
        setNotifications(mappedData);
      }
    } catch (error) {
      console.log('Fetch Notif Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 4: Add fetchInAppNotifications function
  const fetchInAppNotifications = async () => {
    try {
      const res = await axios.get(
        'https://mataletics-backend.onrender.com/api/notifications/in-app',
      );

      if (res.data?.success) {
        const mapped = (res.data.data || []).map((item, index) => ({
          id: `inapp-${index}`,
          user: item.title,
          time: item.date,
          type: 'in_app',
          message: item.body,
          fullMessage: item.body,
          image: item.image,
          actions: [],
        }));

        setInAppNotifications(mapped);
      }
    } catch (e) {
      console.log('In-app notif error:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchInAppNotifications(); // ✅ FIX 5: Call in-app notifications fetch
  }, []);

  // 2. Helper: Relative Time
  const getRelativeTime = isoString => {
    const now = new Date();
    const past = new Date(isoString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} d ago`;

    return past.toLocaleDateString();
  };

  // 3. Handle Expand/Collapse
  const toggleExpand = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  // ✅ FIX 6: Socket listener for challenge notifications
  useEffect(() => {
    if (!socket) return;

    const onChallengeReceived = data => {
      console.log('📩 Challenge received:', data);

      const newChallenge = {
        id: `challenge-${data.challengeId}`,
        user: data.challenger.username,
        time: new Date().toISOString(),
        type: 'challenge_received',
        message: 'Has challenged you to a game!',
        fullMessage: `${data.challenger.username
          } wants to play: ${data.gameSettings.diff.toUpperCase()} difficulty, ${data.gameSettings.timer
          }s timer`,
        actions: ['Accept', 'Decline'],
        challengeData: data,
      };

      setChallengeNotifications(prev => [newChallenge, ...prev]);
    };

    socket.on('challenge-received', onChallengeReceived);

    return () => {
      socket.off('challenge-received', onChallengeReceived);
    };
  }, [socket]); // ✅ Depend on socket

  // ✅ FIX 7: Merge all notifications correctly
  const allNotifications = [
    ...notifications,
    ...inAppNotifications,
    ...challengeNotifications,
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  // 4. Handle Actions
  const handleAction = async (notification, actionType) => {
    // Handle friend requests
    if (notification.type === 'friend_request') {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const url =
          actionType === 'Accept'
            ? 'http://43.204.167.118:3000/api/friend/accept-friend'
            : 'http://43.204.167.118:3000/api/friend/reject-friend';

        setNotifications(prev => prev.filter(n => n.id !== notification.id));

        await axios.post(
          url,
          { requester: notification.id, recipient: notification.recipient },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        Toast.show({ type: 'success', text1: `Request ${actionType}ed` });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Action Failed' });
        fetchNotifications();
      }
    }

    // ✅ Handle game challenges
    if (notification.type === 'challenge_received') {
      if (!socket || !socket.connected) {
        Toast.show({ type: 'error', text1: 'Connection error' });
        return;
      }

      // Remove notification immediately
      setChallengeNotifications(prev =>
        prev.filter(n => n.id !== notification.id),
      );

      if (actionType === 'Accept') {
        socket.emit('accept-challenge', {
          challengeId: notification.challengeData.challengeId,
        });

        // ✅ FIX 8: Listen for challenge-accepted event (not game-started)
        const handleChallengeAccepted = data => {
          console.log('✅ Challenge accepted, navigating to game:', data);

          Toast.show({
            type: 'success',
            text1: 'Challenge Accepted!',
            text2: 'Starting game...',
          });

          // Navigate to PlayGame
          navigation.navigate('PlayGame', {
            gameRoom: data.gameRoom,
            opponent: data.opponent,
            myPlayerId: data.myPlayerId,
            initialQuestionMeter: data.initialQuestionMeter,
          });
        };

        // Listen for the game start event
        socket.once('challenge-accepted', handleChallengeAccepted);

        // Also listen for game-started as backup
        socket.once('game-started', data => {
          console.log('🎮 Game started event received');
          // If already navigated via challenge-accepted, this won't execute
        });
      } else if (actionType === 'Decline') {
        socket.emit('decline-challenge', {
          challengeId: notification.challengeData.challengeId,
        });

        Toast.show({
          type: 'info',
          text1: 'Challenge Declined',
        });
      }
    }
  };

  // ---------- Components ----------

  const ActionButton = ({ type, action, notification }) => {
    if (type === 'friend_request') {
      const isAccept = action === 'Accept';
      return (
        <TouchableOpacity
          onPress={() => handleAction(notification, action)}
          style={styles.actionIconWrapper}>
          <MaterialCommunityIcons
            name={isAccept ? 'check-circle' : 'close-circle'}
            size={scaleFont(30)}
            color={
              isAccept
                ? theme.successColor || '#10B981'
                : theme.dangerColor || '#EF4444'
            }
          />
        </TouchableOpacity>
      );
    }

    // ✅ FIX 9: Add action buttons for challenge notifications
    if (type === 'challenge_received') {
      const isAccept = action === 'Accept';
      return (
        <TouchableOpacity
          onPress={() => handleAction(notification, action)}
          style={[
            styles.challengeActionButton,
            isAccept ? styles.acceptButton : styles.declineButton,
          ]}>
          <Text style={styles.challengeActionText}>{action}</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const handleDelete = (id, type) => {
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n.id !== id));
    setInAppNotifications(prev => prev.filter(n => n.id !== id));
    setChallengeNotifications(prev => prev.filter(n => n.id !== id));

    // Optional: Call specific delete API if required
    Toast.show({ type: 'success', text1: 'Notification removed' });
  };

  const renderDeleteAction = (progress, dragX, item) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteAction}>
        <Animated.View style={[styles.deleteActionContent, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={30} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  const NotificationCard = ({ data }) => {
    const isExpanded = expandedId === data.id;

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX, data)}
        onSwipeableRightOpen={() => handleDelete(data.id, data.type)}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => toggleExpand(data.id)}
          style={[
            styles.notificationCard,
            {
              backgroundColor: theme.cardBackground || '#1E293B',
              borderColor: theme.borderColor || '#334155',
            },
            // ✅ Highlight challenge notifications
            data.type === 'challenge_received' && styles.challengeCard,
          ]}>
          {/* Header: User & Time */}
          <View style={styles.cardHeader}>
            <View style={styles.userSection}>
              {data.type === 'challenge_received' && (
                <Text style={styles.challengeBadge}>🎮</Text>
              )}
              <Text style={[styles.username, { color: theme.text }]}>
                {data.user}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.time, { color: theme.subText || '#94A3B8' }]}>
                {getRelativeTime(data.time)}
              </Text>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={scaleFont(20)}
                color={theme.text}
              />
            </View>
          </View>

          {/* Body: Message */}
          <View style={styles.cardBody}>
            <Text style={[styles.message, { color: theme.text }]}>
              {data.message}
            </Text>

            {/* Action Buttons */}
            {data.actions && data.actions.length > 0 && (
              <View style={styles.actionsRow}>
                {data.actions.map((act, idx) => (
                  <ActionButton
                    key={idx}
                    type={data.type}
                    action={act}
                    notification={data}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={[styles.detailText, { color: theme.subText || '#ccc' }]}>
                {data.fullMessage}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const Content = () => (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Ionicons
                name="caret-back-outline"
                size={scaleFont(28)}
                color={theme.text || 'black'}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text || 'black' }]}>
              NOTIFICATIONS
            </Text>
            <View style={styles.rightPlaceholder} />
          </View>
          <View style={styles.headerSeparator} />

          {/* List */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 50 }}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.notificationsList}>
              {allNotifications.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                  No new notifications
                </Text>
              ) : (
                allNotifications.map(n => <NotificationCard key={n.id} data={n} />)
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          )}
          <Toast />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{ flex: 1, backgroundColor: theme.backgroundColor || '#f4f4f4' }}>
      <Content />
    </View>
  );
};

export default GameNotifications;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: height * 0.02,
    marginTop: 0,
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 20
  },
  deleteActionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: height * 0.01,
    paddingBottom: height * 0.03,
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    paddingRight: 15,
    flex: 0.15,
  },
  rightPlaceholder: {
    flex: 0.15,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#94A3B8',
    opacity: 0.5,
    marginHorizontal: -width * 0.05,
    marginBottom: height * 0.03,
  },
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: height * 0.02,
    overflow: 'hidden',
  },
  challengeCard: {
    borderColor: '#00e0ff',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeBadge: {
    fontSize: scaleFont(18),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  username: {
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  time: {
    fontSize: scaleFont(12),
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  message: {
    fontSize: scaleFont(14),
    flex: 1,
    marginRight: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  actionIconWrapper: {
    padding: 2,
  },
  challengeActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  challengeActionText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  detailText: {
    fontSize: scaleFont(13),
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: scaleFont(16),
  },
});