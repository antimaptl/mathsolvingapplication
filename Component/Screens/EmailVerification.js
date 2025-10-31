import { useRoute, useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
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
import Toast from 'react-native-toast-message'; // ✅ Toast import
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const scale = width / 375;
const normalize = (size) => Math.round(scale * size);

export default function EmailVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { userData } = route.params;

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

  // 1) Client‑side validation
  if (
    !userData.username?.trim() ||
    !userData.email?.trim() ||
    !userData.password?.trim() ||
    !userData.gender?.trim() ||
    !userData.dateOfBirth?.toString().trim() ||
    // !userData.country?.trim() ||
    // !userData.countryFlag ||
    !userEnteredOtp
  ) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Please fill in all fields and enter the OTP.',
    });
    return;
  }

  // 2) Build payload with the *exact* formats your API expects
  const payload = {
    username:    userData.username.trim(),
    email:       userData.email,
    password:    userData.password.trim(),
    gender:      userData.gender.trim().toLowerCase(),
    // country:     userData.country.trim(),
    // countryFlag: userData.countryFlag, 

    // <-- Preserve the YYYY-MM-DD string exactly
    dateOfBirth: String(userData.dateOfBirth).trim(),
    otp:         userEnteredOtp,
  };

  console.log('🔶 Raw payload →', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch('http://43.204.167.118:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    console.log('🔷 Server responded with:', res.status, body);

    if (res.status === 400) {
      // assuming 400 = invalid OTP
      return Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: body.message || 'The OTP you entered is incorrect.',
      });
    }

    if (!res.ok) {
      throw new Error(body.message || 'Registration failed');
    }

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
      text1: 'Error',
      text2: err.message || 'Something went wrong',
    });
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    {/* 🔙 Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="chevron-back" size={28} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Verify Email</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleBackspace(nativeEvent.key, index)
            }
          />
        ))}
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

      <Toast /> {/* ✅ Required to show the toast */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f162b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  backButton: {
    position: 'absolute',
    top: normalize(50),
    left: normalize(20),
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
    marginTop: normalize(50),
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
  },
  verifyText: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: 'bold',
  },
});
