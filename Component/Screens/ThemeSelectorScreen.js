// // Screens/ThemeSelectorScreen.js
// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   SafeAreaView,
//   Dimensions,
//   PixelRatio,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import {useTheme, themes} from '../Globalfile/ThemeContext';
// import KeyboardSelector from '../Screens/KeyboardSelector';
// import {useNavigation, useRoute} from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';

// const {width, height} = Dimensions.get('window');
// const scale = width / 375;
// const normalize = size =>
//   Math.round(PixelRatio.roundToNearestPixel(size * scale));

// const ThemeSelectorScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const from = route.params?.from || 'settings'; // default settings
//   const {theme, changeTheme} = useTheme();
//   const [selectedTab, setSelectedTab] = useState('colors');

//   const handleNext = () => {
//     navigation.replace('AddFriendScreen');
//   };

//   return (
//     <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
//       {/* Header */}
//       <View
//         style={{alignItems: 'flex-start', marginBottom: 20, flexDirection: 'row'}}>
//         {from !== 'onboarding' && (
//           <TouchableOpacity
//             style={{position: 'absolute', left: '-30%', bottom: 20}}
//             onPress={() => navigation.goBack()}>
//             <Icon name="caret-back-outline" size={normalize(25)} color="#808080" />
//           </TouchableOpacity>
//         )}
//         <Text style={[styles.title, {color: theme.text}]}>🎨 THEME</Text>
//       </View>

//       {/* Toggle Buttons */}
//       <View style={styles.toggleContainer}>
//         <TouchableOpacity
//           style={[
//             styles.toggleButton,
//             selectedTab === 'colors' && styles.activeToggle,
//           ]}
//           onPress={() => setSelectedTab('colors')}>
//           <Text
//             style={[
//               styles.toggleText,
//               selectedTab === 'colors' && styles.activeToggleText,
//             ]}>
//             Colors
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.toggleButton,
//             selectedTab === 'keyboard' && styles.activeToggle,
//           ]}
//           onPress={() => setSelectedTab('keyboard')}>
//           <Text
//             style={[
//               styles.toggleText,
//               selectedTab === 'keyboard' && styles.activeToggleText,
//             ]}>
//             Keyboard
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Theme or Keyboard Section */}
//       {selectedTab === 'colors' ? (
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={true}>
//           {Object.keys(themes).map(key => {
//             const t = themes[key];
//             const isSelected = theme.name === t.name;
//             return (
//               <TouchableOpacity
//                 key={key}
//                 onPress={() => changeTheme(key)}
//                 style={styles.pillContainer}
//                 activeOpacity={0.8}>
//                 <LinearGradient
//                   colors={t.backgroundGradient}
//                   start={{x: 0, y: 0}}
//                   end={{x: 1, y: 0}}
//                   style={styles.pill}>
//                   <Text style={[styles.pillText, {color: t.text}]}>
//                     {t.name}
//                   </Text>
//                 </LinearGradient>

//                 <View style={{alignItems: 'center', justifyContent: 'center'}}>
//                   <LinearGradient
//                     colors={t.backgroundGradient}
//                     start={{x: 0.3, y: 0}}
//                     end={{x: 0.7, y: 1}}
//                     style={styles.circle}>
//                     {isSelected && (
//                       <Icon
//                         name="checkmark"
//                         size={normalize(20)}
//                         color="#fff"
//                         style={{alignSelf: 'center', fontWeight: 'bold'}}
//                       />
//                     )}
//                   </LinearGradient>
//                 </View>
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>
//       ) : (
//         <KeyboardSelector />
//       )}

//       {/* ✅ Only show NEXT button if onboarding */}
//       {from === 'onboarding' && (
//         <TouchableOpacity
//           style={[styles.nextButton, {backgroundColor: theme.primary}]}
//           onPress={handleNext}>
//           <Text style={[styles.nextText, {color: theme.buttonText || '#fff'}]}>
//             Next
//           </Text>
//         </TouchableOpacity>
//       )}
//     </LinearGradient>
//   );
// };

// export default ThemeSelectorScreen;

// const styles = StyleSheet.create({
//   container: {flex: 1, paddingVertical: 30, alignItems: 'center'},
//   title: {fontSize: normalize(22), fontWeight: '700', marginBottom: 20},
//   toggleContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#1C2433',
//     borderRadius: 5,
//     overflow: 'hidden',
//     marginBottom: 20,
//     width: '90%',
//     justifyContent: 'center',
//   },
//   toggleButton: {paddingVertical: 10, paddingHorizontal: 60},
//   toggleText: {fontSize: normalize(16), color: '#fff'},
//   activeToggle: {
//     backgroundColor: '#595CFF',
//     width: '60%',
//     alignItems: 'center',
//   },
//   activeToggleText: {fontWeight: '700'},
//   scroll: {
//     alignItems: 'center',
//     paddingBottom: 30,
//   },
//   pillContainer: {
//     flexDirection: 'column', // changed for vertical stacking
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 15,
//   },
//   pill: {
//     width: width * 0.8,
//     height: height * 0.1,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   pillText: {
//     fontSize: normalize(14),
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   circle: {
//     width: normalize(40),
//     height: normalize(40),
//     borderRadius: 20,
//     opacity: 0.9,
//     marginTop: 5,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   nextButton: {
//     marginTop: 20,
//     paddingVertical: 12,
//     paddingHorizontal: 60,
//     borderRadius: 25,
//   },
//   nextText: {
//     fontSize: normalize(16),
//     fontWeight: '700',
//   },
// });

// Screens/ThemeSelectorScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  PixelRatio,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme, themes} from '../Globalfile/ThemeContext';
import KeyboardSelector from '../Screens/KeyboardSelector';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');
const scale = width / 375;
const normalize = size =>
  Math.round(PixelRatio.roundToNearestPixel(size * scale));

const ThemeSelectorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const from = route.params?.from || 'settings';
  const {theme, changeTheme} = useTheme();
  const [selectedTab, setSelectedTab] = useState('colors');

  const handleNext = () => {
    navigation.replace('AddFriendScreen');
  };

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      {/* Header */}
      <View
        style={{
          alignItems: 'flex-start',
          marginBottom: 20,
          flexDirection: 'row',
        }}>
        {from !== 'onboarding' && (
          <TouchableOpacity
            style={{position: 'absolute', left: '-30%', bottom: 10}}
            onPress={() => navigation.goBack()}>
            <Icon
              name="caret-back-outline"
              size={normalize(25)}
              color="#fff"
            />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, {color: theme.text}]}>🎨 THEME</Text>
      </View>
          <View style={{borderWidth:1,borderColor: '#94A3B8',width:"95%",opacity: 0.5,bottom:"1%"
         }}></View>
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTab === 'colors' && styles.activeToggle,
          ]}
          onPress={() => setSelectedTab('colors')}>
          <Text
            style={[
              styles.toggleText,
              selectedTab === 'colors' && styles.activeToggleText,
            ]}>
            Colors
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTab === 'keyboard' && styles.activeToggle,
          ]}
          onPress={() => setSelectedTab('keyboard')}>
          <Text
            style={[
              styles.toggleText,
              selectedTab === 'keyboard' && styles.activeToggleText,
            ]}>
            Keyboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Theme or Keyboard Section */}
      {selectedTab === 'colors' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={true}>
          {Object.keys(themes).map(key => {
            const t = themes[key];
            const isSelected = theme.name === t.name;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => changeTheme(key)}
                activeOpacity={0.8}
                style={styles.pillContainer}>
                <LinearGradient
                  colors={t.backgroundGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.pillBox}>
                  <View style={styles.circleOuter}>
                    {isSelected && <View style={styles.circleInner} />}
                  </View>
                  <Text style={[styles.pillText, {color: t.text}]}>
                    {t.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <KeyboardSelector />
      )}

      {from === 'onboarding' && (
        <TouchableOpacity
          style={[styles.nextButton, {backgroundColor: theme.primary}]}
          onPress={handleNext}>
          <Text style={[styles.nextText, {color: theme.buttonText || '#fff'}]}>
            Next
          </Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

export default ThemeSelectorScreen;

const styles = StyleSheet.create({
  container: {flex: 1, paddingVertical: 30, alignItems: 'center',paddingHorizontal:"auto"},
  title: {fontSize: normalize(18), fontWeight: '700', marginBottom: 15},
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C2433',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
    width: '90%',
    justifyContent: 'center',
    top:"2%"
  },
  toggleButton: {paddingVertical: 10, paddingHorizontal: 60},
  toggleText: {fontSize: normalize(16), color: '#fff'},
  activeToggle: {
    backgroundColor: '#595CFF',
    width: '60%',
    alignItems: 'center',
  },
  activeToggleText: {fontWeight: '700'},
  scroll: {
    alignItems: 'center',
    paddingBottom: 30,
    top:"3%"
  },
  pillContainer: {
  width: '90%',
  marginVertical: 10,
  alignItems: 'center',
  marginHorizontal: "25%",
},

pillBox: {
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  height: height * 0.08,
  borderRadius: 20,
  paddingHorizontal: 15,
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 4},
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6,
},

circleOuter: {
  width: normalize(22),
  height: normalize(22),
  borderRadius: normalize(11),
  borderWidth: 2,
  borderColor: '#fff',
  marginRight: 15,
  alignItems: 'center',
  justifyContent: 'center',
},

circleInner: {
  width: '80%',
  height: '80%',
  borderRadius: 999,
  backgroundColor: '#fff',
},

pillText: {
  fontSize: normalize(14),
  fontWeight: '600',
},
  nextButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 25,
  },
  nextText: {
    fontSize: normalize(16),
    fontWeight: '700',
  },
});
