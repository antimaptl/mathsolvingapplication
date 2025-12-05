import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PixelRatio,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');
const scale = width / 375;
const normalize = size => {
  const newSize = size * scale;
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};

const ForgetPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleVerify = async () => {
    if (!email.trim()) {
      setEmailError('This field is required');
      return;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email');
      return;
    } else {
      setEmailError('');
    }

    const apiUrl = 'http://43.204.167.118:3000/api/auth/sendForgotPassOtp';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });

      const result = await response.json();

      if (response.ok) {
        setIsOtpSent(true);
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: `OTP sent to ${email}`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: result.message || 'Something went wrong!',
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please try again later.',
      });
    }
  };

  const handlePasswordChange = async () => {
    let hasError = false;

    if (!otp.trim()) {
      setOtpError('This field is required');
      hasError = true;
    } else {
      setOtpError('');
    }

    if (!newPassword.trim()) {
      setPasswordError('This field is required');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    const apiUrl = 'http://43.204.167.118:3000/api/auth/changePass';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, otp, newPass: newPassword}),
      });

      const result = await response.json();
      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Password reset successful',
        });
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: result.message || 'Invalid OTP or update failed',
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please try again later.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="caret-back-outline" size={normalize(29)} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
      </View>

      <View style={{paddingBottom: 170}}></View>
      <Toast />

      {!isOtpSent ? (
        <>
          <View
            style={[styles.inputContainer, emailError && styles.errorBorder]}>
            <MaterialIcons
              name="email"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter your email"
              style={styles.input}
              keyboardType="email-address"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setEmailError('');
              }}
            />
          </View>
          {emailError !== '' && (
            <Text style={styles.errorText}>{emailError}</Text>
          )}
        </>
      ) : (
        <>
          <View style={[styles.inputContainer, otpError && styles.errorBorder]}>
            <MaterialIcons
              name="lock"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter OTP"
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
              value={otp}
              onChangeText={text => {
                setOtp(text);
                setOtpError('');
              }}
            />
          </View>
          {otpError !== '' && <Text style={styles.errorText}>{otpError}</Text>}

          <View
            style={[
              styles.inputContainer,
              passwordError && styles.errorBorder,
            ]}>
            <MaterialIcons
              name="lock"
              size={20}
              color="#94A3B8"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter new password"
              style={styles.input}
              secureTextEntry
              placeholderTextColor="#94A3B8"
              value={newPassword}
              onChangeText={text => {
                setNewPassword(text);
                setPasswordError('');
              }}
            />
          </View>
          {passwordError !== '' && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={isOtpSent ? handlePasswordChange : handleVerify}>
        <Text style={styles.buttonText}>
          {isOtpSent ? 'Reset Password' : 'Send Otp'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default ForgetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 34,
    // justifyContent: 'center',
    backgroundColor: '#0f162b',
  },
  header: {
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingVertical: 10,
  position: 'absolute',
  top: 30,
  left: 20,
  zIndex: 999,
},

backBtn: {
  padding: 8,  
  marginRight: 50,
},

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
    // top: -34,
  },
  input: {
    flex: 1,
    height: 53,
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FB923C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBorder: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
});
