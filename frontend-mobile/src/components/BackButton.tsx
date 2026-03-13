import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  icon?: 'white' | 'black';
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style, icon = 'white' }) => {
  const color = icon === 'white' ? '#fff' : '#000';

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <Ionicons name="arrow-back" size={28} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    zIndex: 10,
  },
});

export default BackButton;
