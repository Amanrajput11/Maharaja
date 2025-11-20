import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';

export default function AddUserScreen({ navigation }) {
  const context = React.useContext(AppContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const addUser = () => {
    if (!name || !email) { alert('Please fill all fields'); return; }
    context.addUser({ name, email, role: 'user', firmIds: [] });
    alert('User added successfully!');
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
