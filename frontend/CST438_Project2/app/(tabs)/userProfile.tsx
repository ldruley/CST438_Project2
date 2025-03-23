import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface UserData {
  username: string;
  email: string;
  id: number;
  isAdmin: boolean;
}

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
 
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  const router = useRouter();

 
useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get token and username from storage
        const token = await AsyncStorage.getItem('jwtToken');
        const existingUsername= await AsyncStorage.getItem('username');
        
        if (!token) {
          // No token found, redirect to login
          setError('You are not logged in');
          router.push('/login');
          return;
        }
        
        if (!existingUsername) {
          setError('User information not found');
          return;
        }
        
        try {
          const response = await fetch('http://localhost:8080/api/users/current', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUserData(userData);
            setUsername(userData.username);
            setEmail(userData.email || '');
          } else {
            // Fallback: Just use the stored username
            console.log('Could not fetch full user profile, using stored username');
            setUserData({
              username: existingUsername,
              email: existingUsername + '@example.com', 
              id: 0, // placeholder
              isAdmin: false // placeholder
            });
            
            setUsername(existingUsername);
            setEmail(existingUsername + '@example.com'); // placeholder
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          
          // Fallback to just using the stored username
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
    
    fetchUserData();
  }, []);


const handleUpdateProfile = async () => {
    // Validate form data
    if (!username || !email) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }
    
    if (!userData?.id) {
      Alert.alert('Error', 'Could not determine user ID. Please try logging in again.');
      return;
    }
    
    try {
      // Get token from storage
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        Alert.alert('Error', 'Not authorized. Please log in again.');
        router.push('/login');
        return;
      }
      
      // Using the PATCH endpoint to update only specific fields
      const updates = {
        username: username,
        email: email
      };
      
      const response = await fetch(`http://localhost:8080/api/users/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update local state
        setUserData(updatedUser);
        
        // Update AsyncStorage with new username if it changed
        if (updatedUser.username !== userData.username) {
          await AsyncStorage.setItem('username', updatedUser.username);
        }
        
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      } else {
        // Handle error based on status
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

const handleUpdatePassword = async () => {
    // Validate password data
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
      // Get token from storage
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        Alert.alert('Error', 'Not authorized. Please log in again.');
        router.push('/login');
        return;
      }
      
      // Using the PATCH endpoint to update password
      const updates = {
        currentPassword: currentPassword,
        newPassword: newPassword
      };
      
      const response = await fetch(`http://localhost:8080/api/users/${userData.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Password updated successfully!');
        
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Handle error based on status
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

const handleDeleteAccount = () => {
  Alert.alert(
    'Delete Account',
    'Are you sure you want to delete your account? This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            // Get token from storage
            const token = await AsyncStorage.getItem('jwtToken');
            
            if (!token || !userData?.id) {
              Alert.alert('Error', 'Unable to delete account. Please try logging in again.');
              return;
            }
            
            // Call the delete endpoint
            const response = await fetch(`http://localhost:8080/api/users/deleteUser/${userData.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.status === 204) {
              // Successfully deleted
              // Clear local storage and redirect to login
              await AsyncStorage.removeItem('jwtToken');
              await AsyncStorage.removeItem('username');
              
              Alert.alert('Account Deleted', 'Your account has been deleted successfully');
              router.push('/login');
            } else {
              // Handle error based on status
              let errorMessage = 'Failed to delete account.';
              
              if (response.status === 404) {
                errorMessage = 'Account not found.';
              } else if (response.status === 401 || response.status === 403) {
                errorMessage = 'Not authorized to delete this account.';
              }
              
              Alert.alert('Error', errorMessage);
            }
          } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'An error occurred while deleting your account. Please try again.');
          }
        }
      }
    ]
  );
};

  const handleLogout = async () => {
    // Clear token and user data from storage
    await AsyncStorage.removeItem('jwtToken');
    await AsyncStorage.removeItem('username');
    
    // Redirect to login
    router.push('/login');
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go to Login" onPress={() => router.push('/login')} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileContainer}>
          <Text style={styles.title}>User Profile</Text>
          
          {/* User Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            {isEditing ? (
              // Edit mode
              <>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                <View style={styles.buttonRow}>
                  <Button title="Cancel" onPress={() => {
                    setIsEditing(false);
                    setUsername(userData?.username || '');
                    setEmail(userData?.email || '');
                  }} />
                  <Button title="Save Changes" onPress={handleUpdateProfile} />
                </View>
              </>
            ) : (
              // View mode
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Username:</Text>
                  <Text style={styles.value}>{userData?.username}</Text>
                </View>
              
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{userData?.email}</Text>
                </View>

                
                <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
              </>
            )}
          </View>
          
          {/* Password Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Password</Text>
            
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="#999"
            />
            
            <Button title="Update Password" onPress={handleUpdatePassword} />
          </View>
          
          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <Button title="Log Out" onPress={handleLogout} />
            
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <Button 
                title="Delete Account" 
                onPress={handleDeleteAccount}
                color="#ff0000" 
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  profileContainer: {
    width: '50%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    width: '60%',
    alignSelf: 'center', 
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },

  label: {
    color: '#dddddd',
    marginBottom: 5,
    fontWeight: '500',
    fontSize: 18,
  },
  value: {
    color: 'white',
    marginBottom: 10,
    fontSize: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
    
    
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dangerZone: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff0000',
    borderRadius: 5,
  },
  dangerTitle: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default UserProfile;