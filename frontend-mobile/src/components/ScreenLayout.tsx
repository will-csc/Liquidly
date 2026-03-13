import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface ScreenLayoutProps {
  children: React.ReactNode;
  backgroundImage?: any;
  headerContent?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ 
  children, 
  backgroundImage, 
  headerContent, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      {backgroundImage && (
        <View style={styles.topSection}>
          <Image 
            source={backgroundImage} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {headerContent}
        </View>
      )}
      
      <View style={styles.bottomSection}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  topSection: {
    height: height * 0.35,
    width: '100%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    overflow: 'hidden',
  },
});

export default ScreenLayout;
