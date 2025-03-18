import React, { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session'; 
import { useNavigation } from '@react-navigation/native'; 
import { router } from 'expo-router';
import Constants from 'expo-constants';



// Google OAuth Configuration
const googleOAuthConfig = {
  clientId: Constants.manifest.extra.OAUTH_CLIENT_ID || '', 
  redirectUri: makeRedirectUri(),
  scopes: ['profile', 'email'],
};

export default function WelcomeScreen() {
  // Load Google OAuth2 Discovery Document
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  const navigation = useNavigation();  // Use useNavigation hook to access navigation

  // Use useAuthRequest hook with both the config and discovery document
  const [request, response, promptAsync] = useAuthRequest(
    googleOAuthConfig,
    discovery
  );

  // Handle OAuth2 response
  useEffect(() => {
    if (response?.type === 'success') {
      const userInfo = response.params;
      console.log('User Info:', userInfo); // Handle user info or send to backend
    }
  }, [response]);

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome to Our App</Text>
        <Text style={styles.subtitle}>Login or create an account to continue</Text>

        {/* OAuth Login Button */}
        <TouchableOpacity style={styles.button} onPress={() => promptAsync()}>
          <Text style={styles.buttonText}>Login with Google</Text>
        </TouchableOpacity>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={[styles.button, styles.createAccountButton]} 
          onPress={() =>router.replace('/createAccount')} 
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'lightgray',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 5,
  },
  createAccountButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});