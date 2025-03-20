import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserCredentials {
  username: string;
  email: string;
  password: string;
}

const CreateAccount: React.FC = () => {
  // State for account creation form
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter(); // For navigation to home.tsx

  // Handle account creation form submission
  const handleCreateAccount = async (): Promise<void> => {
    if (!username || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      console.log("Starting account creation process...");
      
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('email', email);
      params.append('password', password);
      
      const createResponse = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
  
      console.log("Response status:", createResponse.status);
      const responseText = await createResponse.text();
      console.log("Response body:", responseText);
      
      if (!createResponse.ok) {
        setError(responseText || 'Failed to create account');
        setIsLoading(false);
        return;
      }
  
      console.log("Account created successfully");
      
      // Reset loading state immediately to unfreeze the UI
      setIsLoading(false);
      
      // Clear input fields
      setUsername('');
      setEmail('');
      setPassword('');
      
      // Instead of using Alert, navigate directly
      console.log("Navigating to login page directly");
      
      // Add a small delay before navigation to ensure state updates are processed
      setTimeout(() => {
        try {
          console.log("Executing navigation to login");
          router.replace('/login');
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation attempt
          try {
            console.log("Trying fallback navigation");
            router.push('/login');
          } catch (fallbackError) {
            console.error("Fallback navigation failed:", fallbackError);
          }
        }
      }, 300);
      
    } catch (err) {
      console.error('Error during account creation:', err);
      setError('An error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Create an Account</Text>

        {/* Account Creation Form */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button 
          title={isLoading ? "Creating Account..." : "Create Account"} 
          onPress={handleCreateAccount}
          disabled={isLoading} 
        />
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPressIn={() => router.push('/login')}>
            <Text style={styles.loginLink}>Login here</Text>
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
    color: 'red',
    marginBottom: 10,
  },
  loginContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    marginRight: 5,
  },
  loginLink: {
    color: '#4da6ff',
    fontWeight: 'bold',
  },
});

export default CreateAccount;