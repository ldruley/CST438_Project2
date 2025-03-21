import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TierList from '@/components/TierList';
import { Item, Tier, Tierlist, TIER_RANKS, TIER_COLORS } from '@/types/tierlist';

const TierlistView: React.FC = () => {
    const params = useLocalSearchParams();
    const tierlistId = params.id?.toString();
    const router = useRouter();

    const [tierlist, setTierlist] = useState<Tierlist | null>(null);
    const [tiers, setTiers] = useState<Tier[]>([
        { id: 1, name: "S", color: TIER_COLORS["S"] },
        { id: 2, name: "A", color: TIER_COLORS["A"] },
        { id: 3, name: "B", color: TIER_COLORS["B"] },
        { id: 4, name: "C", color: TIER_COLORS["C"] },
        { id: 5, name: "D", color: TIER_COLORS["D"] },
        { id: 6, name: "E", color: TIER_COLORS["E"] },
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

    // Fetch tierlist data when component mounts or tierlistId changes
    useEffect(() => {
        if (!tierlistId || !jwtToken) return;

        const fetchTierlist = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/tiers/${tierlistId}`, {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch tierlist');
                }

                const data: Tierlist = await response.json();
                setTierlist(data);

                // Check if user can edit this tierlist
                if (userId && data.user && data.user.id === userId) {
                    setIsEditable(true);
                }

                // Create standard tiers with IDs 1-7 mapping to S-F
                const tiersList: Tier[] = [
                    { id: 1, name: "S", color: TIER_COLORS["S"] },
                    { id: 2, name: "A", color: TIER_COLORS["A"] },
                    { id: 3, name: "B", color: TIER_COLORS["B"] },
                    { id: 4, name: "C", color: TIER_COLORS["C"] },
                    { id: 5, name: "D", color: TIER_COLORS["D"] },
                    { id: 6, name: "E", color: TIER_COLORS["E"] },
                    { id: 7, name: "F", color: TIER_COLORS["F"] },
                ];
                setTiers(tiersList);

                // Fetch items for each tier
                await fetchItems(tierlistId);
            } catch (error) {
                console.error('Error fetching tierlist:', error);
                Alert.alert('Error', 'Failed to load tierlist');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTierlist();
    }, [tierlistId, jwtToken, userId]);

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

            // Group items by tier/rank (1-7 for S-F)
            const groupedItems: Record<number, Item[]> = {
                1: data.filter(item => item.rank === 1),  // S tier
                2: data.filter(item => item.rank === 2),  // A tier
                3: data.filter(item => item.rank === 3),  // B tier
                4: data.filter(item => item.rank === 4),  // C tier
                5: data.filter(item => item.rank === 5),  // D tier
                6: data.filter(item => item.rank === 6),  // E tier
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
            // S tier (id 1) = rank 1, A tier (id 2) = rank 2, etc.
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
        marginBottom: 16,
        textAlign: 'center',
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