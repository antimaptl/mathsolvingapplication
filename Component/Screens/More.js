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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; 
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const scale = (size) => (width / 375) * size;
const scaleFont = (size) => size * PixelRatio.getFontScale();

const menuItems = [
  { icon: 'notifications-on', label: 'NOTIFICATION', route: 'CommingSoon' ,lib: 'MaterialIcons'},
  { icon: 'person-circle-outline', label: 'PROFILE', route: 'CommingSoon' },
  { icon: "person-add-outline", label: "FRIENDS", route: "AddUserScreen" },
  { icon: 'time-outline', label: 'HISTORY', route: 'CommingSoon' },
  { icon: "stats-chart-outline", label: "STATS", route: "CommingSoon" },
  { icon: 'trophy-outline', label: 'ACHIEVEMENTS', route: 'CommingSoon' },
  { icon: "bar-chart-outline", label: "LEADERBOARD", route: "CommingSonn" },
  { icon: 'settings', label: 'SETTINGS', route: 'CommingSoon' },
  { icon: 'color-palette-outline', label: 'THEME', route: 'CommingSoon' },
  { icon: 'volume-medium-outline', label: 'SOUND', route: 'CommingSoon' },
  { icon: 'language', label: 'LANGUAGE', route: 'CommingSoon' },
  { icon: 'support-agent', label: 'SUPPORT', route: 'CommingSoon', lib: 'MaterialIcons' },
];
const More = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => {
          navigation.navigate("Home")
        }}>
          <Ionicons name="arrow-back" size={scale(24)} color="#808080" />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>More</Text>
      </View>
      <ScrollView contentContainerStyle={styles.menuList}>
        {menuItems.map((item, index) => {
          // 👇 Choose correct icon component
          const IconComp = item.lib === 'MaterialIcons' ? MaterialIcons : Ionicons;

          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <IconComp name={item.icon} size={scale(20)} color="#fff" style={styles.icon} />
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton}
        onPress={() => {
          AsyncStorage.clear(() => {
            navigation.navigate("Login")
          });
        }}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: width * 0.06,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.05,
  },
  menuTitle: {
    color: '#fff',
    fontSize: scaleFont(17),
    fontWeight: 'bold',
    marginLeft: width * 0.30,
    opacity: 0.8,
  },
  menuList: {
    flexGrow: 1,
    // marginTop:30
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
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '500',
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: '#FB923C',
    paddingVertical: height * 0.015,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: height * 0.06,
    marginTop: height * 0.03
  },
  logoutText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: 'bold',
  },
});

export default More;
