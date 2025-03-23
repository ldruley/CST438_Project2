import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TierList from '@/components/TierList';
import { Item, Tier, Tierlist, TIER_RANKS, TIER_COLORS } from '@/types/tierlist';

const TierlistView: React.FC = () => {
    const params = useLocalSearchParams();
    const tierlistId = params.id?.toString();
    const router = useRouter();

    const [tierlist, setTierlist] = useState<Tierlist | null>(null);
    const [tiers, setTiers] = useState<Tier[]>([
        { id: 1, name: "S+", color: TIER_COLORS["S+"] },
        { id: 2, name: "S", color: TIER_COLORS["S"] },
        { id: 3, name: "A", color: TIER_COLORS["A"] },
        { id: 4, name: "B", color: TIER_COLORS["B"] },
        { id: 5, name: "C", color: TIER_COLORS["C"] },
        { id: 6, name: "D", color: TIER_COLORS["D"] },
        { id: 7, name: "F", color: TIER_COLORS["F"] },
    ]);
    const [items, setItems] = useState<Record<number, Item[]>>({});
    const [isEditable, setIsEditable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<number | null>(null);
    const [jwtToken, setJwtToken] = useState('');

    // Fetch user ID and JWT token on component mount
    useEffect(() => {
        const getUserInfo = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                const token = await AsyncStorage.getItem('jwtToken');

                if (storedUserId && token) {
                    setUserId(parseInt(storedUserId, 10));
                    setJwtToken(token);
                }
            } catch (error) {
                console.error('Failed to get user info:', error);
            }
        };

        getUserInfo();
    }, []);

    // Use useFocusEffect to refresh the tierlist data whenever the screen is focused
    useFocusEffect(
        useCallback(() => {
            const loadTierlistData = async () => {
                if (tierlistId && jwtToken) {
                    setIsLoading(true);
                    try {
                        await fetchTierlist();
                    } catch (error) {
                        console.error('Error in useFocusEffect:', error);
                    } finally {
                        setIsLoading(false);
                    }
                }
            };

            loadTierlistData();
        }, [tierlistId, jwtToken, userId])
    );

    // Fetch tierlist data
    const fetchTierlist = async () => {
        if (!tierlistId || !jwtToken) return;

        try {
            console.log('Fetching tierlist data for ID:', tierlistId);
            const response = await fetch(`http://localhost:8080/api/tiers/${tierlistId}`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tierlist');
            }

            const data: Tierlist = await response.json();
            console.log('Fetched tierlist data:', data);
            setTierlist(data);

            // Check if user can edit this tierlist
            if (userId && data.user && data.user.id === userId) {
                setIsEditable(true);
            } else {
                setIsEditable(false);
            }

            // Fetch items for the tierlist
            await fetchItems(tierlistId);
        } catch (error) {
            console.error('Error fetching tierlist:', error);
            Alert.alert('Error', 'Failed to load tierlist');
        }
    };

    const fetchItems = async (tierId: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/tiers/${tierId}/items`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }

            const data: Item[] = await response.json();

            // Group items by tier/rank (1-7 for S+, S, A, B, C, D, F)
            const groupedItems: Record<number, Item[]> = {
                1: data.filter(item => item.rank === 1),  // S+ tier
                2: data.filter(item => item.rank === 2),  // S tier
                3: data.filter(item => item.rank === 3),  // A tier
                4: data.filter(item => item.rank === 4),  // B tier
                5: data.filter(item => item.rank === 5),  // C tier
                6: data.filter(item => item.rank === 6),  // D tier
                7: data.filter(item => item.rank === 7),  // F tier
            };

            setItems(groupedItems);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const handleItemMove = async (item: Item, direction: 'up' | 'down') => {
        try {
            const newRank = direction === 'up' ? Math.max(1, item.rank - 1) : Math.min(7, item.rank + 1);

            const response = await fetch(`http://localhost:8080/api/items/${item.id}/rank/${newRank}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to move item');
            }

            // Refresh items
            if (tierlistId) {
                await fetchItems(tierlistId);
            }
        } catch (error) {
            console.error('Error moving item:', error);
            Alert.alert('Error', 'Failed to move item');
        }
    };

    const handleItemDelete = async (item: Item) => {
        try {
            const response = await fetch(`http://localhost:8080/api/items/${item.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete item');
            }

            // Refresh items
            if (tierlistId) {
                await fetchItems(tierlistId);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
        }
    };

    const handleItemAdd = async (tierId: number, name: string) => {
        try {
            // The tierId in our component corresponds directly to the rank in the database
            // S+ tier (id 1) = rank 1, S tier (id 2) = rank 2, etc.
            const response = await fetch(`http://localhost:8080/api/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    rank: tierId,
                    tier: {
                        id: parseInt(tierlistId || '0')
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add item');
            }

            // Refresh items
            if (tierlistId) {
                await fetchItems(tierlistId);
            }
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', 'Failed to add item');
        }
    };

    if (isLoading) {
        return (
            <LinearGradient colors={['#000000', '#808080']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading tierlist...</Text>
            </LinearGradient>
        );
    }

    if (!tierlist) {
        return (
            <LinearGradient colors={['#000000', '#808080']} style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Tierlist not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{tierlist.name}</Text>
                {isEditable && (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => tierlistId && router.push({
                            pathname: '/edit-tierlist/[id]',
                            params: { id: tierlistId }
                        })}
                    >
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {tierlist.description && (
                <Text style={styles.description}>{tierlist.description}</Text>
            )}

            {/* Display public/private status */}
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, tierlist.isPublic ? styles.publicStatus : styles.privateStatus]}>
                    {tierlist.isPublic ? 'Public' : 'Private'} Tierlist
                </Text>
            </View>

            <View style={styles.tierListContainer}>
                <TierList
                    tiers={tiers}
                    items={items}
                    isEditable={isEditable}
                    onItemMove={handleItemMove}
                    onItemDelete={handleItemDelete}
                    onItemAdd={handleItemAdd}
                />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24, // Increased horizontal padding for the entire view
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#e0e0e0',
        marginBottom: 12,
        textAlign: 'center',
    },
    statusContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    publicStatus: {
        backgroundColor: '#32CD32',
        color: 'white',
    },
    privateStatus: {
        backgroundColor: '#FF9800',
        color: 'white',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#4da6ff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: '#4da6ff',
        padding: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tierListContainer: {
        flex: 1,
        paddingBottom: 10,
    },
});

export default TierlistView;