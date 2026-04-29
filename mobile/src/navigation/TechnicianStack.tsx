import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/tokens';

// Import screens (placeholders for now)
import { AuthLoadingScreen } from '../context/AuthContext';

// Types
export type TechnicianStackParamList = {
 TechnicianDashboard: undefined;
  'Technician Stack': undefined;
};

const Stack = createNativeStackNavigator<TechnicianStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.textInverse,
  headerTitleStyle: {
    fontWeight: '600',
  },
  headerShadowVisible: false,
};

export function TechnicianStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="TechnicianDashboard"
        component={AuthLoadingScreen}
        options={{ title: 'Technician Dashboard' }}
      />
      <Stack.Screen
        name="Technician Stack"
        component={AuthLoadingScreen}
        options={{ title: 'Technician' }}
      />
    </Stack.Navigator>
  );
}
