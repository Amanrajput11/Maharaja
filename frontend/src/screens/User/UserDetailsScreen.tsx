import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles';
import { AppContext } from '../../context/AppContext';
import CustomHeader from '../../components/CustomHeader';

export default function UserDetailsScreen({ route, navigation }) {
  const { userId } = route.params;
  const context = React.useContext(AppContext);
  const user = context.getUserById(userId);
  const userFirms = context.getFirmsByUserId(userId);

  if (!user) return <Text>User not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <CustomHeader title="User Details" showLogout={true} navigation={navigation} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.label}>Name: <Text style={styles.value}>{user.name}</Text></Text>
        <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firms ({userFirms.length})</Text>
        {userFirms.map(firm => (
          <TouchableOpacity key={firm.id} style={styles.card} onPress={() => navigation.navigate('FirmDetails', { firmId: firm.id })}>
            <Text style={styles.cardTitle}>{firm.name}</Text>
            <Text style={styles.cardSubtitle}>{firm.partnerIds.length} Partners • {firm.products.length} Products</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
