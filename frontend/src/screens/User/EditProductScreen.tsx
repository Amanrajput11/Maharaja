import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../../styles';
import { AppContext } from '../../context/AppContext';

export default function EditProductScreen({ route, navigation }) {
  const { firmId, productId } = route.params;
  const context = React.useContext(AppContext);
  const firm = context.getFirmById(firmId);
  const product = firm?.products.find(p => p.id === productId);

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price || '');

  const updateProduct = () => {
    if (!name || !price) { alert('Please fill all fields'); return; }
    context.updateProduct(firmId, productId, { name, price });
    alert('Product updated successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Product</Text>
      <Text style={styles.label}>Product Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Price (₹)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TouchableOpacity style={styles.btn} onPress={updateProduct}>
        <Text style={styles.btnText}>Update Product</Text>
      </TouchableOpacity>
    </View>
  );
}
