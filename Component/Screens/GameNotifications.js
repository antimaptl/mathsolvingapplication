import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  PixelRatio,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../Globalfile/ThemeContext';

const {width, height} = Dimensions.get('window');
const scaleFont = size => size * PixelRatio.getFontScale();


const dummyNotifications = [
  {
    id: 1,
    user: 'Username',
    time: '1 d ago',
    type: 'general',
    message: 'Short Description about the game update.',
    detail: 'Tap to view details',
  },
  {
    id: 2,
    user: 'Username',
    time: '3 d ago',
    type: 'friend_request', 
    message: 'Sent you a Friend Request',
    actions: ['Accept', 'Reject'],
  },
  {
    id: 3,
    user: 'mATHLETICS',
    time: '1 m ago',
    type: 'system',
    message: 'Welcome to mATHLETICS!',
    detail: 'Click to explore the new features.',
  },
  {
    id: 4,
    user: 'Username',
    time: '3 d ago',
    type: 'poke',
    message: 'Poked You',
    actions: ['Poke Back'],
  },
];

const GameNotifications = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();

  // ---------- Action Buttons Renderer ----------
  const ActionButton = ({type, action}) => {
    // Friend Request Actions
    if (type === 'friend_request') {
      const isAccept = action === 'Accept';
      return (
        <TouchableOpacity style={styles.actionIconWrapper}>
          <MaterialCommunityIcons
            name={isAccept ? 'check-circle' : 'close-circle'}
            size={scaleFont(24)}
            color={isAccept ? theme.successColor || '#10B981' : theme.dangerColor || '#EF4444'}
          />
        </TouchableOpacity>
      );
    }

    // Poke Back Action
    if (type === 'poke' && action === 'Poke Back') {
      return (
        <TouchableOpacity style={styles.actionPokeButton}>
          <Ionicons
            name="arrow-back-sharp"
            size={scaleFont(14)}
            color={theme.text || '#000'}
            style={{marginRight: 4}}
          />
          <Text style={[styles.actionText, {color: theme.text || '#000'}]}>
            {action}
          </Text>
          <Ionicons
            name="arrow-forward-sharp"
            size={scaleFont(14)}
            color={theme.text || '#000'}
            style={{marginLeft: 4}}
          />
        </TouchableOpacity>
      );
    }
    return null;
  };

  // ---------- Notification Card Component ----------
  const NotificationCard = ({data}) => {
    // Trailing Arrow/Icon for the far right side
    const TrailingArrow = ({isSystem}) => (
      <MaterialCommunityIcons
        name={isSystem ? 'arrow-down' : 'arrow-up'}
        size={scaleFont(20)}
        color={isSystem ? theme.primaryColor : theme.text}
        style={{opacity: isSystem ? 1 : 0.6}}
      />
    );

    const cardBackgroundColor = theme.cardBackground || '#fff';

    return (
      <View
        style={[
          styles.notificationCard,
          {
            backgroundColor: cardBackgroundColor,
            borderColor: theme.borderColor || '#334155',
          },
        ]}>
        {/* Row 1: User/System Name, Time, and Trailing Icon */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.username,
                {
                  color: data.type === 'system' ? theme.primaryColor : theme.text,
                  opacity: data.type === 'system' ? 1 : 0.9,
                },
              ]}>
              {data.user}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.time, {color: theme.text || '#000'}]}>
              {data.time}
            </Text>
            {/* Trailing Arrow for general/system notifs */}
            {(data.type === 'general' || data.type === 'system') && (
              <TrailingArrow isSystem={data.type === 'system'} />
            )}
            {/* Trailing Arrow for action notifs */}
            {(data.type === 'friend_request' || data.type === 'poke') && (
              <TrailingArrow isSystem={false} />
            )}
          </View>
        </View>

        {/* Row 2: Message and Action Buttons */}
        <View style={styles.cardBody}>
          <Text
            style={[
              styles.message,
              {
                color: theme.text || '#000',
                opacity: 0.8,
                
                maxWidth: data.actions ? '65%' : '90%', 
              },
            ]}>
            {data.message}
          </Text>

          {/* Action Buttons Container */}
          {data.actions && (
            <View
              style={
                data.type === 'friend_request'
                  ? styles.friendRequestActions
                  : styles.pokeActions
              }>
              {data.actions.map((action, index) => (
                <ActionButton key={index} type={data.type} action={action} />
              ))}
            </View>
          )}
        </View>
      </View>
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

        <Text
          style={[
            styles.headerTitle,
            {color: theme.text || 'black'},
          ]}>
          NOTIFICATIONS
        </Text>
        <View style={styles.rightPlaceholder} />
      </View>
      <View style={styles.headerSeparator} />
      {/* --- Notification List --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.notificationsList}>
        {dummyNotifications.map(notification => (
          <NotificationCard key={notification.id} data={notification} />
        ))}
        {/* Scroll Margin */}
        <View style={{height: 30}} />
      </ScrollView>
    </SafeAreaView>
  );

  // Background Theme
  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View
      style={{flex: 1, backgroundColor: theme.backgroundColor || '#f4f4f4'}}>
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

  // --- Header Styles ---
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
    // marginLeft: -width * 0.08,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  username: {
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  time: {
    fontSize: scaleFont(12),
    opacity: 0.7,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginTop: 5,
  },
  message: {
    fontSize: scaleFont(14),
    fontWeight: '400',
    flexShrink: 1,
  },
  
  friendRequestActions: {
    flexDirection: 'row',
    gap: 15, 
  },
  actionIconWrapper: {
    padding: 2,
  },
  pokeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 8,
   
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
  },
  actionText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
});