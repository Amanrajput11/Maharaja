import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles';
import { AppContext } from '../../context/AppContext';
import CustomHeader from '../../components/CustomHeader';

export default function FirmDetailsScreen({ route, navigation }: { route: { params: { firmId: string | number } }; navigation: any }) {
  const { firmId } = route.params;
  const context = React.useContext(AppContext);
  const firm = context.getFirmById(firmId);
  const isOwner = context.currentUser && firm?.partnerIds.includes(context.currentUser.id);

  if (!firm) return <Text>Firm not found</Text>;

  const partners = firm.partnerIds.map(id => context.getUserById(id)).filter(Boolean);

  return (
    <ScrollView style={styles.container}>
      <CustomHeader title="Firm Details" showLogout={true} navigation={navigation} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{firm.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partners ({partners.length})</Text>
        {partners.map(partner => (
          <TouchableOpacity key={partner.id} style={styles.card} onPress={() => navigation.navigate('UserDetails', { userId: partner.id })}>
            <Text style={styles.cardTitle}>{partner.name}</Text>
            <Text style={styles.cardSubtitle}>{partner.email}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products ({firm.products.length})</Text>
          {isOwner && (
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct', { firmId: firm.id })}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {firm.products.map(product => (
          <View key={product.id} style={styles.card}>
            <View style={styles.productRow}>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{product.name}</Text>
                <Text style={styles.cardSubtitle}>₹{product.price}</Text>
              </View>
              {isOwner && (
                <View style={styles.productActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProduct', { firmId: firm.id, productId: product.id })}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => { if (confirm('Delete this product?')) context.deleteProduct(firm.id, product.id); }}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
