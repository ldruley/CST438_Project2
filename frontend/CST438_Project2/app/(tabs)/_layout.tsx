import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define the type for SFSymbols to fix the icon error
type SFSymbol = 'house.fill' | 'list.bullet' | 'star.fill' | 'person.fill' | 'lock.fill';

// Define navigation items for the menu
const regularNavigationItems = [
  { name: 'home', title: 'Home', icon: 'house.fill' as SFSymbol },
  { name: 'tierlists', title: 'Your Tier Lists', icon: 'list.bullet' as SFSymbol },
  { name: 'public-tierlists', title: 'Public Tier Lists', icon: 'list.bullet' as SFSymbol },
  { name: 'welcome', title: 'Tier List', icon: 'star.fill' as SFSymbol },
  { name: 'userProfile', title: 'User Profile', icon: 'person.fill' as SFSymbol },

];

// Admin navigation item that will be conditionally added
const adminNavigationItem = { name: 'admin', title: 'Admin Panel', icon: 'lock.fill' as SFSymbol };

// Dark theme colors
const darkThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  accent: '#BB86FC',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  danger: '#CF6679', 
};

// Custom header with expandable menu component
function ExpandableMenuHeader() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Enhanced logout handler with better error handling and UI feedback
  const handleLogout = () => {
    // First trigger navigation
    router.replace('/');
    
    // Then clear storage and do server logout
    setTimeout(() => {
      AsyncStorage.clear()
        .then(() => console.log('Storage cleared'))
        .catch(err => console.error('Storage clear error:', err));
        
      AsyncStorage.getItem('jwtToken')
        .then(token => {
          if (token) {
            fetch('http://localhost:8080/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        })
        .catch(err => console.error('Token retrieval error:', err));
    }, 100);
  };
  
  // Check admin status 
  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  const checkAdminStatus = async () => {
    try {
      console.log("Checking admin status...");
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log("Token exists:", !!token);
      
      if (!token) {
        console.log("No authentication token found");
        setIsAdmin(false);
        return;
      }
      
      const response = await fetch('http://localhost:8080/api/users/isAdmin', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Admin check response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Admin status response:", data);
        setIsAdmin(data.isAdmin);
      } else {
        console.log("Not an admin or error checking status");
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  };
  
  // Get the current navigation items based on admin status
  const getNavigationItems = () => {
    return isAdmin 
      ? [...regularNavigationItems, adminNavigationItem]
      : regularNavigationItems;
  };
  
  // Toggle menu function with enhanced animation
  const toggleMenu = () => {
    const currentItems = getNavigationItems();
    // Calculate target height based on number of menu items
    const itemHeight = 50; // Approximate height of each menu item
    const totalHeight = currentItems.length * itemHeight;
    
    console.log("Toggling menu. Items:", currentItems.length, "Total height:", totalHeight);
    
    // Animate to new height
    Animated.timing(animatedHeight, {
      toValue: menuOpen ? 0 : totalHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setMenuOpen(!menuOpen);
  };
  
  const navigateTo = (screen: string) => {
    // Handle different route formats
    if (screen.startsWith('/')) {
      router.push(screen as any);
    } else {
      router.push(`/${screen}` as any);
    }
    toggleMenu(); // Close menu after navigation
  };
  
  // Determine if a navigation item is active
  const isActive = (routeName: string) => {
    if (!pathname) return false;
    // Remove leading slash and get the first segment of the path
    const currentRoute = pathname.substring(1).split('/')[0] || '';
    return currentRoute === routeName;
  };

  const currentItems = getNavigationItems();

  return (
    <View style={styles.container}>
      {/* Dark themed header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: darkThemeColors.background,
          borderBottomColor: darkThemeColors.borderColor,
        }
      ]}>
        <Text style={[styles.title, { color: darkThemeColors.text }]}>Rankify</Text>
        <View style={styles.headerControls}>
          {/* Logout Button */}
          <TouchableOpacity 
            onPress={handleLogout}
            disabled={isLoggingOut} 
            style={[
              styles.logoutButton,
              isLoggingOut && styles.disabledButton
            ]}
            activeOpacity={0.7}
          >
            <Text style={{ 
              color: isLoggingOut ? 'rgba(207, 102, 121, 0.5)' : darkThemeColors.danger, 
              fontWeight: 'bold' 
            }}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
          
          {/* Menu Button */}
          <TouchableOpacity 
            onPress={toggleMenu} 
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
            {/* Simplified hamburger icon that changes based on menu state */}
              {menuOpen ? (
                <Text style={{ fontSize: 24, color: darkThemeColors.text }}>✕</Text>
              ) : (
                <>
                  <View style={[styles.menuIconBar, { backgroundColor: darkThemeColors.text }]} />
                  <View style={[styles.menuIconBar, { backgroundColor: darkThemeColors.text }]} />
                  <View style={[styles.menuIconBar, { backgroundColor: darkThemeColors.text }]} />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dark themed expandable menu */}
      <Animated.View style={[
        styles.menuContainer,
        {
          height: animatedHeight,
          backgroundColor: darkThemeColors.surface,
          borderBottomColor: darkThemeColors.borderColor,
          overflow: 'hidden',
        }
      ]}>
        {currentItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.menuItem,
              {
                borderBottomColor: darkThemeColors.borderColor,
              },
              isActive(item.name) && {
                backgroundColor: 'rgba(187, 134, 252, 0.12)',
              }
            ]}
            onPress={() => navigateTo(item.name)}
            activeOpacity={0.7}
          >
            <IconSymbol 
              size={24} 
              name={item.icon} 
              color={isActive(item.name) 
                ? darkThemeColors.accent 
                : darkThemeColors.text} 
            />
            <Text 
              style={[
                styles.menuItemText, 
                { 
                  color: isActive(item.name) 
                    ? darkThemeColors.accent 
                    : darkThemeColors.text,
                  fontWeight: isActive(item.name) ? 'bold' : 'normal'
                }
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

// Main layout component
export default function AppLayout() {
  return (
    <Stack 
      screenOptions={{ 
        header: () => <ExpandableMenuHeader />,
        contentStyle: { backgroundColor: darkThemeColors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" />
      <Stack.Screen name="userTierList" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="user" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="createAccount" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    width: '100%', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.5)',
    minWidth: 65,
    alignItems: 'center',
  },
  disabledButton: {
    borderColor: 'rgba(207, 102, 121, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuButton: {
    padding: 8,
  },
  menuIconContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuIconBar: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  menuContainer: {
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
  },
});