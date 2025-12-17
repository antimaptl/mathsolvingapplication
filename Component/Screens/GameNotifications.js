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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';

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

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // ID of currently expanded item

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
        // Map API data to UI structure
        const mappedData = (res.data.requests || []).map(req => ({
          id: req.requester._id, // Use requester ID as unique key for actions
          user: req.requester.username,
          time: req.createdAt, // ISO String
          type: 'friend_request',
          message: 'Has sent you a friend request.',
          fullMessage: `User ${req.requester.username} wants to be your friend. Access their profile to see more details.`,
          actions: ['Accept', 'Reject'],
          recipient: req.recipient, // Needed for API action
        }));
        setNotifications(mappedData);
      }
    } catch (error) {
      console.log('Fetch Notif Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Helper: Relative Time
  const getRelativeTime = (isoString) => {
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

    return past.toLocaleDateString(); // Fallback for old dates
  };

  // 3. Handle Expand/Collapse
  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  // 4. Handle Actions (Accept/Reject)
  const handleAction = async (notification, actionType) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = actionType === 'Accept'
        ? 'http://43.204.167.118:3000/api/friend/accept-friend'
        : 'http://43.204.167.118:3000/api/friend/reject-friend';

      // Optimistic Update: Remove from list immediately
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

      const res = await axios.post(
        url,
        { requester: notification.id, recipient: notification.recipient },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        Toast.show({
          type: 'success',
          text1: actionType === 'Accept' ? 'Request Accepted' : 'Request Rejected',
        });
      } else {
        // Revert if failed (optional, simplified here)
        Toast.show({ type: 'error', text1: 'Action Failed', text2: res.data.message });
        fetchNotifications(); // Refresh entire list to be safe
      }
    } catch (e) {
      console.log('Action Error:', e);
      Toast.show({ type: 'error', text1: 'Network Error' });
      fetchNotifications();
    }
  };


  // ---------- Components ----------

  const ActionButton = ({ type, action, notification }) => {
    if (type === 'friend_request') {
      const isAccept = action === 'Accept';
      return (
        <TouchableOpacity
          onPress={() => handleAction(notification, action)}
          style={styles.actionIconWrapper}
        >
          <MaterialCommunityIcons
            name={isAccept ? 'check-circle' : 'close-circle'}
            size={scaleFont(30)} // Slightly larger for better touch target
            color={isAccept ? theme.successColor || '#10B981' : theme.dangerColor || '#EF4444'}
          />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const NotificationCard = ({ data }) => {
    const isExpanded = expandedId === data.id;
    const isSystem = data.type === 'system';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleExpand(data.id)}
        style={[
          styles.notificationCard,
          {
            backgroundColor: theme.cardBackground || '#1E293B',
            borderColor: theme.borderColor || '#334155',
          },
        ]}>

        {/* Header: User & Time */}
        <View style={styles.cardHeader}>
          <Text style={[styles.username, { color: theme.text }]}>
            {data.user}
          </Text>
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

          {/* Action Buttons (Always visible for friend requests for quick access) */}
          {data.type === 'friend_request' && (
            <View style={styles.actionsRow}>
              {data.actions.map((act, idx) => (
                <ActionButton key={idx} type={data.type} action={act} notification={data} />
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
    );
  };


  const Content = () => (
    <SafeAreaView style={styles.container}>
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
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.notificationsList}>
          {notifications.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              No new notifications
            </Text>
          ) : (
            notifications.map(n => <NotificationCard key={n.id} data={n} />)
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
      <Toast />
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor || '#f4f4f4' }}>
      <Content />
    </View>
  );
};

export default GameNotifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
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
    overflow: 'hidden', // for animation
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
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