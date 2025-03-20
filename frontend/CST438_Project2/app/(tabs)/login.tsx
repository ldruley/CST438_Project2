import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleLogin = async (): Promise<void> => {
    if (!username || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create form data to match your Spring endpoint expectations
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);


      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
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

      // Store the JWT token in AsyncStorage
      await AsyncStorage.setItem('jwtToken', jwtToken);
      
      // Also store username for displaying in the app
      await AsyncStorage.setItem('username', username);

      setUsername('');
      setPassword('');
      setError('');
      
      // Navigate to home screen
      router.push('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button 
          title={isLoading ? "Logging in..." : "Login"} 
          onPress={handleLogin} 
          disabled={isLoading}
        />
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
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    width: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Login;