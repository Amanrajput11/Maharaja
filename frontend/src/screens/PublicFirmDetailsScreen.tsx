import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';
import CustomHeader from '../components/CustomHeader';

export default function PublicFirmDetailsScreen({ route, navigation }) {
  const { firmId } = route.params;
  const context = React.useContext(AppContext);
  const firm = context.getFirmById(firmId);

  if (!firm) return <Text>Firm not found</Text>;

  const partners = firm.partnerIds.map(id => context.getUserById(id)).filter(Boolean);

  return (
    <ScrollView style={styles.container}>
      <CustomHeader title="Firm Details" showLogout={false} navigation={navigation} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{firm.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partners ({partners.length})</Text>
        {partners.map(partner => (
          <TouchableOpacity key={partner.id} style={styles.card} onPress={() => navigation.navigate('PublicUserDetails', { userId: partner.id })}>
            <Text style={styles.cardTitle}>{partner.name}</Text>
            <Text style={styles.cardSubtitle}>{partner.email}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products ({firm.products.length})</Text>
        {firm.products.map(product => (
          <View key={product.id} style={styles.card}>
            <Text style={styles.cardTitle}>{product.name}</Text>
            <Text style={styles.cardSubtitle}>₹{product.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
