import {StyleSheet, Image, Platform, View, Text, TextInput, TouchableOpacity} from 'react-native';
import React, {useState} from "react";
import user from './user';
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

  function handleLogin(event: GestureResponderEvent): void {
    throw new Error('Function not implemented.');
  }

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
          <View style={styles.overlay}>
            <Text style={styles.title}>Login</Text>
    
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={user.username}
              onChangeText={(text) => handleChange('username', text)}
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
    
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
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