import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [activeList, setActiveList] = useState('No active list');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername || 'Guest');

      const storedList = await AsyncStorage.getItem('activeList');
      setActiveList(storedList || 'No active list');
    };
    fetchUserData();
  }, []);

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.greeting}>Hello {username}!</Text>
        <Text style={styles.listText}>Current Active List: {activeList}</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => router.push('/tierList')}>
          <Text style={styles.buttonText}>See All Lists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => router.push('/TierList')}>
          <Text style={styles.buttonText}>View Public Lists</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => router.push('/userProfile')}>
          <Text style={styles.buttonText}>Modify Account</Text>
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
    width: '80%',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  listText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default LandingPage;