import React from 'react';
import {
  Dimensions,
  PixelRatio,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Globalfile/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../Globalfile/CustomHeader';

const { width, height } = Dimensions.get('window');
const scale = size => (width / 375) * size;
const scaleFont = size => size * PixelRatio.getFontScale();

const menuItems = [
  {
    icon: 'notifications-on',
    label: 'NOTIFICATION',
    route: 'GameNotifications',
    lib: 'MaterialIcons',
  },
  { icon: 'person-circle-outline', label: 'PROFILE', route: 'ProfileScreen' },
  { icon: 'person-add-outline', label: 'FRIENDS', route: 'AddUserScreen' },
  { icon: 'time-outline', label: 'HISTORY', route: 'CommingSoon' },
  { icon: 'stats-chart-outline', label: 'STATS', route: 'CommingSoon' },
  { icon: 'trophy-outline', label: 'ACHIEVEMENTS', route: 'CommingSoon' },
  { icon: 'bar-chart-outline', label: 'LEADERBOARD', route: 'CommingSoon' },
  { icon: 'settings', label: 'SETTINGS', route: 'SettingsScreen' },
  { icon: 'color-palette-outline', label: 'THEME', route: 'ThemeSelectorScreen' },
  { icon: 'volume-medium-outline', label: 'SOUND', route: 'SoundScreen' },
  /* { icon: 'language', label: 'LANGUAGE', route: 'CommingSoon' }, REMOVED */
  {
    icon: 'support-agent',
    label: 'SUPPORT',
    route: 'CommingSoon',
    lib: 'MaterialIcons',
  },
];

const More = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const insets = useSafeAreaInsets(); // ✅ Hook

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const Content = () => (
    <View style={{ flex: 1, paddingTop: insets.top + 30 }}>
      {/* Header outside main container for edge-to-edge separator */}
      <CustomHeader
        title="MORE"
        onBack={() => navigation.navigate('Home')}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.menuList}>
          {menuItems.map((item, index) => {
            const IconComp =
              item.lib === 'MaterialIcons' ? MaterialIcons : Ionicons;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  if (item.route === 'ThemeSelectorScreen') {
                    navigation.navigate('ThemeSelectorScreen', {
                      from: 'settings',
                    });
                  } else {
                    navigation.navigate(item.route);
                  }
                }}>
                <IconComp
                  name={item.icon}
                  size={scale(20)}
                  color={theme.text || '#fff'}
                  style={styles.icon}
                />
                <Text style={[styles.menuText, { color: theme.text || '#fff' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ✅ Themed Logout Button */}
        <View style={{ paddingHorizontal: width * 0.06 }}>
          <LinearGradient
            colors={[theme.primary || '#FB923C', theme.primary || '#FF7F50']}
            style={styles.logoutButton}>
            <TouchableOpacity
              onPress={() => setShowLogoutModal(true)}
              style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 🔥 Center Popup Confirmation Modal */}
        {showLogoutModal && (
          <View style={styles.centerOverlay}>
            <View
              style={[
                styles.centerModal,
                { backgroundColor: theme.cardBackground || '#1E293B' },
              ]}>
              <Text style={[styles.centerTitle, { color: theme.text || '#fff' }]}>
                Logout
              </Text>

              <Text style={[styles.centerMessage, { color: theme.text || '#fff' }]}>
                Are you sure you want to logout?
              </Text>

              <View style={styles.centerButtons}>
                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  style={styles.centerCancelBtn}>
                  <Text style={styles.centerCancelTxt}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  style={styles.centerLogoutBtn}>
                  <Text style={styles.centerLogoutTxt}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Content />
    </View>
  );
};

export default More;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.02,
    // paddingTop: height * 0.03, // REMOVED
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // marginTop: height * 0.03,
    marginBottom: height * 0.04,
    paddingHorizontal: width * 0.05,
    gap: '32%',
  },
  menuTitle: {
    fontSize: scaleFont(17),
    fontWeight: 'bold',
    marginLeft: width * 0.0,
    opacity: 0.9,
    alignSelf: 'center',
  },
  menuList: {
    flexGrow: 1,
    paddingHorizontal: width * 0.06,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.025,
  },
  icon: {
    marginRight: width * 0.04,
  },
  menuText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    opacity: 0.85,
  },
  logoutButton: {
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: height * 0.06,
    marginTop: height * 0.03,
    overflow: 'hidden',
    paddingHorizontal: width * 0.06,
  },
  logoutText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },

  centerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  centerModal: {
    width: '80%',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: 'center',
  },

  centerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    marginBottom: 10,
  },

  centerMessage: {
    fontSize: scaleFont(14),
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 25,
  },

  centerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  centerCancelBtn: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
  },

  centerCancelTxt: {
    fontSize: scaleFont(14),
    color: '#94A3B8',
    fontWeight: '600',
  },

  centerLogoutBtn: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },

  centerLogoutTxt: {
    fontSize: scaleFont(14),
    color: '#fff',
    fontWeight: '700',
  },

});
