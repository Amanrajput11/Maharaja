import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppContext } from '../context/AppContext';
import { styles } from '../styles';

export default function CustomHeader({ title, showLogout, navigation }) {
  const context = React.useContext(AppContext);

  if (!navigation) console.warn('Navigation prop is undefined in CustomHeader.');

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerActions}>
        {context.currentUser ? (
          showLogout && (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                if (navigation) {
                  context.setCurrentUser(null);
                  navigation.reset({ index: 0, routes: [{ name: 'Public' }] });
                } else {
                  console.error('Cannot navigate: navigation prop is undefined');
                }
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              if (navigation) {
                navigation.navigate('Login');
              } else {
                console.error('Cannot navigate to Login: navigation prop is undefined');
              }
            }}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
