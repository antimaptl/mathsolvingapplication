import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon6 from 'react-native-vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../Globalfile/CustomHeader';

const { width, height } = Dimensions.get('window');

// ✅ Enhanced normalize for full responsiveness
const scale = width / 375;
const verticalScale = height / 812;
const moderateScale = (size, factor = 0.5) =>
  size + (scale * size - size) * factor;
const normalize = size => Math.round(moderateScale(size));

export default function SignUp() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [countryFlag, setCountryFlag] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [otp, setotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [gender, setGender] = useState('');
  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [errors, setErrors] = useState({});
  const [isTicked, setIsTicked] = useState(false);
  const [tncError, setTncError] = useState(false);


  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const permission = await request(
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      );

      if (permission === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          async position => {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            const data = await response.json();

            if (data) {
              const countryName = data.countryName || '';
              const countryCode = data.countryCode || '';
              // const flag = getFlagEmoji(countryCode);

              // ❌ NO CITY  
              // ONLY COUNTRY
              setCountry(countryName);
              // setCountryFlag(flag);
            }
          },
          error => {
            console.log(error);
            Toast.show({
              type: 'error',
              text1: 'Location Error',
              text2: 'Unable to fetch your location automatically',
            });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } else {
        Toast.show({
          type: 'info',
          text1: 'Permission Denied',
          text2: 'Please enable location access in settings',
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // const getFlagEmoji = countryCode => {
  //   if (!countryCode) return '';
  //   return countryCode
  //     .toUpperCase()
  //     .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  // };

  const validateEmail = email => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSignUp = async () => {
    let tempErrors = {};

    // ✅ T&C validation
    if (!isTicked) {
      setTncError(true);
      return;
    } else {
      setTncError(false);
    }

    // ✅ Frontend validations
    if (!username.trim()) tempErrors.username = 'Username is required';
    if (!email.trim()) tempErrors.email = 'Email is required';
    else if (!validateEmail(email))
      tempErrors.email = 'Invalid email format';

    if (!password.trim())
      tempErrors.password = 'Password is required';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});

    try {
      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            password,
            country,
            countryFlag,
            dateOfBirth,
            gender: gender || undefined, // Send undefined if empty to omit key
          }),
        },
      );

      const data = await response.json();
      console.log('Signup Response Data:', data);

      // ❌ Backend validation errors
      if (!response.ok || data.success === false) {
        handleApiErrors(data);
        return;
      }

      // ✅ SUCCESS → OTP SENT
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: `OTP sent to ${email}`,
      });

      // console.log("GenderHHHHHHHHHHHHHHHHHHHHHHh", gender)
      navigation.navigate('EmailVerification', {
        userData: {
          username,
          email,
          password,
          country,
          countryFlag,
          dateOfBirth,
          gender,
        },
      });

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please try again later',
      });
    }
  };

  const handleApiErrors = (data) => {
    let fieldErrors = {};

    // 🔹 Example backend responses handling
    if (data.message) {
      const msg = data.message.toLowerCase();

      if (msg.includes('username')) {
        fieldErrors.username = data.message;
      }

      if (msg.includes('email')) {
        fieldErrors.email = data.message;
      }

      if (msg.includes('password')) {
        fieldErrors.password = data.message;
      }
    }

    // 🔹 If backend sends error object
    if (data.errors) {
      Object.keys(data.errors).forEach(key => {
        fieldErrors[key] = data.errors[key];
      });
    }

    setErrors(fieldErrors);

    // 🔹 Fallback: If no specific field matched, show global error
    if (Object.keys(fieldErrors).length === 0 && data.message) {
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: data.message,
      });
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={normalize(20)}>
      <LinearGradient colors={['#0f162b', '#0f162b']} style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 30 }]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.backButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              onPress={() => navigation.goBack()}>
              <Icon
                name="caret-back-outline"
                size={normalize(28)}
                color="white"
              />
            </TouchableOpacity>

            <Text style={styles.title}>Sign - Up</Text>

            <InputField
              icon={require('../Screens/Image/gender.png')}
              placeholder="Username *"
              value={username}
              onChangeText={setUserName}
              error={errors.username}
            />

            <InputField
              icon={require('../Screens/Image/face.png')}
              placeholder="Email *"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (validateEmail(text) && errors.email) {
                  setErrors(prev => ({ ...prev, email: undefined }));
                }
              }}

              keyboardType="email-address"
              error={errors.email}
            />

            <View
              style={[
                styles.inputContainer,
                errors.password && styles.errorBorder,
              ]}>
              <MaterialIcons
                name="lock"
                size={normalize(20)}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your Password *"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={text => {
                  setPassword(text);

                  if (text.length >= 6 && errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={normalize(20)}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <View
              style={[
                styles.dropdownContainer,
                errors.gender && styles.errorBorder,
              ]}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowGenderOptions(!showGenderOptions)}>
                <View style={styles.dropdownTextContainer}>
                  <MaterialIcons
                    name="person"
                    size={normalize(24)}
                    color="#94A3B8"
                    style={styles.genderIcon}
                  />
                  <Text
                    style={[
                      styles.input1,
                      { color: gender ? 'white' : '#94A3B8' },
                    ]}>
                    {gender ? (gender === 'other' ? 'Others' : gender.charAt(0).toUpperCase() + gender.slice(1)) : 'Select Gender'}
                  </Text>
                </View>
                <MaterialIcons
                  name={
                    showGenderOptions
                      ? 'keyboard-arrow-up'
                      : 'keyboard-arrow-down'
                  }
                  size={normalize(24)}
                  color="#94A3B8"
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
              {showGenderOptions && (
                <View style={styles.dropdownOptions}>
                  {[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Others', value: 'other' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setGender(option.value);
                        setShowGenderOptions(false);
                      }}>
                      <Text style={styles.dropdownOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.inputContainer]}>
              <MaterialIcons
                name="calendar-month"
                size={normalize(20)}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Year of Birth"
                placeholderTextColor="#94A3B8"
                value={dateOfBirth}
                onChangeText={(text) => {
                  // Allow only numbers and max 4 digits
                  if (/^\d{0,4}$/.test(text)) {
                    setDateOfBirth(text);
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.tickContainer}>
              <TouchableOpacity
                onPress={() => setIsTicked(!isTicked)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.tickBox,
                    isTicked && styles.tickChecked,
                    tncError && !isTicked && styles.errorBorder,
                  ]}>
                  {isTicked ? '✔' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('TermsAndConditions');
                }}>
                <Text style={styles.tncText}>Please Read T&C</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
              <Text style={styles.loginButtonText}>Sign - Up</Text>
            </TouchableOpacity>

            <Toast />
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Toast.show({ type: 'info', text1: 'Google login coming soon' })
                }>
                <Icon6 name="google" size={normalize(20)} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'Twitter login coming soon',
                  })
                }>
                <Icon6 name="x-twitter" size={normalize(20)} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'Facebook login coming soon',
                  })
                }>
                <Icon6 name="facebook" size={normalize(20)} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.registerText}>
                Already a member?{' '}
                <Text style={styles.registerLink}>Sign - In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// Input Field Component
const InputField = ({ icon, error, ...props }) => (
  <>
    <View style={[styles.inputContainer, error && styles.errorBorder]}>
      <Image style={styles.inputIcon} source={icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#94A3B8"
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: normalize(-20),
    left: normalize(0),
  },
  tickContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(10),
    marginEnd: 'auto',
    start: 10,
  },
  tickBox: {
    borderWidth: 1,
    borderColor: '#8e8e8e',
    width: normalize(35),
    height: normalize(25),
    marginRight: 20,
    textAlign: 'center',
    color: '#fff',
    borderRadius: 4,
  },
  tickChecked: { backgroundColor: '#fff', color: 'black' },
  tncText: { color: 'red', fontSize: normalize(12) },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: normalize(50),
    paddingTop: normalize(50),
  },
  formContainer: {
    width: width > 500 ? 500 : width * 0.9,
    alignSelf: 'center',
    padding: normalize(20),
  },
  title: {
    fontSize: normalize(32),
    fontWeight: '600',
    color: 'white',
    marginBottom: normalize(30),
    textAlign: 'center',
    top: '-8%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: normalize(10),
    paddingHorizontal: normalize(15),
  },
  inputIcon: {
    marginRight: normalize(10),
    height: normalize(20),
    width: normalize(20),
  },
  input: {
    flex: 1,
    height: normalize(40),
    color: 'white',
    fontSize: normalize(16),
  },
  loginButton: {
    backgroundColor: '#FB923C',
    borderRadius: 50,
    height: normalize(45),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(20),
    marginTop: normalize(20),
  },
  loginButtonText: {
    color: 'white',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: normalize(10),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFF',
  },
  dividerText: {
    color: '#94A3B8',
    paddingHorizontal: normalize(10),
    fontSize: normalize(14),
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#17677F',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: width * 0.02,
  },
  registerText: {
    marginTop: normalize(15),
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: normalize(14),
  },
  registerLink: {
    color: '#ff8c00',
    fontSize: normalize(16),
  },
  dropdownContainer: {
    marginBottom: normalize(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(15),
    alignItems: 'center',
  },
  dropdownTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderIcon: {
    marginRight: normalize(10),
  },
  input1: {
    color: '#94A3B8',
    fontSize: normalize(16),
  },
  dropdownIcon: {
    marginTop: normalize(3),
  },
  dropdownOptions: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  dropdownOptionText: {
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(15),
    color: 'white',
    fontSize: normalize(16),
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: normalize(12),
    marginBottom: normalize(10),
    marginLeft: normalize(5),
    alignSelf: "flex-end"
  },
});
