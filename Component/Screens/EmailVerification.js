import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute, useNavigation} from '@react-navigation/native';
import React, {useRef, useState} from 'react';
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

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size => Math.round(scale * size);

export default function EmailVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();
  // const {userData} = route.params;

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

  const handleVerifyOtp = async () => {
    const userEnteredOtp = otp.join('').trim();
    setErrorMessage('');

    if (!userEnteredOtp) {
      return Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter the 6 digit OTP.',
      });
    }

    const {userData} = route.params || {};
    if (!userData) {
      return Toast.show({
        type: 'error',
        text1: 'Internal Error',
        text2: 'Missing user data. Please restart the signup.',
      });
    }

    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      gender: userData.gender.toLowerCase(),
      dateOfBirth: String(userData.dateOfBirth),
      otp: userEnteredOtp,
    };

    console.log('🔶 Payload sending →', payload);

    try {
      const res = await fetch('http://43.204.167.118:3000/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      console.log('🔷 Server response →', res.status, body);

      // ❌ SERVER ERROR HANDLING
      if (!res.ok) {
        const msg = body?.message || 'Registration failed';

        if (body?.error?.includes('password')) {
          msg = 'Password must be at least 6 characters';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: msg,
        });

        setErrorMessage(msg);
        return;
      }

      // SAVE TOKEN
      if (body?.token) {
        await AsyncStorage.setItem('authToken', body.token);
        console.log('✅ Token saved:', body.token);
      }

      // ✅ SUCCESS
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Registration successful!',
      });

      navigation.navigate('NotificationPermissionScreen');
    } catch (err) {
      console.error('❌ Signup error:', err);

      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Something went wrong. Please try again.',
      });

      setErrorMessage('Something went wrong. Please try again.');
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
        <Text style={styles.title}>Verify Email</Text>
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
            onKeyPress={({nativeEvent}) =>
              handleBackspace(nativeEvent.key, index)
            }
          />
        ))}
      </View>

      <Text
        style={{
          color: '#c4c3c3ff',
          alignSelf: 'flex-end',
          end: 30,
          top: -20,
        }}>
        Resend
      </Text>

      {/* Verify Button */}
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

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
    paddingHorizontal: normalize(95),
    borderRadius: normalize(25),
    top: normalize(20),
    alignSelf: 'center',
  },
  verifyText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: 'bold',
  },
});
