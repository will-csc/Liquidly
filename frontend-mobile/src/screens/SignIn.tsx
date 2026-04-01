import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import Button from '../components/Button';
import FaceLoginButton from '../components/FaceLoginButton';
import Input from '../components/Input';
import InlineLinkText from '../components/InlineLinkText';
import BackButton from '../components/BackButton';
import ScreenLayout from '../components/ScreenLayout';
import { authService } from '../services/api';
import { userStorage } from '../services/userStorage';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import { useI18n } from '../i18n/i18n';

const SignIn = ({ navigation }: any) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera Logic
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const startCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setErrorMessage(t('login.permissionRequiredFace'));
        return;
      }
    }
    setIsCameraVisible(true);
  };

  const takePictureAndLogin = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
        if (photo?.base64) {
          setIsCameraVisible(false);
          setLoading(true);
          try {
            const auth = await authService.loginFace({ faceImage: 'data:image/jpeg;base64,' + photo.base64 });
            await userStorage.setUser(auth.user);
            await userStorage.setToken(auth.token);
            navigation.replace('Main');
          } catch (error: any) {
            console.error('Face Login failed:', error);
            setErrorMessage(getErrorMessage(error, t('login.invalidCredentials')));
          } finally {
            setLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
        setErrorMessage(t('login.captureFailed'));
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage(t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const auth = await authService.login({ email, password });
      await userStorage.setUser(auth.user);
      await userStorage.setToken(auth.token);
      navigation.replace('Main');
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(getErrorMessage(error, t('login.invalidCredentials')));
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
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={takePictureAndLogin}
                  style={{ padding: 15, backgroundColor: theme.colors.primary, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('common.login')}</Text>
                </TouchableOpacity>
             </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenLayout
      backgroundImage={require('../assets/images/login-image.png')}
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
              <Text style={styles.title}>{t('login.welcomeBack')}</Text>
              
              <Input
                label={t('common.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label={t('common.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.secondary}
                    />
                  </TouchableOpacity>
                }
              />

              <Button
                title={loading ? t('login.loggingIn') : t('common.login')}
                onPress={handleLogin}
                variant="primary"
                disabled={loading}
              />

              <FaceLoginButton
                label={t('login.loginWithFace')}
                onPress={startCamera}
                disabled={loading}
                icon={require('../assets/images/camera-icon.png')}
              />

              <Button
                title={t('common.signup')}
                onPress={() => navigation.navigate('SignUp')}
                variant="secondary"
              />

              <View style={styles.forgotPasswordContainer}>
                <InlineLinkText
                  text={t('login.forgotPassword')}
                  linkText={t('login.clickHere')}
                  onPressLink={() => navigation.navigate('ForgotPassword')}
                />
              </View>
          </ScrollView>
      </KeyboardAvoidingView>
      <ErrorOverlay message={errorMessage} title={t('login.failedTitle')} onClose={() => setErrorMessage(null)} />
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
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default SignIn;
