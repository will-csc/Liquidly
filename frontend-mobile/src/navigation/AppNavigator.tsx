import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo includes this by default
import { useNavigation } from '@react-navigation/native';

import Entry from '../screens/Entry';
import SignIn from '../screens/SignIn';
import SignUp from '../screens/SignUp';
import ForgotPassword from '../screens/ForgotPassword';

// New Screens
import Dashboard from '../screens/Dashboard';
import BOM from '../screens/BOM';
import Conversions from '../screens/Conversions';
import Report from '../screens/Report';

import { theme } from '../styles/theme';
import { userStorage } from '../services/userStorage';
import { useI18n } from '../i18n/i18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BOM') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Conversions') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ title: t('nav.home'), tabBarLabel: t('nav.home') }}
      />
      <Tab.Screen
        name="Conversions"
        component={Conversions}
        options={{ title: t('nav.conversions'), tabBarLabel: t('nav.conversions') }}
      />
      <Tab.Screen
        name="BOM"
        component={BOM}
        options={{ title: t('nav.bom'), tabBarLabel: t('nav.bom') }}
      />
      <Tab.Screen
        name="Report"
        component={Report}
        options={{ title: t('nav.report'), tabBarLabel: t('nav.report') }}
      />
    </Tab.Navigator>
  );
};

const ProtectedMainTabs = () => {
  const navigation: any = useNavigation();

  useEffect(() => {
    const user = userStorage.getUser();
    if (!user) {
      navigation.replace('Entry');
    }
  }, [navigation]);

  const user = userStorage.getUser();
  if (!user) return null;
  return <MainTabs />;
};

const AppNavigator = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState('Entry');

  useEffect(() => {
    (async () => {
      try {
        const user = await userStorage.hydrate();
        setInitialRouteName(user ? 'Main' : 'Entry');
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Entry" component={Entry} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      
      {/* Main App Navigation */}
      <Stack.Screen name="Main" component={ProtectedMainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
