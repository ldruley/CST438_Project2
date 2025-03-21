import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TIER_COLORS, Tierlist} from '@/types/tierlist';

const TierlistsScreen: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [tierlists, setTierlists] = useState<Tierlist[]>([]);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    // Fetch user data and JWT token on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('Fetching user data from AsyncStorage...');
                const token = await AsyncStorage.getItem('jwtToken');
                const storedUserId = await AsyncStorage.getItem('userId');

                console.log(`Token exists: ${!!token}, User ID exists: ${!!storedUserId}`);

                if (token) {
                    setJwtToken(token);
                    if (storedUserId) {
                        setUserId(parseInt(storedUserId));
                    } else {
                        console.log('No user ID found in storage');
                        setUserId(null);
                    }
                } else {
                    console.log('No JWT token found, redirecting to login');
                    setJwtToken(null);
                    setUserId(null);
                    // If no token, redirect to login
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setJwtToken(null);
                setUserId(null);
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch tierlists when token is available
    useEffect(() => {
        if (jwtToken && userId) {
            fetchTierlists();
        } else if (jwtToken === null && userId === null) {
            // Still loading user data
        } else {
            // We have attempted to load token/userId but they don't exist
            setIsLoading(false);
        }
    }, [jwtToken, userId]);

    const fetchTierlists = async () => {
        setIsLoading(true);
        try {
            console.log(`Fetching tierlists for user ID: ${userId} with token: ${jwtToken?.substring(0, 10)}...`);

            // Fetch user's tierlists
            const response = await fetch(`http://localhost:8080/api/tiers/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
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
                    setTierlists([]);
                }
            } else {
                console.error('Failed to fetch tierlists:', response.status, response.statusText);
                setTierlists([]);
            }
        } catch (error) {
            console.error('Error fetching tierlists:', error);
            setTierlists([]);
        } finally {
            setIsLoading(false);
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
                <TouchableOpacity
                    style={styles.debugButton}
                    onPress={() => {
                        console.log('Debug button pressed, forcing state update');
                        setIsLoading(false);
                    }}
                >
                    <Text style={styles.debugButtonText}>Debug: Skip Loading</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Tierlists</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateTierlist}>
                    <Text style={styles.createButtonText}>+ Create New</Text>
                </TouchableOpacity>
            </View>

            {tierlists.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>You haven't created any tierlists yet.</Text>
                    <Text style={styles.emptySubtext}>Create your first tierlist to get started!</Text>
                    <TouchableOpacity style={styles.emptyCreateButton} onPress={handleCreateTierlist}>
                        <Text style={styles.emptyCreateButtonText}>Create Tierlist</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={tierlists}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.tierlistCard}
                            onPress={() => handleViewTierlist(item.id)}
                        >
                            <View style={styles.tierlistHeader}>
                                <Text style={styles.tierlistName}>{item.name}</Text>
                                {item.isPublic && (
                                    <View style={styles.publicBadge}>
                                        <Text style={styles.publicText}>Public</Text>
                                    </View>
                                )}
                            </View>
                            {item.description && (
                                <Text style={styles.tierlistDescription}>{item.description}</Text>
                            )}
                            <View style={styles.tierPreview}>
                                {Object.entries(TIER_COLORS).slice(0, 5).map(([tier, color]) => (
                                    <View key={tier} style={[styles.tierDot, { backgroundColor: color }]}>
                                        <Text style={styles.tierDotText}>{tier}</Text>
                                    </View>
                                ))}
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </LinearGradient>
    );
};

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
        padding: 16,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
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
    listContent: {
        padding: 16,
    },
    tierlistCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    tierlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tierlistName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    publicBadge: {
        backgroundColor: '#32CD32',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    publicText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tierlistDescription: {
        color: '#e0e0e0',
        marginBottom: 12,
    },
    tierPreview: {
        flexDirection: 'row',
        marginTop: 8,
    },
    tierDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    tierDotText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
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
    debugButton: {
        marginTop: 20,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        padding: 10,
        borderRadius: 5,
    },
    debugButtonText: {
        color: 'white',
    },
});

export default TierlistsScreen;