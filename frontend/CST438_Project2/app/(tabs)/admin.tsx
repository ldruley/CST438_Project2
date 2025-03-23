import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Button, ScrollView, ActivityIndicator, Alert, Modal, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface UserData {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  const checkAdminStatus = async () => {
    try {
      console.log("Checking admin status...");
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log("Token exists:", !!token);
      
      if (!token) {
        console.error("No authentication token found");
        setError("Not authenticated. Please log in.");
        router.push('/login');
        return;
      }
      
      const response = await fetch('http://localhost:8080/api/users/isAdmin', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Admin check response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Admin status response:", data);
        setIsAdmin(data.isAdmin);
        
        if (!data.isAdmin) {
          setError("You do not have admin privileges.");
          router.push('/');
        }
      } else {
       
        if (response.status === 401) {
          setError("Authentication failed. Please log in again.");
          router.push('/login');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setError("Error checking admin privileges");
    }
  };
  

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        setError("Not authenticated. Please log in.");
        return;
      }

      const response = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const userDetails = {
        username,
        email,
        password,
        isAdmin: userIsAdmin
      };

      // Using the PUT endpoint as specified in your requirements
      const response = await fetch(`http://localhost:8080/api/users?username=${username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDetails)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      Alert.alert("Success", "User created successfully");
      resetForm();
      setModalVisible(false);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error("Error creating user:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const updates: any = {
        email,
        isAdmin: userIsAdmin
      };

      // Only include password if it's provided
      if (password && password === confirmPassword) {
        updates.password = password;
      } else if (password || confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      // Using the PATCH endpoint as specified in your requirements
      const response = await fetch(`http://localhost:8080/api/users?username=${selectedUser.username}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      Alert.alert("Success", "User updated successfully");
      resetForm();
      setModalVisible(false);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error("Error updating user:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteUser = (username: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              
              // Using the DELETE endpoint as specified in your requirements
              const response = await fetch(`http://localhost:8080/api/users?username=${username}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                try {
                  const errorData = await response.json();
                  throw new Error(errorData.message || "Failed to delete user");
                } catch (jsonError) {
                  throw new Error("Failed to delete user");
                }
              }

              Alert.alert("Success", "User deleted successfully");
              fetchUsers(); // Refresh the user list
            } catch (err) {
              console.error("Error deleting user:", err);
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete user");
            }
          }
        }
      ]
    );
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setModalVisible(true);
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setUserIsAdmin(user.isAdmin);
    setModalMode('edit');
    setModalVisible(true);
  };

  const openViewModal = (user: UserData) => {
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setUserIsAdmin(user.isAdmin);
    setModalMode('view');
    setModalVisible(true);
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUserIsAdmin(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go Back" onPress={() => router.push('/')} />
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return (
      <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
        <Text style={styles.errorText}>Access Denied: Admin privileges required</Text>
        <Button title="Go Back" onPress={() => router.push('/')} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel: User Management</Text>
        <Button title="+ Create New User" onPress={openCreateModal} />
      </View>

      <ScrollView style={styles.userList}>
        {users.length === 0 ? (
          <Text style={styles.noUsersText}>No users found</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={[styles.adminStatus, user.isAdmin ? styles.adminTrue : styles.adminFalse]}>
                  {user.isAdmin ? "Admin" : "Regular User"}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => openViewModal(user)}>
                  <Text style={styles.buttonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(user)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteUser(user.username)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* User Modal (Create/Edit/View) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' 
                ? 'Create New User' 
                : modalMode === 'edit' 
                  ? 'Edit User' 
                  : 'User Details'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                editable={modalMode === 'create'} // Only editable when creating
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                editable={modalMode !== 'view'}
              />
            </View>

            {modalMode !== 'view' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{modalMode === 'create' ? 'Password:' : 'New Password (leave blank to keep current):'}</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={modalMode === 'create' ? "Enter password" : "Enter new password (optional)"}
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm Password:</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    secureTextEntry
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Admin Privileges:</Text>
              <Switch
                value={userIsAdmin}
                onValueChange={setUserIsAdmin}
                disabled={modalMode === 'view'}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setModalVisible(false)} />
              
              {modalMode === 'create' && (
                <Button title="Create User" onPress={handleCreateUser} />
              )}
              
              {modalMode === 'edit' && (
                <Button title="Save Changes" onPress={handleUpdateUser} />
              )}
              
              {modalMode === 'view' && (
                <Button title="Edit" onPress={() => setModalMode('edit')} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userList: {
    flex: 1,
    padding: 10,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  userInfo: {
    marginBottom: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  adminStatus: {
    marginTop: 5,
    fontWeight: '500',
  },
  adminTrue: {
    color: '#2e7d32',
  },
  adminFalse: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#2196f3',
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4c4c',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  noUsersText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});