import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { navigate } from '../Globalfile/navigationRef';
import notifee, { AndroidImportance } from '@notifee/react-native';

const Notification = () => {
  const requestUserPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) getFcmToken();
        } else getFcmToken();
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) getFcmToken();
      }
    } catch (e) {
      console.log('Permission error:', e);
    }
  };

  const getFcmToken = async () => {
    try {
      const auth = messaging();
      const token = await auth.getToken();
      if (token) {
        console.log('🔥 Generated FCM Token:', token);
        await AsyncStorage.setItem('fcmToken', token);
        sendTokenToServer(token);
      } else {
        console.log('⚠️ Failed to generate FCM Token');
      }
    } catch (e) {
      console.log('❌ FCM token error:', e);
    }
  };

  // 🔹 Use Auth Context to detect login
  const { token } = React.useContext(require('../Globalfile/AuthProvider').AuthContext);

  // Trigger sync when token changes
  useEffect(() => {
    if (token) {
      console.log('✅ Auth Token detected in Notification.js, syncing FCM...');
      getFcmToken();
    }
  }, [token]);

  const sendTokenToServer = async fcmToken => {
    console.log('📤 Sending FCM token to server:', fcmToken);
    try {
      // Use token from context or storage
      const authToken = token || await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('⚠️ No Auth Token available to send FCM token');
        return;
      }

      const res = await axios.patch(
        'http://43.204.167.118:3000/api/auth/save-fcmToken',
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('FCM token sent to server result:', res.status)
    } catch (e) {
      console.log('Send token error:', e);
    }
  };

  const showBanner = async remoteMessage => {
    const { notification, data } = remoteMessage;
    if (!notification) return;

    const title = notification.title || 'Notification';
    const body = notification.body || 'You have a new notification';
    const type = data?.type || null;

    // Only send native notification, no banner
    if (Platform.OS === 'android') {
      try {
        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title,
          body,
          android: {
            channelId,
            largeIcon: 'ic_largeicon',
            smallIcon: 'ic_notification',
            color: '#f094fb',
          },
        });
      } catch (err) {
        console.log('Notifee notification error:', err);
      }
    }
  };

  const handleNavigation = remoteMessage => {
    const type = remoteMessage?.data?.type;
    console.log('🔔 Notification Clicked, Type:', type);

    if (type === 'FRIEND_REQUEST' || type === 'ADD_FRIEND') {
      console.log('👉 Navigating to GameNotifications');
      navigate('GameNotifications');
    }
  };

  useEffect(() => {
    const auth = messaging();
    const unsubscribeForeground = auth.onMessage(showBanner);
    const unsubscribeBackground = auth.onNotificationOpenedApp(handleNavigation);

    auth.getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) handleNavigation(remoteMessage);
      });

    const unsubscribeToken = auth.onTokenRefresh(token => sendTokenToServer(token));

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeToken();
    };
  }, []);

  // Banner UI removed entirely
  return null;
};

export default Notification;
