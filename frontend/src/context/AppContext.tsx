import React, { useState } from 'react';

const initialUsers = [
  { id: '1', name: 'Aman Sharma', email: 'aman@gmail.com', role: 'user', firmIds: ['1', '2'] },
  { id: '2', name: 'Rohit Kumar', email: 'rohit@gmail.com', role: 'user', firmIds: ['1', '3'] },
  { id: '3', name: 'Priya Singh', email: 'priya@gmail.com', role: 'user', firmIds: ['2'] },
  { id: '4', name: 'Admin User', email: 'admin@gmail.com', role: 'admin', firmIds: [] },
];

const initialFirms = [
  { id: '1', name: 'Tech Solutions Pvt Ltd', partnerIds: ['1', '2'], products: [{ id: 'p1', name: 'Software License', price: '50000' }, { id: 'p2', name: 'Consulting Service', price: '25000' }] },
  { id: '2', name: 'Digital Marketing Hub', partnerIds: ['1', '3'], products: [{ id: 'p3', name: 'SEO Package', price: '15000' }, { id: 'p4', name: 'Social Media Management', price: '20000' }] },
  { id: '3', name: 'E-commerce Solutions', partnerIds: ['2'], products: [{ id: 'p5', name: 'Online Store Setup', price: '75000' }] },
];

export const AppContext = React.createContext(null);

export function AppProvider({ children }) {
  const [users, setUsers] = useState(initialUsers);
  const [firms, setFirms] = useState(initialFirms);
  const [currentUser, setCurrentUser] = useState(null);

  const getUserById = (id) => users.find(u => u.id === id);
  const getFirmById = (id) => firms.find(f => f.id === id);
  const getFirmsByUserId = (userId) => firms.filter(f => f.partnerIds.includes(userId));

  const updateUser = (userId, updatedData) => setUsers(u => u.map(item => item.id === userId ? { ...item, ...updatedData } : item));
  const deleteUser = (userId) => {
    setUsers(u => u.filter(item => item.id !== userId));
    setFirms(f => f.map(ff => ({ ...ff, partnerIds: ff.partnerIds.filter(id => id !== userId) })));
  };
  const addUser = (newUser) => setUsers(u => [...u, { ...newUser, id: String(Date.now()) }]);
  const updateFirm = (firmId, updatedData) => setFirms(f => f.map(item => item.id === firmId ? { ...item, ...updatedData } : item));
  const addProduct = (firmId, product) => setFirms(f => f.map(item => item.id === firmId ? { ...item, products: [...item.products, { ...product, id: String(Date.now()) }] } : item));
  const updateProduct = (firmId, productId, updatedProduct) => setFirms(f => f.map(item => item.id === firmId ? { ...item, products: item.products.map(p => p.id === productId ? { ...p, ...updatedProduct } : p) } : item));
  const deleteProduct = (firmId, productId) => setFirms(f => f.map(item => item.id === firmId ? { ...item, products: item.products.filter(p => p.id !== productId) } : item));

  const value = {
    users, firms, currentUser, setCurrentUser,
    getUserById, getFirmById, getFirmsByUserId,
    updateUser, deleteUser, addUser, updateFirm,
    addProduct, updateProduct, deleteProduct
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
