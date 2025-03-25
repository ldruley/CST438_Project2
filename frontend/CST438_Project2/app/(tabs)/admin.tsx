import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Button, ScrollView, ActivityIndicator, Alert, Modal, TouchableOpacity, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import API_CONFIG from '@/config/api';

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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/isAdmin`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
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
      const url = `${API_CONFIG.BASE_URL}/auth/register?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users?username=${selectedUser.username}`, {
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/deleteUser/${userToDelete.id}`, {
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

  // Main render for AdminScreen
return (
  <LinearGradient colors={["#000000", "#808080"]} style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Admin Panel: User Management</Text>
      <View style={styles.headerControls}>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={openCreateModal}
        >
          <Text style={styles.buttonText}>+ Create New User</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by username or email"
            placeholderTextColor="#e0e0e0"
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
    </View>

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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
              trackColor={{ false: "#767577", true: "#4da6ff" }}
              thumbColor={userIsAdmin ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            
            {modalMode === 'create' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateUser}
              >
                <Text style={styles.buttonText}>Create User</Text>
              </TouchableOpacity>
            )}
            
            {modalMode === 'edit' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateUser}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
            
            {modalMode === 'view' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.editButton]}
                onPress={() => setModalMode('edit')}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
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
  // Layout and container styles
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Button styles
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4da6ff',
    marginTop: 20,
    width: 200,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4da6ff',
    padding: 12,
    borderRadius: 8,
  },
  
  // Status indicators
  loadingText: {
    color: 'white',
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
  
  // Search styles
  searchContainer: {
    marginBottom: 16,
  },
  searchBarWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderColor: '#4da6ff',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: 'white',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
  },
  
  // Sort styles
  sortContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderColor: '#4da6ff',
    borderWidth: 1,
  },
  sortLabel: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 8,
  },
  activeSortButton: {
    backgroundColor: '#4da6ff',
  },
  sortButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  directionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  
  // Results count
  resultsCountContainer: {
    marginBottom: 16,
  },
  resultsCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  
  // User list
  userList: {
    flex: 1,
  },
  noUsersText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // User card
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: '#4da6ff',
    borderWidth: 1,
  },
  userInfo: {
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  adminStatus: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  adminTrue: {
    color: '#ffffff',
    backgroundColor: 'rgba(46, 125, 50, 0.4)',
  },
  adminFalse: {
    color: '#e0e0e0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#4da6ff',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333',
    width: '90%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
    borderColor: '#4da6ff',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#e0e0e0',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#e0e0e0',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
  
  // Form styles
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
  
  // Modal button styles
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#808080',
  },
  saveButton: {
    backgroundColor: '#4da6ff',
  },
  confirmDeleteButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  
  // Password validation styles
  passwordError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 4,
    fontStyle: 'italic',
  },
});