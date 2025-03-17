import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router'; // For navigation

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

  const router = useRouter(); // For navigation to home.tsx

  // Handle account creation form submission
  const handleCreateAccount = async (): Promise<void> => {
    if (!username || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      // Make API call to create the user
      const response = await fetch('http://localhost:8080/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, isAdmin: false }), // Adjust if needed
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to create account');
        return;
      }

      // Account successfully created, reset form and show success
      setUsername('');
      setEmail('');
      setPassword('');
      setError('');

      // Automatically log the user in by making a login request
      const loginResponse = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), // Use the created credentials to log in
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        // Store authentication token (e.g., JWT) in local storage or state
        console.log('User logged in:', loginData);

        // Redirect to home page
        router.push('/home'); // This navigates to home.tsx
      } else {
        setError('Failed to log in automatically');
      }

    } catch (err) {
      setError('An error occurred. Please try again later.');
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

        <Button title="Create Account" onPress={handleCreateAccount} />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  input: {
    width: '80%',
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
});

export default CreateAccount;