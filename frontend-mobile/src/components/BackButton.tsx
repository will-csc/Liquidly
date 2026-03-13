import React from 'react';
import { TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  icon?: 'white' | 'black';
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style, icon = 'white' }) => {
  const iconSource = icon === 'white' 
    ? require('../assets/images/go_back-entry-page.png')
    : require('../assets/images/go_back-entry-page-black.png');

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <Image 
        source={iconSource} 
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    zIndex: 10,
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default BackButton;
