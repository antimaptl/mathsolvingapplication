import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  PixelRatio,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../Globalfile/ThemeContext';

const {width, height} = Dimensions.get('window');
const scale = width / 375;
const scaleFont = size => size * PixelRatio.getFontScale();
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const UpdateProfile = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');

  // Fetch user data
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch('http://43.204.167.118:3000/api/auth/getUser', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (result.success) {
        const u = result.user;
        setUserData(u);

        setFirstName(u.username || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setYearOfBirth(u.yearOfBirth || '');
        setGender(u.gender || '');
        setCountry(u.country || '');
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const saveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const body = {
        firstName,
        lastName,
        yearOfBirth,
        gender,
        country,
      };

      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/updateUser',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      const result = await response.json();

      if (result.success) {
        alert('Profile Updated!');
        navigation.goBack();
      } else {
        alert('Update Failed');
      }
    } catch (err) {
      console.log('Update Error:', err);
    }
  };

  const Content = () => (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="caret-back-outline" size={normalize(23)} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>EDIT PROFILE</Text>

          <View style={{width: normalize(23)}} />
        </View>

        <View style={styles.headerSeparator} />

        {/* Loader */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={{marginTop: 40}}
          />
        ) : (
          <View style={styles.form}>
            {/* Profile Placeholder */}
            <View style={styles.imageBox}>
              <Image
                source={require('../Screens/Image/dummyProfile.jpg')}
                style={styles.profileImg}
              />
              <Text style={styles.upload}>Upload / Camera</Text>
            </View>

            {/* Inputs */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />

              <Text style={styles.label}>Year of Birth</Text>
              <TextInput
                style={styles.input}
                value={yearOfBirth}
                onChangeText={setYearOfBirth}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={gender}
                onChangeText={setGender}
              />

              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} 
            //   editable={false}
               />
            </View>

            {/* Save Button */}
            <LinearGradient
              colors={[theme.primary || '#FB923C', theme.primary || '#FF7F50']}
              style={styles.playButton}>
              <TouchableOpacity
                nPress={saveProfile}
                style={{width: '100%', alignItems: 'center'}}>
                <Text style={styles.playButtonText}>Save</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  return theme.backgroundGradient ? (
    <LinearGradient colors={theme.backgroundGradient} style={{flex: 1}}>
      <Content />
    </LinearGradient>
  ) : (
    <View style={{flex: 1, backgroundColor: theme.backgroundColor}}>
      <Content />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: normalize(37),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(15),
    bottom:10
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
  },
    headerSeparator: {
    height: 1,
    backgroundColor: '#94A3B8',
    opacity: 0.5,
    top: 20,
    marginHorizontal: -width * 0.05,
    marginBottom: height * 0.02,
  },
  form: {paddingHorizontal: normalize(20), marginTop: normalize(20)},

  imageBox: {alignItems: 'center'},
  profileImg: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: normalize(50),
    borderWidth: 2,
    borderColor: '#999',
  },
  upload: {
    color: '#e3c565',
    marginTop: normalize(8),
    fontSize: normalize(12),
  },

  inputBox: {marginTop: normalize(25)},
  label: {
    color: '#fff',
    marginTop: normalize(12),
    marginBottom: 4,
    fontSize: normalize(13),
  },
  input: {
    backgroundColor: '#1c1c36',
    color: '#fff',
    borderRadius: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
  },

  playButton: {
    marginTop: height * 0.03,
    paddingVertical: height * 0.015,
    borderRadius: 20,
    width: width * 0.6,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: height * 0.04,
  },
  playButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
    fontWeight: '700',
  },
});

export default UpdateProfile;
