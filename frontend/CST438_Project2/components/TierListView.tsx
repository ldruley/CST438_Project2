import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TierList from '@/components/TierList';
import { Item, Tier, Tierlist } from '@/types/tierlist';

const TierlistView: React.FC = () => {
    const params = useLocalSearchParams();
    const tierlistId = params.id?.toString();
    const router = useRouter();

    const [tierlist, setTierlist] = useState<Tierlist | null>(null);
    const [tiers, setTiers] = useState<Tier[]>([]);
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

                // Create tiers array from the tierlist
                // Note: In a real app, you would need to fetch the actual tiers from your backend
                // For this example, we'll create some placeholder tiers
                const tiersList: Tier[] = [
                    { id: 1, name: "S", color: "#FF5252" },
                    { id: 2, name: "A", color: "#FF9800" },
                    { id: 3, name: "B", color: "#FFEB3B" },
                    { id: 4, name: "C", color: "#8BC34A" },
                    { id: 5, name: "D", color: "#03A9F4" },
                    { id: 6, name: "F", color: "#9C27B0" },
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

            // Group items by tier
            // In a real app, you would group by actual tier IDs from your backend
            const groupedItems: Record<number, Item[]> = {
                1: data.filter(item => item.rank === 1 || item.rank <= 10),
                2: data.filter(item => item.rank > 10 && item.rank <= 20),
                3: data.filter(item => item.rank > 20 && item.rank <= 30),
                4: data.filter(item => item.rank > 30 && item.rank <= 40),
                5: data.filter(item => item.rank > 40 && item.rank <= 50),
                6: data.filter(item => item.rank > 50),
            };

            setItems(groupedItems);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const handleItemMove = async (item: Item, direction: 'up' | 'down') => {
        try {
            const newRank = direction === 'up' ? Math.max(1, item.rank - 1) : item.rank + 1;

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
            // In a real app, you would map the tier ID from the component to your actual tier ID
            // Here we're just using the tier ID directly
            const response = await fetch(`http://localhost:8080/api/items`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    tier: {
                        id: tierId
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

    const handleTierNameChange = async (tierId: number, name: string) => {
        // In a real app, you would implement this to update the tier name in the backend
        console.log(`Updating tier ${tierId} name to ${name}`);

        // Update the local state for immediate feedback
        setTiers(prevTiers =>
            prevTiers.map(tier =>
                tier.id === tierId ? { ...tier, name } : tier
            )
        );
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
                            pathname: "/edit-tierlists/[id]",
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
                    onTierNameChange={handleTierNameChange}
                />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
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
        marginBottom: 16,
        paddingTop: 40, // Add space for status bar
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
    },
});

export default TierlistView;