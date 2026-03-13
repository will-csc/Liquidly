import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

const Entry = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.contentContainer}>
        <View style={styles.logoWrapper}>
            <Image 
                source={require('../assets/images/logo-green.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
        
        <Text style={styles.title}>Liquidly</Text>
        
        <Text style={styles.subtitle}>
            Here you can manage{'\n'}All of your Liquidation{'\n'}Projects
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
            style={styles.signInButton} 
            onPress={() => navigation.navigate('SignIn')}
        >
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: 80, // Space for bottom buttons
  },
  logoWrapper: {
    marginBottom: theme.spacing.l,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: theme.fontSize.displayLarge,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
    maxWidth: '80%',
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

