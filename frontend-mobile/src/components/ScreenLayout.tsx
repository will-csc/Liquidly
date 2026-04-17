import React from 'react';
import { View, StyleSheet, Image, ViewStyle, useWindowDimensions } from 'react-native';
import { theme } from '../styles/theme';

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
  const { height: windowHeight } = useWindowDimensions();
  const topSectionHeight = Math.max(220, windowHeight * 0.35);

  return (
    <View style={[styles.container, style]}>
      {backgroundImage || headerContent ? (
        <View style={[styles.topSection, { height: topSectionHeight }]}>
          {backgroundImage ? (
            <Image source={backgroundImage} style={styles.backgroundImage} resizeMode="cover" />
          ) : (
            <View style={styles.topFallback} />
          )}
          {headerContent}
        </View>
      ) : null}
      
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
    width: '100%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  topFallback: {
    flex: 1,
    backgroundColor: theme.colors.primary,
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
