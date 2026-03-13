import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    image: require('../assets/images/logo-liquidly.png'),
    title: 'Liquidations, simplified',
    subtitle: 'Here you can manage\nAll of your Liquidation\nProjects',
  },
  {
    key: 'slide2',
    image: require('../assets/images/hero-image_entry-page.png'),
    title: 'Plan, track and close',
    subtitle: 'Projects with full visibility in one place.',
  },
  {
    key: 'slide3',
    image: require('../assets/images/dash.png'),
    title: 'Track KPIs and priorities',
    subtitle: 'Keep everything on one clean, simple dashboard.',
  },
];

const Entry = ({ navigation }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const onScrollEnd = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(slide);
  };

  const goToSignIn = () => navigation.navigate('SignIn');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.skipButton} onPress={goToSignIn}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={styles.scrollContainer}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}> 
            <Image 
              source={slide.image} 
              style={[
                styles.slideImage, 
                slide.key === 'slide3' ? styles.slideImageLarge : null
              ]} 
              resizeMode="contain"
              tintColor={slide.key === 'slide1' ? theme.colors.primary : undefined}
            />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.dotActive : null,
            ]}
          />
        ))}
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.signInButton} onPress={goToSignIn}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 2,
  },
  skipText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.xl,
  },
  slideImage: {
    width: '75%',
    height: '50%',
    marginBottom: theme.spacing.l,
  },
  slideImageLarge: {
    width: '90%',
    height: '50%',
  },
  slideTitle: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  slideSubtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '80%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  bottomContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: theme.colors.background,
  },
  signInButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  signInText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  signUpButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 50,
  },
  signUpText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});

export default Entry;
