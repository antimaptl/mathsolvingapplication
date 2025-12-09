// import React, { useRef, useState } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   PixelRatio,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import Toast from 'react-native-toast-message';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { useNavigation, useRoute } from '@react-navigation/native';

// const { width } = Dimensions.get('window');
// const scale = width / 375;
// const normalize = size => {
//   const newSize = size * scale;
//   return Math.round(PixelRatio.roundToNearestPixel(newSize));
// };

// const ForgetPassword = () => {
//   const navigation = useNavigation();
//   const route = useRoute();

//   const email = route.params?.email || "";

//   const [newPassword, setNewPassword] = useState('');
//   const [step, setStep] = useState(1); // 1 = OTP Screen, 2 = New Password

//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const inputRefs = useRef([]);
  
//   // FIXED: Only otpError will handle OTP Errors
//   const [otpError, setOtpError] = useState("");

//   const handleVerifyOtp = async () => {
//   const code = otp.join("");

//   if (code.length < otp.length) {
//     setOtpError("Please fill the complete OTP");
//     return;
//   }

//   setOtpError("");

//   try {
//     const response = await fetch(
//       "http://43.204.167.118:3000/api/auth/verifyForgotPassOtp",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, otp: code }),
//       }
//     );

//     // 🟢 Debug: FIRST read raw text
//     const raw = await response.text();
//     console.log("RAW API RESPONSE:", raw);

//     // 🟢 Try JSON safely
//     let result = {};
//     try {
//       result = JSON.parse(raw);
//     } catch (e) {
//       console.log("JSON PARSE ERROR:", e);
//       setOtpError("Server error. Please try again later.");
//       return;
//     }

//     if (response.ok) {
//       Toast.show({ type: "success", text1: "OTP Verified" });
//       setStep(2);
//     } else {
//       setOtpError("Incorrect OTP. Please try Again");
//     }
//   } catch (error) {
//     console.log("NETWORK ERROR:", error);
//     setOtpError("Network Error. Please try again later.");
//   }
// };

//   const handleOtpChange = (text, index) => {
//     if (text.length > 1) return;

//     let temp = [...otp];
//     temp[index] = text;
//     setOtp(temp);

//     if (text && index < otp.length - 1) {
//       inputRefs.current[index + 1].focus();
//     }
//   };

//  const handleResend = async () => {
//   try {
//     const response = await fetch(
//       "http://43.204.167.118:3000/api/auth/sendForgotPassOtp",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       }
//     );

//     const raw = await response.text();
//     console.log("RAW RESEND RESPONSE:", raw);

//     let result = {};
//     try {
//       result = JSON.parse(raw);
//     } catch (e) {
//       setOtpError("Server error. Please try again.");
//       return;
//     }

//     if (response.ok) {
//       setOtp(["", "", "", "", "", ""]);
//       setOtpError("OTP Resent Successfully");
//     } else {
//       setOtpError(result.message || "Unable to resend OTP. Try again later.");
//     }
//   } catch (error) {
//     console.log("RESEND NETWORK ERROR:", error);
//     setOtpError("Network Error while resending OTP");
//   }
// };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//           <Icon name="caret-back-outline" size={normalize(29)} color="white" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Forgot Password</Text>
//       </View>

//       <Toast />

//       <View style={styles.boxWrapper}>
        
//         {/* ------------------- STEP 1: OTP SCREEN ------------------- */}
//         {step === 1 && (
//           <>
//             {/* FIXED: Correct Error Display */}
//             {otpError !== "" && (
//               <Text style={styles.errorText}>{otpError}</Text>
//             )}

//             <View style={styles.otpRow}>
//               {otp.map((digit, index) => (
//                 <TextInput
//                   key={index}
//                   ref={(ref) => (inputRefs.current[index] = ref)}
//                   style={styles.otpBox}
//                   value={digit}
//                   onChangeText={(text) => handleOtpChange(text, index)}
//                   keyboardType="numeric"
//                   maxLength={1}
//                 />
//               ))}
//             </View>

//             <TouchableOpacity onPress={handleResend}>
//               <Text style={styles.resend}>Resend</Text>
//             </TouchableOpacity>
//           </>
//         )}

//         {/* ------------------- STEP 2: NEW PASSWORD ------------------- */}
//         {step === 2 && (
//           <>
//             <View style={styles.inputRow}>
//               <View style={styles.inputContainer}>
//                 <MaterialIcons
//                   name="lock"
//                   size={20}
//                   color="#94A3B8"
//                   style={styles.inputIcon}
//                 />
//                 <TextInput
//                   placeholder="Create New Password"
//                   style={styles.input}
//                   secureTextEntry
//                   placeholderTextColor="#94A3B8"
//                   value={newPassword}
//                   onChangeText={(text) => setNewPassword(text)}
//                 />
//               </View>
//             </View>
//           </>
//         )}

//         <TouchableOpacity
//           style={styles.button}
//           onPress={step === 1 ? handleVerifyOtp : handleResetPassword}
//         >
//           <Text style={styles.buttonText}>
//             {step === 1 ? "Confirm OTP" : "Reset Password"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// export default ForgetPassword;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 34,
//     backgroundColor: '#0f162b',
//   },

//   header: {
//     width: "100%",
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 30,
//   },

//   backBtn: {
//     padding: 8,
//     marginRight: 50,
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: "600",
//     color: "#fff",
//   },

//   boxWrapper: {
//     marginTop: 150,
//   },

//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 53,
//     flex: 1,
//   },

//   inputIcon: {
//     marginRight: 10,
//   },

//   input: {
//     flex: 1,
//     color: "white",
//     fontSize: 16,
//   },

//   button: {
//     backgroundColor: "#FB923C",
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: "center",
//     marginTop: 30,
//   },

//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },

//   otpRow: {
//     flexDirection: "row",
//     marginTop: 20,
//   },

//   otpBox: {
//     width: normalize(40),
//     height: normalize(50),
//     borderRadius: normalize(5),
//     backgroundColor: '#1e293b',
//     textAlign: 'center',
//     color: 'white',
//     fontSize: normalize(18),
//     marginHorizontal: normalize(5),
//   },

//   errorText: {
//     color: "red",
//     marginTop: 20,
//     marginBottom: 10,
//     fontSize: 14,
//     textAlign: "center",
//   },

//   resend: {
//     marginTop: 10,
//     marginBottom: 20,
//     alignSelf: "flex-end",
//     marginRight: 40,
//     color: "#f9f4f4ff",
//   },
// });




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
