import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar, 
} from 'react-native';
import Swiper from 'react-native-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const RF = (size) => (size * width) / 375;

const slides = [
  {
    id: 1,
    image: require('./Image/1.png'),
    description: 'Boost your mental math and reflexes.',
    buttonText: 'Next',
  },
  {
    id: 2,
    image: require('./Image/2.png'),
    description: "Put on your gym shoes and let's get working.",
    buttonText: 'Next',
  },
  {
    id: 3,
    image: require('./Image/3.png'),
    description: 'And Remember - Every Second Counts.',
    buttonText: `Let's Play`,
  },
];

const dotColors = ['#FB923C', '#12CFF3', '#F87171'];

const OnBoarding = ({ navigation }) => {
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const handleButtonPress = () => {
    if (index < slides.length - 1) {
      swiperRef.current.scrollBy(1);
    } else {
      navigation.navigate('Login');
    }
  };

  const getImageStyle = (id) => {
    switch (id) {
      case 1:
        return styles.imageStyleOne;
      case 2:
        return styles.imageStyleTwo;
      case 3:
        return styles.imageStyleThree;
      default:
        return {};
    }
  };

  const getTitleStyle = (id) => {
    switch (id) {
      case 1:
        return styles.titleStyleOne;
      case 2:
        return styles.titleStyleTwo;
      case 3:
        return styles.titleStyleThree;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* ✅ Add this line */}
      <StatusBar backgroundColor="#0f162b" barStyle="light-content" />

      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={false}
        onIndexChanged={(i) => setIndex(i)}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Image
              source={slide.image}
              style={[styles.image, getImageStyle(slide.id)]}
              resizeMode="contain"
            />
            <Text style={[styles.title, getTitleStyle(slide.id)]}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </Swiper>

      <View style={styles.paginationContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dotStyle,
              {
                backgroundColor: dotColors[i],
                width: index === i ? RF(25) : RF(4),
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>{slides[index].buttonText}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f162b',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: RF(20),
  },
  image: {
    width: width * 0.4,
    height: height * 0.25,
    marginTop: RF(25),
  },
  imageStyleOne: {
    borderRadius: 10,
  },
  imageStyleTwo: {
    // borderWidth: 2,
    // borderColor: 'blue',
  },
  imageStyleThree: {
    width: width * 0.7,
    height: height * 0.30,
  },
  title: {
    fontSize: RF(24),
    fontWeight: '700',
    marginBottom: RF(15),
  },
  titleStyleOne: {
    color: '#fff',
  },
  titleStyleTwo: {
    color: '#fff',
  },
  titleStyleThree: {
    color: '#fff',
  },
  description: {
    fontSize: RF(16),
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: RF(40),
    lineHeight: RF(22),
    height: RF(66),
    justifyContent: 'center',
  },
  button: {
    position: 'absolute',
    width: width * 0.75,
    height: RF(40),
    left: width * 0.15,
    top: height * 0.87,
    backgroundColor: '#FB923C',
    borderRadius: RF(50),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: RF(18),
    fontWeight: 'bold',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: RF(130),
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
  },
  dotStyle: {
    height: RF(4),
    borderRadius: RF(3),
    marginHorizontal: RF(2),
  },
});

export default OnBoarding;