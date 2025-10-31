// import React, {useEffect, useState} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Toast from 'react-native-toast-message';
// import {useNavigation} from '@react-navigation/native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import Geolocation from 'react-native-geolocation-service';
// import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// const {width} = Dimensions.get('window');
// const scale = width / 375;
// const normalize = size => Math.round(scale * size);

// export default function SignUp() {
//   const navigation = useNavigation();
//   const [username, setUserName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [dateOfBirth, setDateOfBirth] = useState('');
//   const [gender, setGender] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [errors, setErrors] = useState({});
//   const [usernameStatus, setUsernameStatus] = useState('');
//   const [isTicked, setIsTicked] = useState(false);

//   // Auto location logic
//   useEffect(() => {
//     getUserLocation();
//   }, []);

//   const getUserLocation = async () => {
//     try {
//       const permission = await request(
//         Platform.OS === 'android'
//           ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
//           : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//       );
//       if (permission === RESULTS.GRANTED) {
//         Geolocation.getCurrentPosition(
//           async position => {
//             const {latitude, longitude} = position.coords;
//             await fetch(
//               `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
//             );
//           },
//           error => console.log(error),
//           {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
//         );
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // Email validation
//   const validateEmail = email => {
//     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return regex.test(email);
//   };

//   // Username check simulation
//   const checkUsernameAvailability = text => {
//     setUserName(text);
//     if (text.length > 3) setUsernameStatus('Available');
//     else if (text.length > 0) setUsernameStatus('Not Available');
//     else setUsernameStatus('');
//   };

//   // Auto tick when all required fields are valid
//   useEffect(() => {
//     if (
//       username &&
//       usernameStatus === 'Available' &&
//       validateEmail(email) &&
//       password.length >= 6
//     ) {
//       setIsTicked(true);
//     } else {
//       setIsTicked(false);
//     }
//   }, [username, email, password, usernameStatus]);

//   const handleSignUp = async () => {
//     let tempErrors = {};

//     if (!username.trim()) tempErrors.username = 'Required';
//     if (!email.trim()) tempErrors.email = 'Required';
//     else if (!validateEmail(email)) tempErrors.email = 'Criteria';
//     if (!password.trim()) tempErrors.password = 'Required';
//     else if (password.length < 6) tempErrors.password = 'Criteria';

//     setErrors(tempErrors);

//     if (!isTicked) {
//       Toast.show({
//         type: 'error',
//         text1: 'Please Read T&C',
//       });
//       return;
//     }

//     if (Object.keys(tempErrors).length > 0) {
//       Toast.show({
//         type: 'error',
//         text1: 'Form Error',
//         text2: 'Please correct highlighted fields',
//       });
//       return;
//     }

//     Toast.show({
//       type: 'success',
//       text1: 'OTP Sent',
//       text2: `OTP sent to ${email}`,
//     });

//     navigation.navigate('EmailVerification', {
//       userData: {username, email, password, gender, dateOfBirth},
//     });
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{flex: 1}}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//       <LinearGradient colors={['#0f162b', '#0f162b']} style={styles.container}>
//         <ScrollView contentContainerStyle={styles.scrollContainer}>
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => navigation.goBack()}>
//               <MaterialIcons
//                 name="arrow-back"
//                 size={normalize(22)}
//                 color="white"
//               />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Sign - Up</Text>
//             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//               <Text style={styles.signInText}>Sign - In</Text>
//             </TouchableOpacity>
//           </View>
//           <View style={{width: '100%',padding:10,}}>
//             {/* UserName */}
//             <View style={styles.fieldContainer}>
//               <View style={{flexDirection: 'row', alignItems: 'center'}}>
//                 <Text style={styles.label}>
//                   User Name<Text style={styles.star}>    *</Text>
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   // placeholder="Enter username"
//                   placeholderTextColor="#999"
//                   value={username}
//                   onChangeText={checkUsernameAvailability}
//                 />
//               </View>
//               {usernameStatus ? (
//                 <Text
//                   style={[
//                     styles.statusText,
//                     usernameStatus === 'Available'
//                       ? {color: 'green'}
//                       : {color: 'red'},
//                   ]}>
//                   {usernameStatus}
//                 </Text>
//               ) : null}
//             </View>

//             {/* Password */}
//             <View style={styles.fieldContainer}>
//               <View style={{flexDirection: 'row', alignItems: 'center'}}>
//                 <Text style={styles.label}>
//                   Password <Text style={styles.star}>    *</Text>
//                 </Text>
//                 <View style={styles.passwordContainer}>
//                   <TextInput
//                     style={styles.input}
//                     // placeholder="Enter password"
//                     placeholderTextColor="#999"
//                     secureTextEntry={!showPassword}
//                     value={password}
//                     onChangeText={setPassword}
//                   />
//                   <TouchableOpacity
//                     onPress={() => setShowPassword(!showPassword)}
//                     style={styles.eyeIcon}>
//                     <MaterialIcons
//                       name={showPassword ? 'visibility' : 'visibility-off'}
//                       size={20}
//                       color="#999"
//                     />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//               {errors.password && (
//                 <Text style={styles.criteriaText}>Criteria</Text>
//               )}
//             </View>

//             {/* Email */}
//             <View style={styles.fieldContainer}>
//               <View style={{flexDirection: 'row', alignItems: 'center'}}>
//                 <Text style={styles.label}>
//                   Email <Text style={styles.star}>           *</Text>
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   // placeholder="Enter email"
//                   placeholderTextColor="#999"
//                   keyboardType="email-address"
//                   value={email}
//                   onChangeText={setEmail}
//                 />
//               </View>
//               {errors.email && (
//                 <Text style={styles.criteriaText}>Criteria</Text>
//               )}
//             </View>

//             {/* Year of Birth */}
//             <View
//               style={[
//                 styles.fieldContainer,
//                 {flexDirection: 'row', alignItems: 'center',},
//               ]}>
//               <Text style={styles.label}>Year of Birth</Text>
//               <TouchableOpacity onPress={() => setShowDatePicker(true)}>
//                 <TextInput
//                   style={[styles.input, {width: '225%', marginLeft: 8}]}
//                   placeholder="Select Year"
//                   placeholderTextColor="#999"
//                   editable={false}
//                   value={dateOfBirth}
//                 />
//               </TouchableOpacity>
//                {showDatePicker && (
//               <DateTimePicker
//                 value={selectedDate}
//                 mode="date"
//                 display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                 maximumDate={new Date()}
//                 onChange={(event, date) => {
//                   setShowDatePicker(false);
//                   if (date) {
//                     const formattedDate = date.toISOString().split('T')[0];
//                     setSelectedDate(date);
//                     setDateOfBirth(formattedDate);
//                   }
//                 }}
//               />
//             )}

//             </View>
//             {/* Gender */}
//             <View
//               style={[
//                 styles.fieldContainer,
//                 {flexDirection: 'row', alignItems: 'center', paddingTop: 10},
//               ]}>
//               <Text style={styles.label}>Gender            </Text>
//               <TextInput
//                 style={styles.input}
//                 // placeholder="Enter gender"
//                 placeholderTextColor="#999"
//                 value={gender}
//                 onChangeText={setGender}
//               />
//             </View>
//           </View>
//           {/* Tick + T&C */}
//            <View style={styles.tickContainer}>
//             <TouchableOpacity
//               onPress={() => setIsTicked(!isTicked)}
//               activeOpacity={0.8}>
//               <Text style={[styles.tickBox, isTicked && styles.tickChecked]}>
//                 {isTicked ? '✔' : ''}
//               </Text>
//             </TouchableOpacity>
//             {!isTicked && <Text style={styles.tncText}>Please Read T&C</Text>}
//           </View>
//           {/* Sign Up Button */}
//           <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
//             <Text style={styles.signUpText}>Sign - Up</Text>
//           </TouchableOpacity>

//           {/* Social Buttons */}
//           <View style={styles.socialRow}>
//             <TouchableOpacity style={styles.socialBtn}>
//               <Text style={styles.socialLetter}>G</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.socialBtn}>
//               <Text style={styles.socialLetter}>X</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.socialBtn}>
//               <Text style={styles.socialLetter}>F</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//         <Toast />
//       </LinearGradient>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {flex: 1},
//   scrollContainer: {flexGrow: 1, alignItems: 'center', padding: normalize(15)},
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: normalize(20),
//   },
//   headerTitle: {color: '#fff', fontSize: normalize(20), fontWeight: '600'},
//   signInText: {color: '#fff', fontStyle: 'italic', fontSize: normalize(14)},
//   fieldContainer: {width: '130%', marginBottom: normalize(20), top: 50},
//   label: {color: '#fff', fontSize: normalize(14), marginBottom: 3},
//   star: {color: 'red',},
//   input: {
//     borderWidth: 1,
//     borderColor: '#fff',
//     borderRadius: 4,
//     paddingHorizontal: 10,
//     color: '#fff',
//     height: normalize(40),
//     width: '50%',
//   },
//   passwordContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//   },
//   eyeIcon: {position: 'relative', right: 10, end: '10%'},
//   statusText: {fontSize: normalize(12), marginTop: 3},
//   criteriaText: {
//     fontSize: normalize(12),
//     color: 'red',
//     marginTop: 2,
//     alignSelf: 'center',
//   },
//   tickContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: normalize(60),
//     marginBottom: normalize(10),
//    marginEnd: "auto",
//    start: 20,
//   },
//   tickBox: {
//     borderWidth: 1,
//     borderColor: '#fff',
//     width: normalize(35),
//     height: normalize(25),
//     marginRight: 20,
//     textAlign: 'center',
//     color: '#fff',
//   },
//   tickChecked: {backgroundColor: '#fff', color: 'black'},
//   tncText: {color: 'red', fontSize: normalize(12)},
//   signUpBtn: {
//     borderWidth: 1,
//      backgroundColor: '#FB923C',
//     borderRadius: 14,
//     width: '55%',
//     height: normalize(40),
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: normalize(10),
//     top: 20,
//   },
//   signUpText: {color: '#fff', fontSize: normalize(16), fontWeight: 'bold'},
//   socialRow: {
//     flexDirection: 'row',
//      top: 40,
//     justifyContent: 'center',
//     width: '100%',
//     marginTop: normalize(10),
//   },
//   socialBtn: {
//     backgroundColor: '#15515F',
//     width: normalize(40),
//     height: normalize(40),
//     borderRadius: normalize(20),
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginHorizontal: normalize(10),
//     borderWidth: 1,
//     borderColor: '#000',
//   },
//   socialLetter: {color: '#fff', fontSize: normalize(18), fontWeight: 'bold'},
// });

import React, {useEffect, useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size => Math.round(scale * size);

export default function SignUp() {
  const navigation = useNavigation();
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [countryFlag, setCountryFlag] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [otp, setotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [errors, setErrors] = useState({});

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
            const {latitude, longitude} = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            );
            const data = await response.json();

            if (data) {
              const city = data.city || data.locality || '';
              const countryName = data.countryName || '';
              const countryCode = data.countryCode || ''; // example: "IN"
              const flag = getFlagEmoji(countryCode);

              const locationText =
                city && countryName ? `${city}, ${countryName}` : countryName;
              setCountry(locationText);
              setCountryFlag(flag);
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
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
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

  const getFlagEmoji = countryCode => {
    if (!countryCode) return '';
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  const validateEmail = email => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSignUp = async () => {
    let tempErrors = {};

    // ✅ Only these three fields required
    if (!username.trim()) tempErrors.username = 'This field is required';
    if (!email.trim()) tempErrors.email = 'This field is required';
    else if (!validateEmail(email))
      tempErrors.email = 'Please enter a valid email';
    if (!password.trim()) tempErrors.password = 'This field is required';

    // ✅ Country, Gender, DOB are optional now

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      Toast.show({
        type: 'error',
        text1: 'Form Error',
        text2: 'Please fill required fields',
      });
      return;
    }

    setErrors({});

    try {
      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/verifymail',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email}),
        },
      );

      const data = await response.json();
      if (data.success === true) {
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: `OTP sent to ${email}`,
        });
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
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: data.message || 'Something went wrong!',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please try again later.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={normalize(20)}>
      <LinearGradient colors={['#0f162b', '#0f162b']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            <Text style={styles.title}>Register</Text>

            {/* <Text style={{color:"red",opacity:1, fontWeight:"bold",start:"2%"}}>*</Text> */}
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
              onChangeText={setEmail}
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
                onChangeText={setPassword}
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

            {/* <View style={styles.inputContainer}>
              <Image
                style={styles.inputIcon}
                source={require('../Screens/Image/location.png')}
              />
              <TextInput
                style={styles.input}
                placeholder="City, Country"
                placeholderTextColor="#94A3B8"
                value={country}
                onChangeText={setCountry}
              />
              {countryFlag ? (
                <Text style={{fontSize: normalize(20), marginLeft: 8}}>
                  {countryFlag}
                </Text>
              ) : null}
            </View> */}

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
                      {color: gender ? 'white' : '#94A3B8'},
                    ]}>
                    {gender || 'Select Gender'}
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
                  {['Male', 'Female', 'Other'].map(option => (
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

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View style={[styles.inputContainer]}>
                <MaterialIcons
                  name="calendar-month"
                  size={normalize(20)}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    {
                      paddingVertical: normalize(10),
                      color: dateOfBirth ? 'white' : '#94A3B8',
                    },
                  ]}>
                  {' '}
                  {dateOfBirth || 'Date of Birth'}
                </Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    const formattedDate = date.toISOString().split('T')[0];
                    setSelectedDate(date);
                    setDateOfBirth(formattedDate);
                  }
                }}
              />
            )}

            <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
              <Text style={styles.loginButtonText}>Sign up</Text>
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
                  Toast.show({type: 'info', text1: 'Google login coming soon'})
                }>
                <Image
                  style={styles.socialIcon}
                  source={require('../Screens/Image/google.png')}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Toast.show({
                    type: 'info',
                    text1: 'Facebook login coming soon',
                  })
                }>
                <Image
                  style={styles.socialIcon}
                  source={require('../Screens/Image/facebook.png')}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.registerText}>
                Already a member?{' '}
                <Text style={styles.registerLink}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// Input Field with Image Icon
const InputField = ({icon, error, ...props}) => (
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: normalize(50),
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: width * 0.02,
  },
  socialIcon: {
    width: normalize(37),
    height: normalize(37),
  },
  registerText: {
    marginTop: normalize(10),
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: normalize(14),
  },
  registerLink: {
    color: '#ff8c00',
    fontSize: normalize(14),
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
  },
});
  

