import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const scale = width / 375;
const normalize = size => Math.round(scale * size);

export default function EmailVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { userData } = route.params;
  const { login } = React.useContext(require('../Globalfile/AuthProvider').AuthContext);

  useEffect(() => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 6 && !loading) {
      handleVerifyOtp(enteredOtp);
      loadAttempts();
    }
  }, [otp]);

  const loadAttempts = async () => {
    const savedCount = await AsyncStorage.getItem('otpAttempts');
    const savedTime = await AsyncStorage.getItem('otpLockedUntil');

    const now = Date.now();

    if (savedTime && now < Number(savedTime)) {
      // Still locked
      setAttemptCount(3);
    } else {
      // Reset
      setAttemptCount(savedCount ? Number(savedCount) : 0);
    }
  };

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key, index) => {
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage('');

    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();

    try {
      const email = route.params?.userData?.email;

      // console.log("📤 Resend OTP API Triggered for email:", email);

      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/resend-signup-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      // console.log("📥 Raw Response →", response);

      const data = await response.json();
      // console.log("📥 Parsed Response Body →", data);

      if (data.success === true) {
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'OTP sent again to your email',
        });
      } else {
        console.log("❌ Backend Error Message →", data.message);
        setErrorMessage(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.log("❌ Network Error Occurred →", error);
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleVerifyOtp = async userEnteredOtp => {
    if (loading) return;

    setLoading(true);
    setErrorMessage('');
    const userDataFromParams = route.params?.userData || {};

    const {
      username,
      email,
      password,
      dateOfBirth,
      country,
      gender
    } = userDataFromParams;

    console.log('📤 Sending to API →', {
      email,
      username,
      password,
      gender,
      dateOfBirth,
      country,
    });


    if (!email) {
      setErrorMessage('Email not found. Please restart signup.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        'http://43.204.167.118:3000/api/auth/verify-signup-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,                // email: email
            otp: userEnteredOtp,
            username,             // username: username
            password,
            gender: gender,
            dateOfBirth,
            country
          }),
        },
      );

      const body = await res.json();

      // ❌ ANY OTP ERROR → show API message ONLY
      if (!res.ok || body.success === false) {
        setErrorMessage(body.message || 'Invalid OTP');

        // clear OTP so user can retype
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();

        setLoading(false);
        return;
      }

      // ✅ OTP verified → next screen (NO ERROR TOAST)

      // ---------------------------------------------------------
      // 🔥 FIX: Store Token & User Data (Same as Login Flow)
      // ---------------------------------------------------------
      if (body.token) {
        // Try to get user from response, otherwise fallback to route params
        const userObj = body.player || body.user || route.params?.userData;
        console.log("📥 Parsed Response Body →", res);
        // 🔹 Use context login which handles storage and state update
        await login(body.token, userObj, body);
        console.log('✅ Signup Token & Data synced via AuthProvider');
      }

      navigation.replace('NotificationPermissionScreen', {
        userData: route.params.userData,
      });

    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 🔙 Back Button and Title */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          marginTop: normalize(40),
          marginBottom: normalize(40),
        }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="caret-back-outline" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Sign - Up</Text>
      </View>

      {/* Info Text */}
      <View>
        <Text
          style={{
            color: 'white',
            fontSize: normalize(16),
            width: '80%',
            textAlign: 'center',
            alignSelf: 'center',
          }}>
          An OTP has been sent to your registered email address
        </Text>
      </View>

      {/* OTP Inputs */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => (inputs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleBackspace(nativeEvent.key, index)
            }
          />
        ))}
      </View>

      <TouchableOpacity onPress={handleResendOtp}>
        <Text
          style={{
            color: '#c4c3c3ff',
            alignSelf: 'flex-end',
            end: 30,
            top: -20,
          }}>
          Resend
        </Text>
      </TouchableOpacity>
      {/* Verify Button */}
      {/* <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
        <Text style={styles.verifyText}>Confirm</Text>
      </TouchableOpacity> */}

      {/* Error Message Display (like image) */}
      {errorMessage ? (
        <Text
          style={{
            color: 'red',
            fontSize: normalize(14),
            marginTop: normalize(30),
            textAlign: 'center',
          }}>
          {errorMessage}
        </Text>
      ) : null}

      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f162b',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
  },
  backButton: {
    position: 'absolute',
    top: normalize(0),
    left: normalize(0),
  },
  title: {
    fontSize: normalize(24),
    color: 'white',
    marginBottom: normalize(60),
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: normalize(30),
    marginTop: normalize(100),
    alignSelf: 'center',
  },
  otpInput: {
    width: normalize(40),
    height: normalize(50),
    borderRadius: normalize(5),
    backgroundColor: '#1e293b',
    textAlign: 'center',
    color: 'white',
    fontSize: normalize(18),
    marginHorizontal: normalize(5),
  },
  verifyButton: {
    backgroundColor: '#FB923C',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(90),
    borderRadius: normalize(10),
    top: normalize(20),
    alignSelf: 'center',
  },
  verifyText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: 'bold',
  },
});
