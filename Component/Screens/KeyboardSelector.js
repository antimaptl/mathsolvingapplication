import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import { useTheme } from '../Globalfile/ThemeContext';
import { KEYPAD_LAYOUTS } from '../Globalfile/keyboardLayouts';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const scale = width / 375;
const normalize = size => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const KeyboardPreview = ({ layout, theme, isSelected }) => {
  return (
    <View style={[styles.previewContainer, isSelected && styles.selectedPreview]}>
      {layout.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.previewRow}>
          {row.map((item, index) => {
            const strItem = item.toString().toLowerCase();
            const isSpecial = ['clear', 'clr', '⌫', 'del', 'ref', 'pm'].includes(strItem);
            const isSkip = strItem === 'skip';
            const isNa = strItem === 'na';

            if (isNa) return <View key={index} style={styles.previewKeyPlaceholder} />;

            let content = null;
            // Simple visual representation for preview
            if (strItem === 'del' || strItem === '⌫') {
              content = <MaterialIcons name="backspace" size={14} color="#fff" />;
            } else if (strItem === 'ref') {
              content = <MaterialIcons name="refresh" size={14} color="#fff" />;
            } else if (strItem === 'pm') {
              content = <Text style={{ fontSize: 8, color: '#fff' }}>+/-</Text>;
            } else if (strItem === 'clr' || strItem === 'clear') {
              content = <Text style={{ fontSize: 8, color: '#fff' }}>CLR</Text>;
            } else if (strItem === 'skip') {
              content = <Text style={{ fontSize: 8, color: '#fff' }}>SKIP</Text>;
            }

            return (
              <View
                key={index}
                style={[
                  styles.previewKey,
                  {
                    backgroundColor: (isSpecial || isSkip) ? '#1E293B' : (theme.primary || '#595CFF'),
                    opacity: (isSpecial || isSkip) ? 0.7 : 0.5,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                ]}
              >
                {content}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const KeyboardSelector = () => {
  const { keyboardTheme, changeKeyboardTheme, theme } = useTheme();

  const options = [
    { id: 'default', label: 'Default Keypad', layout: KEYPAD_LAYOUTS.default },
    { id: 'type1', label: 'Type 1 (Standard)', layout: KEYPAD_LAYOUTS.type1 },
    { id: 'type2', label: 'Type 2 (Reverse)', layout: KEYPAD_LAYOUTS.type2 },
  ];

  return (
    <View style={styles.container}>
      {options.map(option => {
        const isSelected = keyboardTheme === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.8}
            style={[
              styles.optionCard,
              isSelected && { borderColor: theme.primary || '#595CFF', borderWidth: 2 }
            ]}
            onPress={() => changeKeyboardTheme(option.id)}>

            <View style={styles.headerRow}>
              <Text style={[styles.optionLabel, { color: isSelected ? (theme.primary || '#fff') : '#94A3B8' }]}>
                {option.label}
              </Text>
              {isSelected && (
                <MaterialIcons name="check-circle" size={24} color={theme.primary || '#595CFF'} />
              )}
            </View>

            <KeyboardPreview layout={option.layout} theme={theme} isSelected={isSelected} />

          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default KeyboardSelector;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  optionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionLabel: {
    fontSize: normalize(16),
    fontWeight: '700',
  },
  previewContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
  },
  selectedPreview: {
    // styles for selected state if needed
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewKey: {
    flex: 1,
    height: 20,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  previewKeyPlaceholder: {
    flex: 1,
    height: 20,
    marginHorizontal: 2,
  }
});
