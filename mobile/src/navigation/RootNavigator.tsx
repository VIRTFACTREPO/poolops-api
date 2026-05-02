import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../context/AuthContext';
import { OwnerStack } from './OwnerStack';
import { LoginScreen } from '../screens/LoginScreen';
import { RunSheetScreen } from '../screens/RunSheetScreen';
import { M5Screen } from '../screens/M5Screen';
import { M6ActiveJobScreen } from '../screens/M6ActiveJobScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { getApiClient, setApiToken } from '../services/api';
import { colors } from '../theme/tokens';

export type RootStackParamList = {
  Login: undefined;
  TechnicianTabs: undefined;
  M5: { jobId?: string };
  M6: { jobId?: string };
  OwnerStack: undefined;
};

export type TechnicianTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Search: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TechnicianTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
  },
};

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{name}</Text>
    </View>
  );
}

function TechnicianTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons name={iconName} size={20} color={focused ? '#FFFFFF' : color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={RunSheetScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Schedule" options={{ title: 'Schedule' }}>
        {() => <PlaceholderScreen name="Schedule" />}
      </Tab.Screen>
      <Tab.Screen name="Search" options={{ title: 'Search' }}>
        {() => <PlaceholderScreen name="Search" />}
      </Tab.Screen>
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token, role, isLoading, login } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await getApiClient().post<{ success: boolean; data: { token: string; refreshToken: string; role: string; user: { id: string; email: string; name?: string } } }>('/auth/login', { email, password });
      const { token, refreshToken, role: userRole, user } = response.data;
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }
      setApiToken(token);
      await login(token, userRole, user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <SafeAreaProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              {role === 'technician' ? (
                <Stack.Screen name="TechnicianTabs" component={TechnicianTabs} />
              ) : role === 'pool_owner' ? (
                <Stack.Screen name="OwnerStack" component={OwnerStack} />
              ) : (
                <Stack.Screen name="Login">
                  {() => <LoginScreen onLogin={handleLogin} />}
                </Stack.Screen>
              )}
              <Stack.Screen name="M5" component={M5Screen} options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="M6" component={M6ActiveJobScreen} options={{ animation: 'slide_from_right' }} />
            </>
          ) : (
            <Stack.Screen name="Login">
              {() => <LoginScreen onLogin={handleLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: '#111827',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
