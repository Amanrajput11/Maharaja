import React from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';
import CustomHeader from '../components/CustomHeader';

export default function AdminUsersScreen({ navigation }) {
  const context = React.useContext(AppContext);

  return (
    <View style={styles.container}>
      <CustomHeader title="Manage Users" showLogout={true} navigation={navigation} />
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AddUser')}>
        <Text style={styles.btnText}>+ Add New User</Text>
      </TouchableOpacity>
      <FlatList
        data={context.users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.productRow}>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.email} • {item.role}</Text>
              </View>
              {item.role !== 'admin' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { if (confirm('Delete this user?')) context.deleteUser(item.id); }}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}
