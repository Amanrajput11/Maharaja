import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../../styles';
import { AppContext } from '../../context/AppContext';

interface Props {
  navigation: any;
}

export default function AddUserScreen({ navigation }: Props) {
  const context = React.useContext(AppContext) as {
    addUser: (user: { name: string; email: string; role: string; firmIds: string[] }) => void;
  } | null;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const addUser = () => {
    if (!name || !email) { Alert.alert('Please fill all fields'); return; }
    if (!context) { Alert.alert('Application context is not available.'); return; }
    context.addUser({ name, email, role: 'user', firmIds: [] });
    Alert.alert('User added successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New User</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TouchableOpacity style={styles.btn} onPress={addUser}>
        <Text style={styles.btnText}>Add User</Text>
      </TouchableOpacity>
    </View>
  );
}

