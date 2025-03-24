import React, {useState, useEffect, useCallback} from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useFocusEffect, useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tierlist } from '@/types/tierlist';
import CompactTierlistView from '@/components/CompactTierlistView';
import { MaterialIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [activeTierlist, setActiveTierlist] = useState<Tierlist | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useFocusEffect(
      useCallback(() => {
        const checkAuthStatus = async () => {
          try {
            const token = await AsyncStorage.getItem('jwtToken');
            const storedUsername = await AsyncStorage.getItem('username');
            const storedUserId = await AsyncStorage.getItem('userId');
            
            if (!token || !storedUserId) {
              console.log('No auth token or user ID found, redirecting to login');
              router.replace('/(tabs)/login');
              return;
            }

            setJwtToken(token);
            setUsername(storedUsername || 'User');
            setUserId(parseInt(storedUserId));
            
            // Check user's admin status directly from the API
            await checkAdminStatus(token);
            await fetchActiveTierlist(token, parseInt(storedUserId));
          } catch (error) {
            console.error('Error checking auth status:', error);
          } finally {
            setIsLoading(false);
          }
        };

        console.log('Welcome screen is focused - refreshing data');
        setIsLoading(true);
        checkAuthStatus();
      }, [])
  );

  const checkAdminStatus = async (token: string) => {
    try {
      console.log("Checking admin status...");
      
      const response = await fetch('http://localhost:8080/api/users/isAdmin', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Admin status response:", data);
        setIsAdmin(data.isAdmin === true);
        
        // Save admin status to AsyncStorage for future use
        await AsyncStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
      } else {
        console.log("Failed to check admin status, response:", response.status);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      setIsAdmin(false);
    }
  };

  const handleCreateTierlist = () => {
    router.push('/create-tierlists');
  };

  const fetchActiveTierlist = async (token: string, uid: number) => {
    try {
      // First check if user has an active tierlist
      const activeResponse = await fetch(`http://localhost:8080/api/users/${uid}/activetier`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!activeResponse.ok) {
        console.log('No active tierlist or error fetching active tierlist ID');
        return;
      }

      const activeData = await activeResponse.json();
      if (!activeData.activeTierlistId) {
        console.log('No active tierlist ID found');
        return;
      }

      // Then fetch the tierlist details
      const tierlistResponse = await fetch(`http://localhost:8080/api/tiers/${activeData.activeTierlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!tierlistResponse.ok) {
        console.log('Error fetching active tierlist details');
        return;
      }

      const tierlistData = await tierlistResponse.json();
      setActiveTierlist(tierlistData);

      console.log('Active tierlist loaded:', tierlistData.name);
    } catch (error) {
      console.error('Error fetching active tierlist:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('jwtToken'),
        AsyncStorage.removeItem('username'),
        AsyncStorage.removeItem('userId'),
        AsyncStorage.removeItem('isAdmin')
      ]);
      router.replace('/(tabs)/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isLoading) {
    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF"/>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </LinearGradient>
    );
  }

  return (
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome, {username}!</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
                style={[styles.headerButton, styles.createButton]}
                onPress={handleCreateTierlist}
            >
              <Text style={styles.headerButtonText}>+ Create New</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.headerButton, styles.publicButton]}
                onPress={() => router.push('/public-tierlists')}
            >
              <Text style={styles.headerButtonText}>Public Lists</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.headerButton, styles.profileButton]}
                onPress={() => router.push('/userProfile')}
            >
              <MaterialIcons name="account-circle" size={18} color="white" />
              <Text style={styles.headerButtonText}>Profile</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                  style={[styles.headerButton, styles.adminButton]}
                  onPress={() => router.push('/admin')}
              >
                <MaterialIcons name="admin-panel-settings" size={18} color="white" />
                <Text style={styles.headerButtonText}>Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}
                    contentContainerStyle={activeTierlist ? styles.contentWithTierlist : styles.contentNoTierlist}>
          {activeTierlist ? (
              <View style={styles.activeTierlistContainer}>
                <View style={styles.tierlistHeader}>
                  <Text style={styles.sectionTitle}>Your Active Tierlist</Text>
                  <View style={styles.headerButtonGroup}>
                    <TouchableOpacity
                        style={[styles.headerButton, styles.viewButton]}
                        onPress={() =>
                            router.push({
                              pathname: '/tierlist/[id]',
                              params: {id: activeTierlist.id.toString()}
                            })
                        }
                    >
                      <Text style={styles.headerButtonText}>View Full</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.tierlistInfoCard}>
                  <Text style={styles.tierlistName}>{activeTierlist.name}</Text>
                  {activeTierlist.description && (
                      <Text style={styles.tierlistDescription}>{activeTierlist.description}</Text>
                  )}

                  <View style={styles.tierlistViewContainer}>
                    <CompactTierlistView
                        tierlistId={activeTierlist.id}
                        jwtToken={jwtToken || ''}
                    />
                  </View>
                </View>
              </View>
          ) : (
              <View style={styles.noActiveTierlistContainer}>
                <Text style={styles.noActiveTierlistText}>You don't have an active tierlist set</Text>
                <TouchableOpacity
                    style={[styles.actionButton, styles.createTierButton]}
                    onPress={() => router.push('/create-tierlists')}
                >
                  <Text style={styles.actionButtonText}>Create a New Tierlist</Text>
                </TouchableOpacity>
              </View>
          )}

          <View style={activeTierlist ? styles.actionsContainer : styles.actionsContainerBottom}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                  style={[styles.actionButton, styles.myListsButton]}
                  onPress={() => router.push('/tierlists')}
              >
                <Text style={styles.actionButtonText}>My Tierlists</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={[styles.actionButton, styles.browseButton]}
                  onPress={() => router.push('/public-tierlists')}
              >
                <Text style={styles.actionButtonText}>Public Lists</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 75,
  },
  contentWithTierlist: {
    paddingBottom: 24,
  },
  contentNoTierlist: {
    flexGrow: 1,
    paddingBottom: 24,
    justifyContent: 'space-between',
    minHeight: '85%',
  },
  actionsContainerBottom: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  activeTierlistContainer: {
    marginBottom: 24,
  },
  tierlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtonGroup: {
    flexDirection: 'row',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: '#4da6ff',
  },
  publicButton: {
    backgroundColor: '#FF9800',
  },
  profileButton: {
    backgroundColor: '#8BC34A',
  },
  adminButton: {
    backgroundColor: '#9c27b0',
  },
  viewButton: {
    backgroundColor: '#4da6ff',
  },
  createButtonSmall: {
    backgroundColor: '#32CD32',
  },
  tierlistInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderColor: '#4da6ff',
    borderWidth: 2,
  },
  tierlistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tierlistDescription: {
    color: '#e0e0e0',
    marginBottom: 12,
    fontSize: 14,
  },
  tierlistViewContainer: {
    height: 375,
    marginTop: 8,
  },
  createTierButton: {
    backgroundColor: '#4da6ff',
    width: '15%',
    marginBottom: 12,
    marginTop:12,
  },
  noActiveTierlistContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  noActiveTierlistText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 80,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  myListsButton: {
    backgroundColor: '#8BC34A',
  },
  browseButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});