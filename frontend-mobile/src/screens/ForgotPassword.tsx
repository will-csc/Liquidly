import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import BackButton from '../components/BackButton';
import ScreenLayout from '../components/ScreenLayout';
import { authService } from '../services/api';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';

const ForgotPassword = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
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
    met: r.regex.test(newPassword)
  }));
  const isPasswordValid = passwordValidation.every((r) => r.met);

  const handleSendCode = async () => {
    if (!email) {
      setErrorMessage('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const exists = await authService.emailExists(email);
      if (!exists) {
        setErrorMessage('Email not found');
        return;
      }

      await authService.sendRecoveryCode(email);
      setCodeSent(true);
      Alert.alert('Success', 'A recovery code was sent to your email');
    } catch (error: any) {
      console.error('Failed to send recovery code:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to send recovery code'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !code || !newPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage('Password does not meet the requirements');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, code, newPassword });
      Alert.alert('Success', 'Password updated. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('SignIn') }
      ]);
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      backgroundImage={require('../assets/images/forgotpassword-image.png')}
      headerContent={
        <BackButton 
          style={styles.backButton}
          onPress={() => navigation.navigate('Entry')}
          icon="black"
        />
      }
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
      >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Reset your password</Text>
              
              <Input
                label="Email"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!codeSent}
              />

              {codeSent && (
                <>
                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
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
                  <Input
                    label="Code Sent on Your Email"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {!codeSent ? (
                <Button
                  title={loading ? 'Sending...' : 'Send Code'}
                  onPress={handleSendCode}
                  variant="primary"
                  disabled={loading}
                />
              ) : (
                <Button
                  title={loading ? 'Resetting...' : 'Reset'}
                  onPress={handleReset}
                  variant="primary"
                  disabled={loading}
                />
              )}

              <Button
                title="Login"
                onPress={() => navigation.navigate('SignIn')}
                variant="secondary"
              />

              <TouchableOpacity style={styles.footerLinkContainer} onPress={() => {}}>
                  <Text style={styles.footerLinkText}>
                      Problems recovering your account?
                  </Text>
                  <Text style={[styles.footerLinkText, styles.footerLinkUnderline]}>
                      send us an email explaining the situation
                  </Text>
              </TouchableOpacity>

          </ScrollView>
      </KeyboardAvoidingView>
      <ErrorOverlay message={errorMessage} title="Error" onClose={() => setErrorMessage(null)} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
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
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerLinkText: {
    color: '#4F7942', // Green color
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  footerLinkUnderline: {
    textDecorationLine: 'underline',
  },
});

export default ForgotPassword;
