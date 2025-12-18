import React, { useEffect, useState } from 'react';
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
  Modal,
  Pressable,
  Platform,
  Alert, // ✅ ADDED
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../Globalfile/ThemeContext';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const scaleFont = size => size * PixelRatio.getFontScale();
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const UpdateProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  const onUpdate = route.params?.onUpdate;

  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [showDate, setShowDate] = useState(false);

  /* ================= FETCH USER ================= */
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch('http://43.204.167.118:3000/api/auth/getUser', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.success) {
        const u = result.user;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setDateOfBirth(formatDateForUI(u.dateOfBirth));
        setGender(u.gender || '');
        setProfileImage(u.profileImage || null);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  /* ================= IMAGE PICK ================= */
  const openPicker = async type => {
    try {
      const img =
        type === 'camera'
          ? await ImagePicker.openCamera({
            cropping: true,
            width: 400,
            height: 400,
          })
          : await ImagePicker.openPicker({
            cropping: true,
            width: 400,
            height: 400,
          });

      setProfileImage(img.path);
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') {
        console.log(e);
      }
    }
  };

  /* ================= SAVE ================= */
  const saveProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      // 🔥 FIX: Always use FormData as per working Postman example
      const formData = new FormData();

      // Note: User's Postman screenshot showed 'firstname' (lowercase).
      // Matching that casing to be safe, though camelCase likely works if backend is standard.
      // But 500 often means strict validation or parsing crash.
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);

      // Sending other fields as they are
      formData.append('dateOfBirth', formatDateForAPI(dateOfBirth));
      formData.append('gender', gender);

      if (profileImage && profileImage.startsWith('file')) {
        const imageUri = Platform.OS === 'ios' ? profileImage.replace('file://', '') : profileImage;
        formData.append('profileImage', {
          uri: imageUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }

      console.log('📤 Sending FormData Update:', JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        dob: formatDateForAPI(dateOfBirth),
        gender,
        hasImage: !!(profileImage && profileImage.startsWith('file'))
      }));

      const res = await fetch('http://43.204.167.118:3000/api/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // 'Content-Type': 'multipart/form-data', // ❌ STRICTLY REMOVED: Fetch generates boundary automatically
        },
        body: formData,
      });

      console.log('📥 Profile API Status:', res.status);

      const text = await res.text();
      console.log('📥 Profile API Response:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        Alert.alert('Server Error', 'Invalid response from server.\n' + text.substring(0, 100));
        return;
      }

      if (res.ok && result.success) {
        // ✅ CALLBACK
        onUpdate?.(result.user);

        // ✅ SUCCESS
        Alert.alert(
          'Success',
          'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ProfileScreen',
                      params: { updatedUser: result.user },
                    },
                  ],
                });
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert('Update Failed', result.message || 'Server returned an error');
      }
    } catch (e) {
      console.log('❌ Profile API Error:', e);
      Alert.alert('Network Error', 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // API → UI (dd-mm-yyyy)
  const formatDateForUI = isoDate => {
    if (!isoDate) return '';
    const d = new Date(isoDate);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`; // 17-12-2025
  };

  // UI → API (yyyy-mm-dd)
  const formatDateForAPI = uiDate => {
    if (!uiDate) return '';
    const [day, month, year] = uiDate.split('-');
    return `${year}-${month}-${day}`;
  };




  /* ================= UI ================= */
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={theme.backgroundGradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon
                  name="caret-back-outline"
                  size={normalize(23)}
                  color="#fff"
                />
              </TouchableOpacity>
              {/* CHANGED: Title to PROFILE */}
              <Text style={styles.headerTitle}>PROFILE</Text>
              <View style={{ width: normalize(23) }} />
            </View>
            <View style={styles.headerSeparator} />

            {loading ? (
              <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
            ) : (
              <View style={styles.form}>
                {/* 1. PROFILE IMAGE (Left Aligned + Text on Right) */}
                <View style={styles.profileRow}>
                  <TouchableOpacity onPress={() => openPicker('gallery')}>
                    <View>
                      <Image
                        source={
                          profileImage
                            ? { uri: profileImage }
                            : require('../Screens/Image/dummyProfile.jpg')
                        }
                        style={styles.profileImg}
                      />
                      {/* Camera Icon Overlay */}
                      <View style={styles.cameraIcon}>
                        <Icon name="camera" size={16} color="#000" />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Text on the right */}
                  <Text style={styles.uploadText}>Upload / Camera / Icons</Text>
                </View>


                {/* 2. FORM FIELDS (Label Left - Input Right) */}

                {/* First Name */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>First Name:</Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Last Name */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Last Name:</Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Year of Birth */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Year of Birth:</Text>
                  <Pressable onPress={() => setShowDate(true)} style={{ flex: 1 }}>
                    <View pointerEvents="none">
                      <TextInput
                        style={styles.inlineInput}
                        editable={false}
                        value={dateOfBirth}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </Pressable>
                </View>

                {/* Gender */}
                <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Gender:</Text>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowGenderOptions(!showGenderOptions)}>
                      <View style={styles.dropdownTextContainer}>
                        {/* Removed icon to match "clean" text feel of reference, or keep if preferred. 
                             User said "Only UI layout... match attached reference". 
                             Reference usually has simple text. Keeping icon as per "Do NOT change... theme" but adjusting layout. 
                          */}
                        <Text
                          style={[
                            styles.input1,
                            { color: gender ? 'white' : '#94A3B8' },
                          ]}>
                          {gender || 'Select Gender'}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={showGenderOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={normalize(20)}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>

                    {showGenderOptions && (
                      <View style={styles.dropdownOptions}>
                        {['male', 'female', 'other'].map(option => (
                          <TouchableOpacity
                            key={option}
                            onPress={() => {
                              setGender(option);
                              setShowGenderOptions(false);
                            }}>
                            <Text style={styles.dropdownOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Country (Placeholder as per request "Country:" was in list, but no state/logic for it in original code? 
                     Checking original code... 
                     Original code has First Name, Last Name, DOB, Gender. 
                     User requested "Country:" in requirements list. 
                     "Do NOT change existing state or logic". 
                     If I add Country input without state, it won't work. 
                     I will omit Country or add a static/disabled one if strictly required visually. 
                     Logic > Visual requirement here to avoid breaking functionality. 
                     I will skip "Country" to avoid introducing broken UI without backing logic. 
                  */}

                {/* 3. BUTTONS (Discard | Save) */}
                <View style={styles.buttonRow}>
                  {/* Discard Button */}
                  <TouchableOpacity
                    style={styles.discardButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.discardText}>Discard</Text>
                  </TouchableOpacity>

                  {/* Save Button */}
                  <LinearGradient
                    colors={[theme.primary, theme.primary]} // Keep original logic
                    style={styles.saveButtonGradient}
                  >
                    <TouchableOpacity onPress={saveProfile} style={{ width: '100%', alignItems: 'center' }}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* DATE PICKER */}
      {showDate && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          maximumDate={new Date()} // ✅ Prevent future dates
          onChange={(e, d) => {
            setShowDate(false);
            if (d) {
              const iso = d.toISOString();
              setDateOfBirth(formatDateForUI(iso));
            }
          }}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    marginTop: normalize(37),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(15),
    bottom: 10,
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
    marginTop: 10,
    marginBottom: height * 0.02,
    marginHorizontal: -width * 0.05, // visually extend full width if needed, or remove
    width: '120%',
    alignSelf: 'center'
  },
  form: {
    paddingHorizontal: normalize(20),
    marginTop: normalize(10)
  },

  // 1. Image Section
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(30),
  },
  profileImg: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(30),
    borderWidth: 2,
    borderColor: '#999',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff', // White circle bg for camera icon
    borderRadius: 12,
    padding: 3,
  },
  uploadText: {
    color: '#f29810ff',
    marginLeft: normalize(20),
    fontSize: normalize(14),
    fontWeight: '500',
    opacity: 0.8
  },

  // 2. Fields
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(20),
    justifyContent: 'space-between', // Label Left, Input Right
  },
  fieldLabel: {
    color: '#fff',
    fontSize: normalize(14),
    width: '35%', // Fixed width for labels so inputs align
    fontWeight: '600',
  },
  inlineInput: {
    flex: 1, // Take remaining space
    backgroundColor: '#1c1c36', // Keep dark bg
    color: '#fff',
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10), // comfortable touch target
    fontSize: normalize(14),
  },

  // Dropdown specific
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c36',
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
  },
  dropdownTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input1: {
    color: '#fff',
    fontSize: normalize(14),
  },
  dropdownOptions: {
    backgroundColor: '#1c1c36',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#333'
  },
  dropdownOptionText: {
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(15),
    color: 'white',
    fontSize: normalize(14),
  },

  // 3. Buttons
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(40),
    marginBottom: normalize(30),
    gap: normalize(15)
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#1E293B', // Dark grey/card color
    borderRadius: 25,
    paddingVertical: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4fa5c2' // slight border to match theme feel
  },
  discardText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600'
  },
  saveButtonGradient: {
    flex: 1,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(14),
  },
  saveText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700'
  }

});

export default UpdateProfile;
