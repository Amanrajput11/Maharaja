import React from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { styles } from '../../styles';
import { AppContext } from '../../context/AppContext';
import CustomHeader from '../../components/CustomHeader';

export default function UserDashboardScreen({ navigation }) {
  const context = React.useContext(AppContext);

  return (
    <View style={styles.container}>
      <CustomHeader title="Dashboard" showLogout={true} navigation={navigation} />
      <FlatList
        data={context.users.filter(u => u.role !== 'admin')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('UserDetails', { userId: item.id })}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
