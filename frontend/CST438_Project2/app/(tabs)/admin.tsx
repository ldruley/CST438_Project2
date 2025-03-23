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
  
  // Search and Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMethod, setSortMethod] = useState<'username' | 'email' | 'id'>('username');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
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
  const [passwordError, setPasswordError] = useState("");

  // Delete confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{username: string, id: number} | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    // If password is empty in edit mode, consider it valid (not changing password)
    if (!password) {
      return { isValid: true, message: '' };
    }
    
    // Check minimum length
    if (password.length < 6) {
      return { 
        isValid: false, 
        message: 'Password must be at least 6 characters long' 
      };
    }
    
    // Check for alphanumeric characters
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return { 
        isValid: false, 
        message: 'Password must contain both letters and numbers' 
      };
    }
    
    // Check for special character
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasSpecialChar) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one special character' 
      };
    }
    
    return { isValid: true, message: '' };
  };

  // Handle password input and validation
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError("");
      return;
    }

    const validation = validatePassword(text);
    if (!validation.isValid) {
      setPasswordError(validation.message);
    } else {
      setPasswordError("");
    }
  };

  // Filter users based on search query
  const getFilteredUsers = () => {
    if (!searchQuery.trim()) {
      return users;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
  };

  // Sort filtered users based on current sort settings
  const getSortedAndFilteredUsers = () => {
    const filteredUsers = getFilteredUsers();
    const sortedUsers = [...filteredUsers];
    
    switch (sortMethod) {
      case 'username':
        sortedUsers.sort((a, b) => {
          return sortDirection === 'asc' 
            ? a.username.localeCompare(b.username)
            : b.username.localeCompare(a.username);
        });
        break;
      case 'email':
        sortedUsers.sort((a, b) => {
          return sortDirection === 'asc'
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email);
        });
        break;
      case 'id':
        sortedUsers.sort((a, b) => {
          return sortDirection === 'asc'
            ? a.id - b.id
            : b.id - a.id;
        });
        break;
    }
    return sortedUsers;
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  const checkAdminStatus = async () => {
    try {
      console.log("Checking admin status...");
      
      const token = await AsyncStorage.getItem('jwtToken');
      
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
      
      if (response.ok) {
        const data = await response.json();
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
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to fetch users";
        try {
          const errorText = await response.text();
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (jsonError) {
            if (errorText) {
              errorMessage = errorText;
            }
          }
        } catch (textError) {
          console.error("Could not read error response body");
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format from server");
      }
      
      setUsers(data);
    } catch (err) {
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
  
    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert("Error", passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
  
    try {
      const url = `http://localhost:8080/auth/register?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.ok) {
        Alert.alert("Success", "User created successfully");
        resetForm();
        setModalVisible(false);
        fetchUsers(); // Refresh the user list
      } else {
        const text = await response.text();
        Alert.alert("Error", `Failed to create user: ${text || response.statusText}`);
      }
    } catch (err) {
      Alert.alert("Error", "Network or server error when creating user");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const updates: any = {
        username,
        email,
        isAdmin: userIsAdmin
      };

      // Only include password if it's provided
      if (password) {
        // Validate password if provided
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          Alert.alert("Error", passwordValidation.message);
          return;
        }
        
        if (password !== confirmPassword) {
          Alert.alert("Error", "Passwords do not match");
          return;
        }
        
        updates.password = password;
      }

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
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleShowDeleteModal = (username: string) => {
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return;
    }
    
    setUserToDelete({ username: user.username, id: user.id });
    setDeleteConfirmText("");
    setDeleteModalVisible(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return;
    }

    if (deleteConfirmText !== userToDelete.username) {
      Alert.alert("Error", "Username does not match. Please type the exact username to confirm deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        setIsDeleting(false);
        setDeleteModalVisible(false);
        return;
      }
      
      const response = await fetch(`http://localhost:8080/api/users/deleteUser/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 204) {
        // Update UI immediately for better UX
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        
        setDeleteModalVisible(false);
        Alert.alert("Success", "User deleted successfully");
      } else {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          console.error("Could not read error response");
        }
        
        throw new Error(`Failed to delete user. Status: ${response.status}`);
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
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
    setPasswordError("");
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
    setPasswordError("");
    setUserIsAdmin(user.isAdmin);
    setModalMode('view');
    setModalVisible(true);
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
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

  // Get the final sorted and filtered users
  const displayUsers = getSortedAndFilteredUsers();

  return (
    <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel: User Management</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={openCreateModal}
          >
            <Text style={styles.createButtonText}>+ Create New User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by username or email"
            placeholderTextColor="#aaa"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortMethod === 'username' && styles.activeSortButton]} 
            onPress={() => setSortMethod('username')}
          >
            <Text style={styles.sortButtonText}>Username</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortMethod === 'email' && styles.activeSortButton]} 
            onPress={() => setSortMethod('email')}
          >
            <Text style={styles.sortButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortMethod === 'id' && styles.activeSortButton]} 
            onPress={() => setSortMethod('id')}
          >
            <Text style={styles.sortButtonText}>ID</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.directionButton} 
            onPress={toggleSortDirection}
          >
            <Text style={styles.sortButtonText}>
              {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results count */}
      <View style={styles.resultsCountContainer}>
        <Text style={styles.resultsCount}>
          Showing {displayUsers.length} of {users.length} users
          {searchQuery ? ` (filtered by "${searchQuery}")` : ''}
        </Text>
      </View>

      <ScrollView style={styles.userList}>
        {displayUsers.length === 0 ? (
          <Text style={styles.noUsersText}>
            {searchQuery 
              ? `No users found matching "${searchQuery}"` 
              : "No users found"}
          </Text>
        ) : (
          displayUsers.map((user) => (
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
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleShowDeleteModal(user.username)}
                >
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
                editable={modalMode !== 'view'}
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
                  <Text style={styles.label}>
                    {modalMode === 'create' ? 'Password:' : 'New Password (leave blank to keep current):'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder={modalMode === 'create' ? "Enter password" : "Enter new password (optional)"}
                    secureTextEntry
                  />
                  {passwordError ? (
                    <Text style={styles.passwordError}>{passwordError}</Text>
                  ) : (
                    <Text style={styles.passwordHint}>
                      Password must have at least 6 characters, include letters, numbers, and a special character.
                    </Text>
                  )}
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

      {/* Delete confirmation modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete User</Text>
            
            <Text style={styles.modalText}>
              Are you sure you want to delete user "{userToDelete?.username}"?
              This action cannot be undone. All user data will be permanently deleted.
            </Text>
            
            <Text style={styles.modalLabel}>
              Please type the username "{userToDelete?.username}" to confirm:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Enter username to confirm"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmDeleteButton,
                  deleteConfirmText !== userToDelete?.username ? styles.disabledButton : null
                ]}
                onPress={handleDeleteUser}
                disabled={isDeleting || deleteConfirmText !== userToDelete?.username}
              >
                <Text style={styles.buttonText}>
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </Text>
              </TouchableOpacity>
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
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    createButton: {
      backgroundColor: '#4CAF50',
      padding: 10,
      borderRadius: 5,
    },
    createButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    // Search bar styles
    searchContainer: {
      marginHorizontal: 20,
      marginBottom: 10,
    },
    searchBarWrapper: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: 'white',
      fontSize: 16,
    },
    clearButton: {
      padding: 6,
    },
    clearButtonText: {
      color: 'white',
      fontSize: 16,
    },
    // Results count
    resultsCountContainer: {
      marginHorizontal: 20,
      marginBottom: 10,
    },
    resultsCount: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 14,
      fontStyle: 'italic',
    },
    // Sort controls
    sortContainer: {
      marginHorizontal: 20,
      marginBottom: 10,
      padding: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    },
    sortLabel: {
      color: 'white',
      fontWeight: 'bold',
      marginBottom: 8,
    },
    sortButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    sortButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginRight: 8,
      marginBottom: 8,
    },
    activeSortButton: {
      backgroundColor: '#4682B4', // Steel blue
    },
    sortButtonText: {
      color: 'white',
    },
    directionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginLeft: 'auto',
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
    // Delete confirmation modal
    modalText: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
      color: '#333',
    },
    modalLabel: {
      fontSize: 14,
      marginBottom: 10,
      color: '#333',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
    },
    modalButton: {
      padding: 12,
      borderRadius: 5,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: '#808080',
    },
    confirmDeleteButton: {
      backgroundColor: '#f44336',
    },
    disabledButton: {
      backgroundColor: '#ffcccc',
      opacity: 0.7,
    },

passwordError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  });