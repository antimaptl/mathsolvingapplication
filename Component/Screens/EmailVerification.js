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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '../Globalfile/CustomHeader';

const { width } = Dimensions.get('window');
const scale = width / 375;
const normalize = size => Math.round(scale * size);

export default function EmailVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const otpVerifiedRef = useRef(false);


  // 🔹 New States for OTP Logic
  const [timer, setTimer] = useState(30);
  const [resendCount, setResendCount] = useState(0);

  // Kept for tracking but not blocking inputs client-side
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);

  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { userData } = route.params;
  const { login } = React.useContext(require('../Globalfile/AuthProvider').AuthContext);

  // 🔹 Initialize Logic
  useEffect(() => {
    startResendTimer();
    // ❌ REMOVED: Do NOT clear blocks on mount, otherwise security is bypassed
    // AsyncStorage.removeItem('otp_block_until');
    // AsyncStorage.removeItem('otp_incorrect_attempts');
  }, []);

  // 🔹 Timer Countdown Effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startResendTimer = () => {
    setTimer(30);
  };

  useEffect(() => {
    const enteredOtp = otp.join('');

    // 🔒 hard guard
    if (enteredOtp.length !== 6) return;
    if (loading) return;
    if (otpVerifiedRef.current) return;

    otpVerifiedRef.current = true; // 👈 lock
    handleVerifyOtp(enteredOtp);

  }, [otp]);


  /* 🔹 Handlers guarded against loading to prevent edits without disabling native inputs (fixes focus issues) */
  const handleChange = (text, index) => {
    if (loading) return; // Prevent changes while loading
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (key, index) => {
    if (loading) return; // Prevent backspace while loading
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    // Resend limit check (client side limit still useful for UX)
    if (resendCount >= 3) {
      setErrorMessage('Maximum resend limit reached. Please restart sign up.');
      return;
    }

    setErrorMessage('');
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();

    try {
      const email = route.params?.userData?.email;
      // Updated URL to mataletics-backend logic
      const response = await fetch(
        'http://43.204.167.118:3000/api/auth/resend-signup-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (data.success === true) {
        setResendCount(prev => prev + 1);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: `OTP sent again. Attempt ${resendCount + 1}/3`,
        });

        startResendTimer();

        // Reset counters on Resend
        setIncorrectAttempts(0);

      } else {
        const msg = data.message || data.error || 'Failed to resend OTP';
        setErrorMessage(msg);
        Toast.show({
          type: 'error',
          text1: 'Resend Failed',
          text2: msg
        });
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleVerifyOtp = async (userEnteredOtp) => {
    if (loading) return;

    setLoading(true);
    setErrorMessage('');

    const email = route.params?.userData?.email?.trim();

    if (!email) {
      setErrorMessage('Email not found. Please restart signup.');
      otpVerifiedRef.current = false;
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email,
        otp: userEnteredOtp,
      };

      const res = await fetch(
        'http://43.204.167.118:3000/api/auth/verify-signup-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const body = await res.json();

      if (!res.ok || body.success === false) {
        let msg = body.message || 'Invalid OTP';
        if (msg.toLowerCase().includes('invalid otp')) {
          msg = `${msg}. Please enter valid OTP.`;
        }
        setErrorMessage(msg);
        setOtp(['', '', '', '', '', '']);

        // Slightly delay focus to ensure UI is ready
        setTimeout(() => {
          inputs.current[0]?.focus();
        }, 100);

        otpVerifiedRef.current = false;
        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      if (body.token) {
        // Based on screenshot: body.player contains the user data
        const userObj = body.player || body.user;
        await login(body.token, userObj, body);
      }

      // 🔄 Reset Navigation Stack
      navigation.reset({
        index: 1,
        routes: [
          { name: 'AuthLandingScreen' },
          { name: 'NotificationPermissionScreen' },
        ],
      });

    } catch (err) {
      setErrorMessage('Network error. Please try again.');
      otpVerifiedRef.current = false;
    } finally {
      setLoading(false);
    }
  };


  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={{ paddingTop: insets.top }}>
        {/* ✅ Standardized Header */}
        <CustomHeader
          title="Sign - Up"
          onBack={() => navigation.goBack()}
          style={{ marginBottom: normalize(20) }}
        />

        <View>
          <Text
            style={{
              color: 'white',
              fontSize: normalize(16),
              width: '80%',
              textAlign: 'center',
              alignSelf: 'center',
              marginBottom: normalize(40),
            }}>
            An OTP has been sent to your registered email address
          </Text>
        </View>
      </View>

      {/* OTP Inputs */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => (inputs.current[index] = ref)}
            style={[styles.otpInput]}
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

      <TouchableOpacity
        onPress={handleResendOtp}
        disabled={timer > 0 || resendCount >= 3}
      >
        <Text
          style={{
            color: (timer > 0 || resendCount >= 3) ? '#64748B' : '#FB923C',
            alignSelf: 'flex-end',
            end: 30,
            top: -20,
            fontWeight: '600'
          }}>
          {resendCount >= 3
            ? 'Resend Limit Reached'
            : timer > 0
              ? `Resend in ${timer}s`
              : `Resend OTP${resendCount > 0 ? ` (Attempt ${resendCount}/3)` : ''}`}
        </Text>
      </TouchableOpacity>

      {/* Error Message moved below Resend button to prevent layout shift */}
      {errorMessage ? (
        <Text
          style={{
            color: 'red',
            fontSize: normalize(14),
            textAlign: 'center',
            marginBottom: normalize(20),
            marginTop: normalize(10),
            paddingHorizontal: normalize(20)
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
    paddingBottom: normalize(10),
  },
  backButton: {
    position: 'absolute',
    // top: normalize(-20),
    left: normalize(0),
  },
  title: {
    fontSize: normalize(30),
    color: 'white',
    fontWeight: '600',
    top: '-8%'
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: normalize(30),
    marginTop: normalize(20),
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
  disabledInput: {
    opacity: 0.5
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
