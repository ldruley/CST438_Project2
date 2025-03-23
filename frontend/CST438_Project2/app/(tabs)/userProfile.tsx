import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

/**
 * Interface defining user data structure
 */
interface UserData {
  username: string;
  email: string;
  id: number;
  isAdmin: boolean;
}

/**
 * UserProfile Component
 * 
 * This component provides a user profile page with functionality to:
 * - Display user information
 * - Edit profile information
 * - Change password
 * - Delete account
 * - Log out
 */
const UserProfile: React.FC = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form data state
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Delete account confirmation modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState<string>('');
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Profile edit modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'edit' | 'password'>('edit');
  
  // Button states for visual feedback
  const [editButtonHovered, setEditButtonHovered] = useState(false);
  const [passwordButtonHovered, setPasswordButtonHovered] = useState(false);
  const [deleteButtonHovered, setDeleteButtonHovered] = useState(false);
  
  const router = useRouter();

  // ==================== LIFECYCLE HOOKS ====================
  
  /**
   * Refresh user data when screen is focused
   * This ensures data is up-to-date when navigating back to this screen
   */
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused, refreshing data');
      fetchUserData();
      
      return () => {
        console.log('Profile screen unfocused');
      };
    }, [])
  );
  
  /**
   * Initial data load on component mount
   */
  useEffect(() => {
    fetchUserData();
  }, []);

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetches user data from the API
   * Falls back to stored data if API request fails
   */
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get token and username from storage
      const token = await AsyncStorage.getItem('jwtToken');
      const existingUsername = await AsyncStorage.getItem('username');
      
      // Handle authentication issues
      if (!token) {
        // No token found, redirect to login
        setError('You are not logged in');
        router.replace('/login');
        return;
      }
      
      if (!existingUsername) {
        setError('User information not found');
        return;
      }
      
      try {
        // Attempt to fetch user data from API
        const response = await fetch('http://localhost:8080/api/users/current', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Successfully retrieved user data
          const userData = await response.json();
          setUserData(userData);
          setUsername(userData.username);
          setEmail(userData.email || '');
        } else {
          // API request failed, use stored username as fallback
          console.log('Could not fetch full user profile, using stored username');
          setUserData({
            username: existingUsername,
            email: existingUsername + '@example.com', // placeholder
            id: 0, // placeholder
            isAdmin: false // placeholder
          });
          
          setUsername(existingUsername);
          setEmail(existingUsername + '@example.com'); // placeholder
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Network error, use stored username as fallback
        setUserData({
          username: existingUsername,
          email: existingUsername + '@example.com', // placeholder
          id: 0, // placeholder
          isAdmin: false // placeholder
        });
        
        setUsername(existingUsername);
        setEmail(existingUsername + '@example.com'); // placeholder
      }
    } catch (err) {
      console.error('Error in overall fetchUserData function:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // ==================== USER ACTIONS ====================
  
  /**
   * Updates the user's profile information (username and email)
   * Validates form input before submitting
   */
  const handleUpdateProfile = async () => {
    // Form validation
    if (!username || !email) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }
    
    if (!userData?.id) {
      Alert.alert('Error', 'Could not determine user ID. Please try logging in again.');
      return;
    }
    
    try {
      // Authentication check
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        Alert.alert('Error', 'Not authorized. Please log in again.');
        router.replace('/login');
        return;
      }
      
      // Prepare data for API request
      const updates = {
        username: username,
        email: email
      };
      
      // Send update request to API
      const response = await fetch(`http://localhost:8080/api/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        // Update successful
        const updatedUser = await response.json();
        
        // Update local state
        setUserData(updatedUser);
        
        // Update AsyncStorage with new username if it changed
        if (updatedUser.username !== userData.username) {
          await AsyncStorage.setItem('username', updatedUser.username);
        }
        
        Alert.alert('Success', 'Profile updated successfully!');
        setModalVisible(false);
      } else {
        // Handle error based on status code
        let errorMessage = 'Failed to update profile.';
        
        if (response.status === 404) {
          errorMessage = 'User not found.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Not authorized to update this profile.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid data provided.';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating your profile. Please try again.');
    }
  };

  /**
   * Updates the user's password
   * Validates current password and new password match before submitting
   */
  const handleUpdatePassword = async () => {
    // Password validation
    if (!currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'New password and confirmation are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (!userData?.id) {
      Alert.alert('Error', 'Could not determine user ID. Please try logging in again.');
      return;
    }
    
    try {
      // Authentication check
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        Alert.alert('Error', 'Not authorized. Please log in again.');
        router.replace('/login');
        return;
      }
      
      // Prepare password data for API
      const updates = {
        currentPassword: currentPassword,
        newPassword: newPassword
      };
      
      // Send password update request
      const response = await fetch(`http://localhost:8080/api/users/${userData.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        // Password update successful
        Alert.alert('Success', 'Password updated successfully!');
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setModalVisible(false);
      } else {
        // Handle error based on status code
        let errorMessage = 'Failed to update password.';
        
        if (response.status === 404) {
          errorMessage = 'User not found.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Not authorized or incorrect current password.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid password data provided.';
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'An error occurred while updating your password. Please try again.');
    }
  };

  /**
   * Prepares the delete account modal for display
   * Resets confirmation fields
   */
  const handleShowDeleteModal = () => {
    setDeleteConfirmPassword('');
    setDeleteConfirmUsername('');
    setDeleteModalVisible(true);
  };

  /**
   * Deletes the user's account after confirming username and password
   * Redirects to login screen after successful deletion
   */
  const handleDeleteAccount = async () => {
    // Validate deletion confirmation
    if (deleteConfirmUsername !== userData?.username) {
      Alert.alert('Error', 'Username does not match');
      return;
    }
  
    if (!deleteConfirmPassword) {
      Alert.alert('Error', 'Password is required to confirm deletion');
      return;
    }
  
    setIsDeleting(true);
  
    try {
      // Authentication check
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token || !userData?.id) {
        Alert.alert('Error', 'Unable to delete account. Please try logging in again.');
        setIsDeleting(false);
        return;
      }
      
      console.log('Attempting to delete account with id:', userData.id);
      
      try {
        // Send delete request to API
        const deleteResponse = await fetch(`http://localhost:8080/api/users/deleteUser/${userData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Delete response status:', deleteResponse.status);
        
        if (deleteResponse.status === 204) {
          // Account successfully deleted
          console.log('Account successfully deleted');
          
          // Clear ALL data from AsyncStorage
          await AsyncStorage.clear();
          
          setDeleteModalVisible(false);
          Alert.alert('Account Deleted', 'Your account has been deleted successfully');
          router.replace('/login');
        } else {
          // Handle error based on status code
          let errorText = '';
          try {
            errorText = await deleteResponse.text();
          } catch (e) {
            console.error('Could not read error response');
          }
          
          let errorMessage = 'Failed to delete account.';
          
          if (deleteResponse.status === 404) {
            errorMessage = 'Account not found.';
          } else if (deleteResponse.status === 401 || deleteResponse.status === 403) {
            errorMessage = 'Not authorized to delete this account.';
          }
          
          Alert.alert('Error', errorMessage);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        Alert.alert('Error', 'An error occurred while deleting your account. Please try again.');
      }
    } catch (error) {
      console.error('Error in deletion process:', error);
      Alert.alert('Error', 'An error occurred while processing your request. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  /**
   * Logs out the user by clearing stored tokens and redirecting to login
   * Makes API call to server logout endpoint if token exists
   */
  const handleLogout = async () => {
    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Notify server about logout if token exists
      if (token) {
        try {
          await fetch('http://localhost:8080/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
        }
      }
     
      // Clear local storage data
      await AsyncStorage.clear();
      
      // Redirect to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/login');
    }
  };

  // ==================== MODAL HANDLERS ====================
  
  /**
   * Opens the edit profile modal and initializes form fields with user data
   */
  const openEditProfileModal = () => {
    setUsername(userData?.username || '');
    setEmail(userData?.email || '');
    setModalMode('edit');
    setModalVisible(true);
  };

  /**
   * Opens the change password modal and clears password fields
   */
  const openChangePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setModalMode('password');
    setModalVisible(true);
  };

  // ==================== RENDER METHODS ====================
  
  /**
   * Renders loading indicator during data fetching
   */
  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  /**
   * Renders error message if data fetching fails
   */
  if (error) {
    return (
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  /**
   * Main render method for the profile screen
   */
  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      {/* Header with title and logout button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main profile card */}
      <View style={styles.userInfoContainer}>
        <View style={styles.userCard}>
          {/* User information section */}
          <View style={styles.userInfo}>
            <Text style={styles.username}>{userData?.username}</Text>
            <Text style={styles.email}>{userData?.email}</Text>
            <Text style={[styles.adminStatus, userData?.isAdmin ? styles.adminTrue : styles.adminFalse]}>
              {userData?.isAdmin ? "Admin" : "Regular User"}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Account actions section */}
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.actionButtons}>
            {/* Edit profile button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.editButton,
                editButtonHovered && styles.buttonHovered
              ]} 
              onPress={openEditProfileModal}
              onPressIn={() => setEditButtonHovered(true)}
              onPressOut={() => setEditButtonHovered(false)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            {/* Change password button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.passwordButton,
                passwordButtonHovered && styles.buttonHovered
              ]} 
              onPress={openChangePasswordModal}
              onPressIn={() => setPasswordButtonHovered(true)}
              onPressOut={() => setPasswordButtonHovered(false)}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            
            {/* Delete account button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.deleteButton,
                deleteButtonHovered && styles.buttonHovered
              ]} 
              onPress={handleShowDeleteModal}
              onPressIn={() => setDeleteButtonHovered(true)}
              onPressOut={() => setDeleteButtonHovered(false)}
            >
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Edit Profile / Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalMode === 'edit' ? 'Edit Profile' : 'Change Password'}
            </Text>

            {modalMode === 'edit' ? (
              // Edit profile form
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username:</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email:</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleUpdateProfile}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Change password form
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Password:</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="Enter current password"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password:</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm Password:</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleUpdatePassword}
                  >
                    <Text style={styles.buttonText}>Update Password</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            
            <Text style={styles.modalText}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            
            <Text style={styles.modalLabel}>
              Please type your username ({userData?.username}) to confirm:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmUsername}
              onChangeText={setDeleteConfirmUsername}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            
            <Text style={styles.modalLabel}>Enter your password to confirm:</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmPassword}
              onChangeText={setDeleteConfirmPassword}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor="#999"
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
                  deleteConfirmUsername !== userData?.username ? styles.disabledButton : null
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmUsername !== userData?.username}
              >
                <Text style={styles.buttonText}>
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

/**
 * Component Styles
 * 
 * Defines all styling for the UserProfile component
 */
const styles = StyleSheet.create({
  // Layout and container styles
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
  
  // User card and info styles
  userInfoContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  adminStatus: {
    fontWeight: '500',
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  adminTrue: {
    color: '#2e7d32',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  adminFalse: {
    color: '#666',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Section styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
    width: '100%',
  },
  
  // Button styles
  actionButtons: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  editButton: {
    backgroundColor: '#2196f3', // Blue
  },
  passwordButton: {
    backgroundColor: '#ff9800', // Orange
  },
  deleteButton: {
    backgroundColor: '#f44336', // Red
  },
  buttonHovered: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#808080', // Gray
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Status indicators
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
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxWidth: 500,
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
    marginBottom: 15,
  },
  
  // Form styles
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
  
  // Modal button styles
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  confirmDeleteButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#ffcccc',
    opacity: 0.7,
  },
  
  // Generic button style
  button: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: '#2196f3',
    marginTop: 20,
    width: 200,
    alignSelf: 'center',
  },
});

export default UserProfile;