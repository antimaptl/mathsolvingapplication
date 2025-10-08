// Responsive.js
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

//  Base screen size (iPhone 11 reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

//  Horizontal scale
export const scaleWidth = (size) => (width / BASE_WIDTH) * size;

// Vertical scale
export const scaleHeight = (size) => (height / BASE_HEIGHT) * size;

//  Font normalize (auto scale font for all screens)
export const normalizeFont = (size) => {
  const newSize = size * (width / BASE_WIDTH);
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};

//  Percentage width of screen
export const wp = (percent) => {
  if (typeof percent !== 'number') {
    throw new Error(`❌ wp() expects a number but got ${typeof percent}`);
  }
  return (width * percent) / 100;
};

//  Percentage height of screen
export const hp = (percent) => {
  if (typeof percent !== 'number') {
    throw new Error(`❌ hp() expects a number but got ${typeof percent}`);
  }
  return (height * percent) / 100;
};
