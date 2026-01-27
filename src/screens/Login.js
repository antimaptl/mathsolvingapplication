

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon6 from 'react-native-vector-icons/FontAwesome6';
import CustomHeader from '../components/CustomHeader';
import AuthHeader from '../components/AuthHeader';

import { wp, hp, normalizeFont } from '../utils/Responsive';
const { width } = Dimensions.get('window');


export default function Login() {
  const insets = useSafeAreaInsets();
  const passwordInputRef = useRef(null);
  const navigation = useNavigation();
  const { login } = React.useContext(require('../context/AuthProvider').AuthContext); // 🔹 Import context

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true // ❌ block back
    );

    return () => backHandler.remove();
  }, []);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError("This field is required");
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email");
      return;
    }

    setEmailError("");

    try {
      const response = await fetch(
        "http://43.204.167.118:3000/api/auth/sendForgotPassOtp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "OTP Sent",
          text2: `OTP sent to ${email}`,
        });

        navigation.navigate("ForgetPassword", { email });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: result.message || "Something went wrong!",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Please try again later.",
      });
    }
  };


  const handleLogin = async () => {
    let valid = true;

    if (email.trim() === '') {
      setEmailError('This field is required');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.trim() === '') {
      setPasswordError('This field is required');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    try {
      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();
      console.log('Login Response:', data);

      if (response.ok) {
        const { token, player: user } = data;
        if (token && user) {
          await login(token, user, data); // 🔹 Use context login
          console.log('✅ Logged in via AuthProvider');
          navigation.navigate('BottomTab');
        } else {
          Alert.alert('Login Failed', 'Token or user data not received');
        }
      } else {
        // Handle specific errors
        if (response.status === 404 || data?.message?.toLowerCase().includes('user') || data?.message?.toLowerCase().includes('email')) {
          setLoginError('Your email is wrong');
        } else if (response.status === 401 || data?.message?.toLowerCase().includes('password')) {
          setLoginError('Your password is wrong');
        } else {
          setLoginError(data?.message || 'ID / Password is Incorrect');
        }
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 30 }]}>
      <LinearGradient colors={['#0f162b', '#0f162b']} style={styles.formContainer}>
        <AuthHeader title="Sign - In" />
        {
          loginError !== '' && (
            <View style={styles.loginErrorBox}>
              <Text style={styles.loginErrorText}>{loginError}</Text>
            </View>
          )
        }
        <Toast />
        <View style={[styles.inputContainer, emailError ? styles.errorBorder : null]}>

          <MaterialIcons name="email" size={normalizeFont(20)} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your Email"
            placeholderTextColor="#94A3B8"
            value={email}
            returnKeyType='next'
            onSubmitEditing={() => passwordInputRef.current.focus()}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={[styles.inputContainer, passwordError ? styles.errorBorder : null]}>
          <MaterialIcons name="lock" size={normalizeFont(20)} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            ref={passwordInputRef}
            placeholder="Enter your Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={normalizeFont(20)}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
          <Text style={styles.forgotPassword}>Forgot Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign - In</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Info', 'Google login coming soon')}>
            <Icon6 name="google" size={normalizeFont(20)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Info', 'Twitter login coming soon')}>
            <Icon6 name="x-twitter" size={normalizeFont(20)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Info', 'Facebook login coming soon')}>
            <Icon6 name="facebook" size={normalizeFont(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7} hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}>
          <Text style={styles.registerText}>
            Not a member? <Text style={styles.registerLink}>Register now</Text>
          </Text>
        </TouchableOpacity>

      </LinearGradient>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#0f162b",
  },
  formContainer: {
    width: width > 500 ? 500 : wp('90%'),
    padding: normalizeFont(20),
    // paddingTop:60
  },
  title: {
    fontSize: normalizeFont(32),
    fontWeight: '600',
    color: 'white',
    marginBottom: normalizeFont(70),
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: normalizeFont(10),
    paddingHorizontal: normalizeFont(15),
  },
  inputIcon: {
    marginRight: normalizeFont(10),
  },
  input: {
    flex: 1,
    height: normalizeFont(43),
    color: 'white',
    fontSize: normalizeFont(16),
    paddingRight: normalizeFont(10),
  },
  errorText: {
    color: 'red',
    fontSize: normalizeFont(12),
    marginTop: -normalizeFont(8),
    marginBottom: normalizeFont(10),
    marginLeft: normalizeFont(5),
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  forgotPassword: {
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: normalizeFont(20),
    fontSize: normalizeFont(14),
  },
  loginButton: {
    backgroundColor: '#FB923C',
    borderRadius: 50,
    height: normalizeFont(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalizeFont(20),
  },
  loginButtonText: {
    color: 'white',
    fontSize: normalizeFont(18),
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: normalizeFont(20),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFF',
  },
  dividerText: {
    color: '#94A3B8',
    paddingHorizontal: normalizeFont(10),
    fontSize: normalizeFont(14),
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: normalizeFont(10),
  },
  socialButton: {
    width: normalizeFont(40),
    height: normalizeFont(40),
    borderRadius: normalizeFont(20),
    backgroundColor: '#17677F',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp('2%'),
  },
  registerText: {
    marginTop: normalizeFont(30),
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: normalizeFont(14),
  },
  registerLink: {
    color: '#ff8c00',
  },
  loginErrorBox: {
    width: "100%",
    // backgroundColor: "white",
    // borderWidth: 1,
    // borderColor: "red",
    paddingVertical: normalizeFont(6),
    paddingHorizontal: normalizeFont(10),
    marginBottom: normalizeFont(15),
    borderRadius: 5,
  },
  loginErrorText: {
    color: "red",
    fontSize: normalizeFont(14),
    fontStyle: "italic",
  },

});
