import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const CreateAccount: React.FC = () => {
  const [user, setUser] = useState({ username: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Handles input field updates
  const handleChange = (name: string, value: string) => {
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  // Handles account creation
  const handleCreateAccount = async () => {
    setError('');

    if (!user.username || !user.email || !user.password) {
      setError('⚠️ Please fill out all fields.');
      return;
    }
    if (!confirmPassword) {
      setError('⚠️ Please confirm your password.');
      return;
    }
    if (user.password !== confirmPassword) {
      setError("⚠️ Passwords don't match.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, isAdmin: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || '⚠️ Failed to create account.');
        return;
      }

      // Account successfully created, reset form and redirect
      setUser({ username: '', email: '', password: '' });
      setConfirmPassword('');
      router.push('/(tabs)/welcome');
    } catch (err) {
      setError('⚠️ An error occurred. Please try again later.');
    }
  };

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Create an Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={user.username}
          onChangeText={(text) => handleChange('username', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={user.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={user.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
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
    width: 300,
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
    textAlign: 'center',
  },
  button: {
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateAccount;
