import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  Modal,
  Image,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../styles/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import BackButton from '../components/BackButton';
import ScreenLayout from '../components/ScreenLayout';
import { authService } from '../services/api';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';

const SignUp = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'One uppercase letter', regex: /[A-Z]/ },
    { label: 'One number', regex: /[0-9]/ },
    { label: 'One special character', regex: /[!@#$%^&*(),.?":{}|<>]/ }
  ];

  const passwordValidation = passwordRequirements.map((r) => ({
    label: r.label,
    met: r.regex.test(password)
  }));
  const isPasswordValid = passwordValidation.every((r) => r.met);

  // Camera Logic
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setErrorMessage('Camera permission is required to take a photo.');
        return;
      }
    }
    setIsCameraVisible(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
        if (photo?.base64) {
          setFaceImage('data:image/jpeg;base64,' + photo.base64);
          setIsCameraVisible(false);
        }
      } catch (e) {
        console.error(e);
        setErrorMessage('Failed to take picture');
      }
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !company || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password does not meet the requirements');
      return;
    }

    setLoading(true);
    try {
      await authService.signup({ 
        name, 
        email, 
        password,
        companyName: company,
        faceImage: faceImage || undefined
      });
      Alert.alert('Success', 'Account created! Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('SignIn') }
      ]);
    } catch (error: any) {
      console.error('Sign up failed:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to create account'));
    } finally {
      setLoading(false);
    }
  };

  if (isCameraVisible) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView 
          style={{ flex: 1 }} 
          facing="front"
          ref={cameraRef}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 50, alignItems: 'center' }}>
             <View style={{ flexDirection: 'row', gap: 20 }}>
                <TouchableOpacity 
                  onPress={() => setIsCameraVisible(false)}
                  style={{ padding: 15, backgroundColor: 'red', borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={takePicture}
                  style={{ padding: 15, backgroundColor: theme.colors.primary, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Capture Face</Text>
                </TouchableOpacity>
             </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenLayout
    
    
      backgroundImage={require('../assets/images/signup-image.png')}
      headerContent={
         <View style={styles.headerContainer}>
          <BackButton
            style={styles.backButton}
            onPress={() => navigation.navigate('Entry')}
          />
          <Image
            source={require('../assets/images/logo-liquidly.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      }
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
      >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Get Started</Text>
              
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Company"
                value={company}
                onChangeText={setCompany}
                autoCapitalize="words"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={{ marginTop: 8, marginBottom: 6 }}>
                {passwordValidation.map((req) => (
                  <Text
                    key={req.label}
                    style={{
                      color: req.met ? theme.colors.primary : theme.colors.textLight,
                      fontSize: 12,
                      marginTop: 2
                    }}
                  >
                    {req.met ? '✓' : '•'} {req.label}
                  </Text>
                ))}
              </View>

              {/* Camera Trigger */}
              <View style={{ marginVertical: 10 }}>
                <Text style={{ color: theme.colors.textLight, marginBottom: 5 }}>Face Registration (Optional)</Text>
                
                {!faceImage && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Switch
                      value={consentGiven}
                      onValueChange={setConsentGiven}
                      trackColor={{ false: "#767577", true: theme.colors.primary }}
                      thumbColor={consentGiven ? "#f4f3f4" : "#f4f3f4"}
                    />
                    <Text style={{ marginLeft: 10, color: theme.colors.textLight, fontSize: 14 }}>
                      I consent to using my face for authentication
                    </Text>
                  </View>
                )}

                {faceImage ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image source={{ uri: faceImage }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }} />
                    <TouchableOpacity onPress={() => setFaceImage(null)}>
                      <Text style={{ color: 'red' }}>Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : consentGiven ? (
                  <TouchableOpacity 
                    onPress={startCamera}
                    style={{ 
                      padding: 12, 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: 8, 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#ddd'
                    }}
                  >
                    <Text style={{ color: theme.colors.text }}>Tap to Take Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Button
                title={loading ? "Signing up..." : "Sign-Up"}
                onPress={handleSignUp}
                variant="primary"
                disabled={loading}
              />

              <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>
                      Already have an account? <Text style={styles.signInLink} onPress={() => navigation.navigate('SignIn')}>Sign In</Text>
                  </Text>
              </View>
          </ScrollView>
      </KeyboardAvoidingView>
      <ErrorOverlay message={errorMessage} title="Sign Up Failed" onClose={() => setErrorMessage(null)} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
 headerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 180,
    height: 60,
  },
  

  backButton: {
    position: 'absolute',
    top: 10,
    left: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: theme.fontSize.display,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  signInContainer: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignUp;
