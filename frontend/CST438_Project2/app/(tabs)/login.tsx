import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '@/config/api';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  
  // Clear any existing session data when login page loads
  useEffect(() => {
    const clearSessionData = async () => {
      try {
        console.log('Clearing any stored session data...');
        // Get all keys in AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        
        // Filter out any user-related keys
        const authKeys = keys.filter(key => 
          key === 'jwtToken' || 
          key === 'username' || 
          key === 'userId' ||
          key.startsWith('user')
        );
        
        if (authKeys.length > 0) {
          // Remove all authentication data
          await AsyncStorage.multiRemove(authKeys);
          console.log('Cleared authentication data on login page load:', authKeys);
        } else {
          console.log('No authentication data to clear on login page load');
        }
      } catch (error) {
        console.error('Error clearing session data:', error);
      }
    };
    
    clearSessionData();
  }, []);

  const handleLogin = async (): Promise<void> => {
    if (!username || !password) {
      setError('Please fill out all fields.');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      console.log('Clearing any existing data before login...');
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);
      
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
  
      console.log('Attempting login for:', username);
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
  
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body length:', responseText.length);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If response isn't valid JSON, use it as error message
        setError(responseText || 'Server error occurred');
        setIsLoading(false);
        return;
      }
  
      if (!response.ok) {
        setError(data.message || 'Invalid username or password');
        setIsLoading(false);
        return;
      }
      
      const jwtToken = data.jwtToken;
      
      if (!jwtToken) {
        setError('Authentication failed: No token received');
        setIsLoading(false);
        return;
      }
  
      // Store the JWT token and user info in AsyncStorage
      console.log('Storing new authentication data...');
      await AsyncStorage.setItem('jwtToken', jwtToken);
      await AsyncStorage.setItem('username', username);
  
      // Store user ID if available
      if (data.userId) {
        await AsyncStorage.setItem('userId', data.userId.toString());
      }
  
      console.log('Login successful, new data stored');
      
      // Clear the form
      setUsername('');
      setPassword('');
      setError('');
      
      // Navigate to home screen
      router.replace('/welcome');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToCreateAccount = () => {
    router.push('/createAccount');
  };

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Login to Rankify</Text>

        {/* Username field */}
        <Text style={styles.inputLabel}>Please enter username</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Password field */}
        <Text style={styles.inputLabel}>Please enter password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Create account section */}
        <View style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>Don't have an account?</Text>
          <TouchableOpacity onPress={navigateToCreateAccount}>
            <Text style={styles.createAccountLink}>Create an account here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 40,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    width: '60%',
    maxWidth: 600,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 18,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(187, 134, 252, 0.6)',
  },
  loginButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createAccountText: {
    color: 'white',
    marginRight: 5,
    fontSize: 16,
  },
  createAccountLink: {
    color: '#4da6ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;