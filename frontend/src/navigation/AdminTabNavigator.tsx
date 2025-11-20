import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ tabBarLabel: 'Users' }} />
      <Tab.Screen name="Products" component={AdminProductsScreen} options={{ tabBarLabel: 'Products' }} />
    </Tab.Navigator>
  );
}
