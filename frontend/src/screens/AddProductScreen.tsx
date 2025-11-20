import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { AppContext } from '../context/AppContext';

export default function AddProductScreen({ route, navigation }) {
  const { firmId } = route.params;
  const context = React.useContext(AppContext);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const addProduct = () => {
    if (!name || !price) { alert('Please fill all fields'); return; }
    context.addProduct(firmId, { name, price });
    alert('Product added successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>
      <Text style={styles.label}>Product Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Price (₹)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TouchableOpacity style={styles.btn} onPress={addProduct}>
        <Text style={styles.btnText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  );
}
