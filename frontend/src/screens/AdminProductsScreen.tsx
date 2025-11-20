import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';
import CustomHeader from '../components/CustomHeader';

export default function AdminProductsScreen({ navigation }) {
  const context = React.useContext(AppContext);

  return (
    <ScrollView style={styles.container}>
      <CustomHeader title="Manage Products" showLogout={true} navigation={navigation} />
      {context.firms.map(firm => (
        <View key={firm.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{firm.name}</Text>
          {firm.products.map(product => (
            <View key={product.id} style={styles.card}>
              <View style={styles.productRow}>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardSubtitle}>₹{product.price}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { if (confirm('Delete this product?')) context.deleteProduct(firm.id, product.id); }}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
