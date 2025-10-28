// Components/KeyboardSelector.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useKeyboard } from '../Globalfile/KeyboardContext';

const { width } = Dimensions.get('window');

const keyboardTypes = {
  classic: { name: 'Classic', keyGradient: ['#595CFF', '#87AEE9'], specialKey: '#1C2433' },
  neon: { name: 'Neon', keyGradient: ['#00FFD6', '#00A7FF'], specialKey: '#0B1220' },
  pastel: { name: 'Pastel', keyGradient: ['#FFB3BA', '#BAE1FF'], specialKey: '#FFE0AC' },
  dark: { name: 'Dark', keyGradient: ['#1C1C1C', '#3A3A3A'], specialKey: '#0B1220' },
};

const KeyboardSelector = () => {
  const { keyboard, changeKeyboard } = useKeyboard();

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {Object.keys(keyboardTypes).map((key) => {
        const kb = keyboardTypes[key];
        return (
          <TouchableOpacity key={key} onPress={() => changeKeyboard(key)}>
            <LinearGradient
              colors={kb.keyGradient}
              style={[styles.card, keyboard === key && styles.selectedCard]}>
              <Text style={styles.cardText}>{kb.name} Preview</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default KeyboardSelector;

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', paddingBottom: 30 },
  card: { width: width * 0.7, height: 80, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  selectedCard: { borderWidth: 3, borderColor: '#FFC300' },
  cardText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
