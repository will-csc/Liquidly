import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nProvider } from './src/i18n/I18nProvider';
import { checkConnection, getCurrentBaseUrl, authService } from './src/services/api';

export default function App() {
  useEffect(() => {
    console.log(`[Mobile Startup] Base URL: ${getCurrentBaseUrl()}`);
    (async () => {
      try {
        const ok = await checkConnection();
        console.log(`[Mobile Startup] Health check: ${ok ? 'OK' : 'FAILED'}`);
      } catch (e: any) {
        console.warn('[Mobile Startup] Health check error', e?.message || e);
      }
      try {
        const route = '/api/users/exists';
        const result = await authService.emailExists('diagnostic@liquidly.invalid');
        console.log('[Mobile Startup] Connectivity OK', { route, result });
      } catch (e: any) {
        console.warn('[Mobile Startup] Connectivity FAILED', { route: '/api/users/exists', error: e?.message || e });
      }
    })();
  }, []);
  return (
    <I18nProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </I18nProvider>
  );
}

