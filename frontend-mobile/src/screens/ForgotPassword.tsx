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
import { useI18n } from '../i18n/i18n';

const ForgotPassword = ({ navigation }: any) => {
  const { t } = useI18n();
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
      setErrorMessage(t('forgot.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const exists = await authService.emailExists(email);
      if (!exists) {
        setErrorMessage(t('forgot.emailNotFound'));
        return;
      }

      await authService.sendRecoveryCode(email);
      setCodeSent(true);
      Alert.alert(t('forgot.codeSentTitle'), t('forgot.codeSentBody'));
    } catch (error: any) {
      console.error('Failed to send recovery code:', error);
      setErrorMessage(getErrorMessage(error, t('forgot.sendCodeFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !code || !newPassword) {
      setErrorMessage(t('login.fillAllFields'));
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage(t('forgot.passwordRequirementsFailed'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, code, newPassword });
      Alert.alert(t('forgot.resetSuccessTitle'), t('forgot.resetSuccessBody'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('SignIn') }
      ]);
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      setErrorMessage(getErrorMessage(error, t('forgot.resetFailed')));
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
              <Text style={styles.title}>{t('forgot.title')}</Text>
              
              <Input
                label={t('common.email')}
                placeholder={t('common.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!codeSent}
              />

              {codeSent && (
                <>
                  <Input
                    label={t('forgot.newPasswordLabel')}
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
                    label={t('forgot.codeLabel')}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {!codeSent ? (
                <Button
                  title={loading ? t('forgot.sending') : t('forgot.sendCode')}
                  onPress={handleSendCode}
                  variant="primary"
                  disabled={loading}
                />
              ) : (
                <Button
                  title={loading ? t('forgot.resetting') : t('forgot.reset')}
                  onPress={handleReset}
                  variant="primary"
                  disabled={loading}
                />
              )}

              <Button
                title={t('forgot.login')}
                onPress={() => navigation.navigate('SignIn')}
                variant="secondary"
              />

              <TouchableOpacity style={styles.footerLinkContainer} onPress={() => {}}>
                  <Text style={styles.footerLinkText}>
                      {t('forgot.supportLine1')}
                  </Text>
                  <Text style={[styles.footerLinkText, styles.footerLinkUnderline]}>
                      {t('forgot.supportLine2')}
                  </Text>
              </TouchableOpacity>

          </ScrollView>
      </KeyboardAvoidingView>
      <ErrorOverlay message={errorMessage} title={t('common.error')} onClose={() => setErrorMessage(null)} />
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
