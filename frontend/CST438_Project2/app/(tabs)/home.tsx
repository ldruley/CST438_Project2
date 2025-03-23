import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [activeList, setActiveList] = useState('No active list');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Animation values for button hover effects
  const buttonScales = [
    React.useRef(new Animated.Value(1)).current,
    React.useRef(new Animated.Value(1)).current,
    React.useRef(new Animated.Value(1)).current
  ];

  // Function to fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      // First check if we have a valid token (user is logged in)
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.replace('/login');
        return;
      }
      
      // Get username and active list
      const storedUsername = await AsyncStorage.getItem('username');
      const storedList = await AsyncStorage.getItem('activeList');
      
      console.log('Fetched username from storage:', storedUsername);
      
      setUsername(storedUsername || 'Guest');
      setActiveList(storedList || 'No active list');
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Button hover animation functions with proper TypeScript typing
  const handlePressIn = (index: number): void => {
    Animated.spring(buttonScales[index], {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number): void => {
    Animated.spring(buttonScales[index], {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Fetch data on initial mount
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Also fetch data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Landing page is now in focus, refreshing data');
      fetchUserData();
      return () => {};
    }, [])
  );

  return (
    <LinearGradient 
      colors={['#000000', '#808080']} 
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.greeting}>{username}</Text>
          
          <View style={styles.activeListContainer}>
            <MaterialIcons name="playlist-play" size={24} color="#BB86FC" />
            <Text style={styles.listLabel}>Active List:</Text>
            <Text style={styles.listText}>{activeList}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* See All Lists Button */}
          <Animated.View style={{ transform: [{ scale: buttonScales[0] }], width: '100%' }}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/(tabs)/tierlists')}
              onPressIn={() => handlePressIn(0)} 
              onPressOut={() => handlePressOut(0)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="list" size={24} color="white" />
              <Text style={styles.buttonText}>See All Lists</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* View Public Lists Button */}
          <Animated.View style={{ transform: [{ scale: buttonScales[1] }], width: '100%' }}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/public-tierlists')}
              onPressIn={() => handlePressIn(1)} 
              onPressOut={() => handlePressOut(1)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="public" size={24} color="white" />
              <Text style={styles.buttonText}>View Public Lists</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Modify Account Button */}
          <Animated.View style={{ transform: [{ scale: buttonScales[2] }], width: '100%' }}>
            <TouchableOpacity 
              style={[styles.button, styles.tertiaryButton]}
              onPress={() => router.push('/userProfile')}
              onPressIn={() => handlePressIn(2)} 
              onPressOut={() => handlePressOut(2)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="account-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Modify Account</Text>
            </TouchableOpacity>
          </Animated.View>
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
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    width: '80%',
    maxWidth: 500,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
      }
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  welcomeText: {
    fontSize: 18,
    color: '#BB86FC',
    marginBottom: 5,
    fontWeight: '500',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  activeListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  listLabel: {
    fontSize: 16,
    color: '#BB86FC',
    marginLeft: 8,
    fontWeight: '500',
  },
  listText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 5,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        transition: 'transform 0.2s, opacity 0.2s',
        ':hover': {
          transform: 'scale(1.02)',
          opacity: 0.9,
        }
      }
    }),
  },
  primaryButton: {
    backgroundColor: '#444',
  },
  secondaryButton: {
    backgroundColor: '#555',
  },
  tertiaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  }
});

export default LandingPage;