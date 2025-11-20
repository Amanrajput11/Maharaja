import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const context = React.useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = () => {
    const user = context.users.find(u => u.email === email && password === '123456');
    if (!user) {
      alert('Invalid credentials! Use password: 123456');
      return;
    }
    context.setCurrentUser(user);
    navigation.reset({ index: 0, routes: [{ name: user.role === 'admin' ? 'AdminTabs' : 'UserTabs' }] });
  };

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (use: 123456)" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={login}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
