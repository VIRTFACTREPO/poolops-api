import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/tokens';

// Import screens
import { OwnerHomeScreen } from '../screens/OwnerHomeScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ServiceHistoryScreen } from '../screens/owner/ServiceHistoryScreen';
import { ServiceReportDetail } from '../screens/owner/ServiceReportDetail';
import { RequestVisitScreen, RequestConfirmScreen } from '../screens/owner/RequestVisitScreen';

// Types
export type OwnerStackParamList = {
  OwnerHome: undefined;
  ServiceHistory: undefined;
  Notifications: undefined;
  Profile: undefined;
  ServiceReportDetail: { jobId?: string };
  RequestVisit: undefined;
  RequestConfirm: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

export function OwnerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="OwnerHome"
        component={OwnerHomeScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ServiceHistory"
        component={ServiceHistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ServiceReportDetail"
        component={ServiceReportDetail}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="RequestVisit"
        component={RequestVisitScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="RequestConfirm"
        component={RequestConfirmScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
