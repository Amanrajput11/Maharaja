import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';
import CustomHeader from '../components/CustomHeader';

export default function UserProfileScreen({ navigation }) {
  const context = React.useContext(AppContext);
  const [name, setName] = useState(context.currentUser?.name || '');
  const [email, setEmail] = useState(context.currentUser?.email || '');

  const saveProfile = () => {
    context.updateUser(context.currentUser.id, { name, email });
    context.setCurrentUser({ ...context.currentUser, name, email });
    alert('Profile updated successfully!');
  };

  const myFirms = context.getFirmsByUserId(context.currentUser?.id);

  return (
    <ScrollView style={styles.container}>
      <CustomHeader title="My Profile" showLogout={true} navigation={navigation} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TouchableOpacity style={styles.btn} onPress={saveProfile}>
          <Text style={styles.btnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Firms ({myFirms.length})</Text>
        {myFirms.map(firm => (
          <TouchableOpacity key={firm.id} style={styles.card} onPress={() => navigation.navigate('FirmDetails', { firmId: firm.id })}>
            <Text style={styles.cardTitle}>{firm.name}</Text>
            <Text style={styles.cardSubtitle}>{firm.products.length} Products</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
