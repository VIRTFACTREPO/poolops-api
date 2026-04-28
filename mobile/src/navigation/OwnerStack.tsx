import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';

// Import screens
import { OwnerHomeScreen } from '../screens/OwnerHomeScreen';
import { OwnerNotificationsScreen } from '../screens/owner/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ServiceHistoryScreen } from '../screens/owner/ServiceHistoryScreen';
import { ServiceReportDetail } from '../screens/owner/ServiceReportDetail';
import { RequestVisitScreen, RequestConfirmScreen } from '../screens/owner/RequestVisitScreen';

// Types
export type OwnerTabParamList = {
  OwnerHome: undefined;
  OwnerNotifications: undefined;
};

export type OwnerStackParamList = {
  OwnerTabs: undefined;
  ServiceHistory: undefined;
  Profile: undefined;
  ServiceReportDetail: { jobId?: string };
  RequestVisit: undefined;
  RequestConfirm: undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();
const Tab = createBottomTabNavigator<OwnerTabParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

function OwnerTabs() {
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
          fontWeight: '500' as const,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'OwnerHome') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'OwnerNotifications') iconName = focused ? 'notifications' : 'notifications-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="OwnerHome" component={OwnerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="OwnerNotifications" component={OwnerNotificationsScreen} options={{ title: 'Notifications' }} />
    </Tab.Navigator>
  );
}

export function OwnerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen
        name="ServiceHistory"
        component={ServiceHistoryScreen}
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
