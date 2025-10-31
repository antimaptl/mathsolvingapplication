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
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../Globalfile/ThemeContext'; // ✅ import ThemeContext

const {width, height} = Dimensions.get('window');
const scale = size => (width / 375) * size;
const scaleFont = size => size * PixelRatio.getFontScale();

const menuItems = [
  {
    icon: 'notifications-on',
    label: 'NOTIFICATION',
    route: 'CommingSoon',
    lib: 'MaterialIcons',
  },
  {icon: 'person-circle-outline', label: 'PROFILE', route: 'ProfileScreen'},
  {icon: 'person-add-outline', label: 'FRIENDS', route: 'AddUserScreen'},
  {icon: 'time-outline', label: 'HISTORY', route: 'CommingSoon'},
  {icon: 'stats-chart-outline', label: 'STATS', route: 'CommingSoon'},
  {icon: 'trophy-outline', label: 'ACHIEVEMENTS', route: 'CommingSoon'},
  {icon: 'bar-chart-outline', label: 'LEADERBOARD', route: 'CommingSoon'},
  {icon: 'settings', label: 'SETTINGS', route: 'CommingSoon'},
  {icon: 'color-palette-outline', label: 'THEME', route: 'ThemeSelectorScreen'},
  {icon: 'volume-medium-outline', label: 'SOUND', route: 'CommingSoon'},
  {icon: 'language', label: 'LANGUAGE', route: 'CommingSoon'},
  {
    icon: 'support-agent',
    label: 'SUPPORT',
    route: 'CommingSoon',
    lib: 'MaterialIcons',
  },
];

const More = () => {
  const navigation = useNavigation();
  const {theme} = useTheme(); // ✅ Get theme

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('Login');
  };

  const Content = () => (
    <SafeAreaView style={[styles.container]}>
      <StatusBar
        backgroundColor={
          theme.backgroundGradient ? theme.backgroundGradient[0] : '#0F172A'
        }
        barStyle="light-content"
      />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons
            name="arrow-back"
            size={scale(24)}
            color={theme.text || '#808080'}
          />
        </TouchableOpacity>
        <Text style={[styles.menuTitle, {color: theme.text || '#fff'}]}>
          More
        </Text>
      </View>

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
              <Text style={[styles.menuText, {color: theme.text || '#fff'}]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ✅ Themed Logout Button */}
      <LinearGradient
        colors={[theme.primary || '#FB923C', theme.primary || '#FF7F50']}
        style={styles.logoutButton}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{width: '100%', alignItems: 'center'}}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{flex: 1, backgroundColor: '#0F172A'}}>
      <Content />
    </View>
  );
};

export default More;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.06,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.05,
  },
  menuTitle: {
    fontSize: scaleFont(17),
    fontWeight: 'bold',
    marginLeft: width * 0.3,
    opacity: 0.9,
  },
  menuList: {
    flexGrow: 1,
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
  },
  logoutText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
});
