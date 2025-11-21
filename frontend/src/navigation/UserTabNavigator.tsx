import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserDashboardScreen from '../screens/User/UserDashboardScreen';
import UserProfileScreen from '../screens/User/UserProfileScreen';

const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={UserDashboardScreen} options={{ tabBarLabel: 'Users' }} />
      <Tab.Screen name="Profile" component={UserProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
