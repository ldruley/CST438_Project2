import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tierlist } from '@/types/tierlist';
import CompactTierlistView from '@/components/CompactTierlistView';
import TierlistCard from '@/components/TierlistCard';
import CustomAlert from '@/components/CustomAlert';

const TierlistsScreen: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [tierlists, setTierlists] = useState<Tierlist[]>([]);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [activeTierlistId, setActiveTierlistId] = useState<number | null>(null);
    const [activeTierlist, setActiveTierlist] = useState<Tierlist | null>(null);

    // Alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [] as {
            text: string;
            style?: 'default' | 'cancel' | 'destructive';
            onPress: () => void;
        }[],
    });

    // Helper function to show alerts
    const showAlert = (title: string, message: string, buttons: any[]) => {
        setAlertConfig({
            title,
            message,
            buttons,
        });
        setAlertVisible(true);
    };

    useFocusEffect(
        useCallback(() => {
            console.log('Tierlists screen focused - refreshing data');
            setIsLoading(true);

            const fetchUserData = async () => {
                try {
                    console.log('Fetching user data from AsyncStorage...');
                    const token = await AsyncStorage.getItem('jwtToken');
                    const storedUserId = await AsyncStorage.getItem('userId');

                    console.log(`Token exists: ${!!token}, User ID exists: ${!!storedUserId}`);

                    if (token) {
                        setJwtToken(token);
                        if (storedUserId) {
                            const parsedUserId = parseInt(storedUserId);
                            setUserId(parsedUserId);

                            // Now fetch the tierlists and active tierlist
                            await Promise.all([
                                fetchTierlists(token, parsedUserId),
                                fetchActiveTierlist(token, parsedUserId)
                            ]);
                        } else {
                            console.log('No user ID found in storage');
                            setUserId(null);
                            setIsLoading(false);
                        }
                    } else {
                        console.log('No JWT token found, redirecting to login');
                        setJwtToken(null);
                        setUserId(null);
                        setIsLoading(false);
                        // If no token, redirect to login
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    showAlert('Error', 'Failed to load user data', [{ text: 'OK', onPress: () => {} }]);
                    setJwtToken(null);
                    setUserId(null);
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }, [])
    );

    const fetchTierlists = async (token: string, uid: number) => {
        try {
            console.log(`Fetching tierlists for user ID: ${uid} with token: ${token?.substring(0, 10)}...`);

            // Fetch user's tierlists
            const response = await fetch(`http://localhost:8080/api/tiers/user/${uid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
            });

            const responseText = await response.text();
            console.log(`Response status: ${response.status}`);
            console.log(`Response body: ${responseText.substring(0, 100)}...`);

            if (response.ok) {
                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log(`Parsed ${data.length} tierlists`);
                    setTierlists(data);
                } catch (parseError) {
                    console.error('Error parsing response as JSON:', parseError);
                    showAlert('Error', 'Failed to parse server response', [{ text: 'OK', onPress: () => {} }]);
                    setTierlists([]);
                }
            } else {
                console.error('Failed to fetch tierlists:', response.status, response.statusText);
                showAlert('Error', `Server error: ${response.status}`, [{ text: 'OK', onPress: () => {} }]);
                setTierlists([]);
            }
        } catch (error) {
            console.error('Error fetching tierlists:', error);
            showAlert('Error', `Network error: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK', onPress: () => {} }]);
            setTierlists([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActiveTierlist = async (token: string, uid: number) => {
        try {
            // First check if user has an active tierlist
            const response = await fetch(`http://localhost:8080/api/users/${uid}/activetier`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.activeTierlistId) {
                    setActiveTierlistId(data.activeTierlistId);
                    console.log(`Active tierlist ID: ${data.activeTierlistId}`);

                    // Fetch the actual tierlist details
                    const tierlistResponse = await fetch(`http://localhost:8080/api/tiers/${data.activeTierlistId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (tierlistResponse.ok) {
                        const tierlistData = await tierlistResponse.json();
                        setActiveTierlist(tierlistData);
                        console.log('Active tierlist loaded:', tierlistData.name);
                    } else {
                        setActiveTierlist(null);
                        showAlert('Warning', 'Could not load active tierlist details', [{ text: 'OK', onPress: () => {} }]);
                    }
                } else {
                    setActiveTierlistId(null);
                    setActiveTierlist(null);
                }
            } else {
                setActiveTierlistId(null);
                setActiveTierlist(null);
                showAlert('Warning', 'Could not retrieve active tierlist information', [{ text: 'OK', onPress: () => {} }]);
            }
        } catch (error) {
            console.error('Error fetching active tierlist:', error);
            setActiveTierlistId(null);
            setActiveTierlist(null);
            showAlert('Error', `Failed to fetch active tierlist: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK', onPress: () => {} }]);
        }
    };

    const handleSetActiveTierlist = async (tierlistId: number) => {
        try {
            console.log(`Setting tierlist ${tierlistId} as active for user ${userId}`);

            showAlert(
                'Confirm Action',
                'Are you sure you want to set this tierlist as your active tierlist?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {}
                    },
                    {
                        text: 'Set as Active',
                        onPress: async () => {
                            try {
                                const response = await fetch(`http://localhost:8080/api/users/${userId}/activetier/${tierlistId}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `Bearer ${jwtToken}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                if (response.ok) {
                                    setActiveTierlistId(tierlistId);

                                    const selectedTierlist = tierlists.find(t => t.id === tierlistId);
                                    if (selectedTierlist) {
                                        setActiveTierlist(selectedTierlist);
                                    }

                                    // After setting active, refresh the tierlist details
                                    if (jwtToken && userId) {
                                        await fetchActiveTierlist(jwtToken, userId);
                                    }

                                    showAlert('Success', 'Active tierlist updated successfully', [{ text: 'OK', onPress: () => {} }]);
                                } else {
                                    console.error('Failed to update active tierlist');
                                    showAlert('Error', 'Failed to update active tierlist', [{ text: 'OK', onPress: () => {} }]);
                                }
                            } catch (error) {
                                console.error('Error setting active tierlist:', error);
                                showAlert('Error', `Network error: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK', onPress: () => {} }]);
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error in handleSetActiveTierlist:', error);
            showAlert('Error', 'An unexpected error occurred', [{ text: 'OK', onPress: () => {} }]);
        }
    };

    const handleCreateTierlist = () => {
        router.push('/create-tierlists');
    };

    const handleViewTierlist = (id: number) => {
        router.push({
            pathname: '/tierlist/[id]',
            params: { id: id.toString() }
        });
    };

    if (isLoading) {
        return (
            <LinearGradient colors={['#000000', '#808080']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading your tierlists...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Tierlists</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={[styles.headerButton, styles.publicButton]}
                        onPress={() => router.push('/public-tierlists')}
                    >
                        <Text style={styles.headerButtonText}>Public Lists</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerButton, styles.createButton]}
                        onPress={handleCreateTierlist}
                    >
                        <Text style={styles.headerButtonText}>+ Create New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                {/* Show Active Tierlist Section */}
                {activeTierlist && activeTierlistId && jwtToken && (
                    <View style={styles.activeTierlistSection}>
                        <View style={styles.activeTierlistHeader}>
                            <Text style={styles.activeTierlistTitle}>Active Tierlist: {activeTierlist.name}</Text>

                            <View style={styles.activeRightSection}>
                                {activeTierlist.isPublic && (
                                    <View style={styles.publicBadgeActive}>
                                        <Text style={styles.publicText}>Public</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.viewActiveButton}
                                    onPress={() => handleViewTierlist(activeTierlistId)}
                                >
                                    <Text style={styles.viewActiveButtonText}>View Full</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.compactViewContainer}>
                            <CompactTierlistView
                                tierlistId={activeTierlistId}
                                jwtToken={jwtToken}
                            />
                        </View>
                    </View>
                )}


                <View style={styles.listContainer}>
                    <Text style={styles.subTitle}>All Your Tierlists</Text>

                    {/* Filter out the active tierlist from the list */}
                    {(activeTierlistId ? tierlists.filter(t => t.id !== activeTierlistId) : tierlists).length === 0 ? (
                        <View style={styles.emptyContainer}>
                            {activeTierlistId ? (
                                <>
                                    <Text style={styles.emptyText}>You've only created 1 tierlist!</Text>
                                    <Text style={styles.emptySubtext}>Add more Tierlists below!</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.emptyText}>You haven't created any tierlists yet.</Text>
                                    <Text style={styles.emptySubtext}>Create your first tierlist to get started!</Text>
                                </>
                            )}
                            <TouchableOpacity style={styles.emptyCreateButton} onPress={handleCreateTierlist}>
                                <Text style={styles.emptyCreateButtonText}>Create Tierlist</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Using TierlistCard component to display each tierlist
                        <View>
                            {(activeTierlistId ? tierlists.filter(t => t.id !== activeTierlistId) : tierlists).map(tierlist => (
                                <TierlistCard
                                    key={tierlist.id}
                                    tierlist={tierlist}
                                    isActive={tierlist.id === activeTierlistId}
                                    userId={userId}
                                    onPress={() => handleViewTierlist(tierlist.id)}
                                    onSetActive={() => handleSetActiveTierlist(tierlist.id)}
                                    onEdit={() => router.push({
                                        pathname: '/edit-tierlist/[id]',
                                        params: { id: tierlist.id.toString() }
                                    })}
                                />
                            ))}

                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Custom Alert */}
            <CustomAlert
                isVisible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onBackdropPress={() => setAlertVisible(false)}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal:120,
        paddingVertical: 24,
    },
    scrollContent: {
        paddingBottom: 24,
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    subTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        marginHorizontal: 16,
    },
    createButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    headerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 8,
    },
    headerButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    publicButton: {
        backgroundColor: '#FF9800',
    },
    activeTierlistSection: {
        backgroundColor: 'rgba(77, 166, 255, 0.1)',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 10,
        borderColor: '#4da6ff',
        borderWidth: 2,
        padding: 12,
    },
    activeTierlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeTierlistTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    viewActiveButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    viewActiveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    compactViewContainer: {
        height: 375,
        borderRadius: 8,
        overflow: 'hidden',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal:16,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 16,
        color: '#e0e0e0',
        marginBottom: 24,
        textAlign: 'center',
    },
    emptyCreateButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    emptyCreateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    activeRightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    publicBadgeActive: {
        backgroundColor: '#32CD32',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    publicText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default TierlistsScreen;