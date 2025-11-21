import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AppProvider } from './src/context/AppContext';
import UserTabNavigator from './src/navigation/UserTabNavigator';
import AdminTabNavigator from './src/navigation/AdminTabNavigator';

import PublicUsersScreen from './src/screens/Public/PublicUsersScreen';
import PublicUserDetailsScreen from './src/screens/Public/PublicUserDetailsScreen';
import PublicFirmDetailsScreen from './src/screens/Public/PublicFirmDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';

import UserDetailsScreen from './src/screens/User/UserDetailsScreen';
import FirmDetailsScreen from './src/screens/User/FirmDetailsScreen';
import AddProductScreen from './src/screens/User/AddProductScreen';
import EditProductScreen from './src/screens/User/EditProductScreen';

import AddUserScreen from './src/screens/Admin/AddUserScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Public Screens */}
          <Stack.Screen name="Public" component={PublicUsersScreen} />
          <Stack.Screen name="PublicUserDetails" component={PublicUserDetailsScreen} />
          <Stack.Screen name="PublicFirmDetails" component={PublicFirmDetailsScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          
          {/* User Screens */}
          <Stack.Screen name="UserTabs" component={UserTabNavigator} />
          <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
          <Stack.Screen name="FirmDetails" component={FirmDetailsScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="EditProduct" component={EditProductScreen} />
          
          {/* Admin Screens */}
          <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}