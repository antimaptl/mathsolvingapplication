import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { navigate } from '../Globalfile/navigationRef ';
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
      const token = await messaging().getToken();
      await AsyncStorage.setItem('fcmToken', token);
      sendTokenToServer(token);
    } catch (e) {
      console.log('FCM token error:', e);
    }
  };

  const sendTokenToServer = async fcmToken => {
    console.log('Sending FCM token to server:', fcmToken);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const res = await axios.patch(
        'http://43.204.167.118:3000/api/auth/save-fcmToken',
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('FCM token sent to server:', res)
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
    if (type === 'FRIEND_REQUEST') navigate('FriendRequestScreen');
  };

  useEffect(() => {
    requestUserPermission();

    const unsubscribeForeground = messaging().onMessage(showBanner);
    const unsubscribeBackground = messaging().onNotificationOpenedApp(handleNavigation);

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) handleNavigation(remoteMessage);
      });

    const unsubscribeToken = messaging().onTokenRefresh(token => sendTokenToServer(token));

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
