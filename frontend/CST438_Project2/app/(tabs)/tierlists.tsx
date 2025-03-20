import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tierlist } from '@/types/tierlist';

export default function TierlistsScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <TierlistsContent />
        </>
    );
}

interface TierlistItemProps {
    tierlist: Tierlist;
    onPress: (tierlist: Tierlist) => void;
}

const TierlistItem: React.FC<TierlistItemProps> = ({ tierlist, onPress }) => (
    <TouchableOpacity
        style={styles.tierlistItem}
        onPress={() => onPress(tierlist)}
    >
{/*        <View style={[styles.colorIndicator, { backgroundColor: tierlist.color || '#808080' }]} />*/}
        <View style={styles.tierlistInfo}>
            <Text style={styles.tierlistName}>{tierlist.name}</Text>
            {tierlist.description && (
                <Text style={styles.tierlistDescription} numberOfLines={1}>
                    {tierlist.description}
                </Text>
            )}
            <View style={styles.tierlistMeta}>
                <Text style={styles.tierlistOwner}>
                    By: {tierlist.user ? tierlist.user.username : 'Unknown'}
                </Text>
                {tierlist.isPublic && (
                    <View style={styles.publicBadge}>
                        <Text style={styles.publicBadgeText}>Public</Text>
                    </View>
                )}
            </View>
        </View>
    </TouchableOpacity>
);

const TierlistsContent: React.FC = () => {
    const [myTierlists, setMyTierlists] = useState<Tierlist[]>([]);
    const [publicTierlists, setPublicTierlists] = useState<Tierlist[]>([]);
    const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
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
                } else {
                    // If no user ID or token, redirect to login
                    router.replace({
                        pathname: '/login'
                    });
                }
            } catch (error) {
                console.error('Failed to get user info:', error);
            }
        };

        getUserInfo();
    }, []);

    // Fetch tierlists when component mounts or when userId/jwtToken changes
    useEffect(() => {
        if (!userId || !jwtToken) return;

        const fetchTierlists = async () => {
            setIsLoading(true);
            try {
                // Fetch user's tierlists
                const myResponse = await fetch(`http://localhost:8080/api/tiers/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                });

                if (!myResponse.ok) {
                    throw new Error('Failed to fetch my tierlists');
                }

                const myData: Tierlist[] = await myResponse.json();
                setMyTierlists(myData);

                // Fetch public tierlists
                const publicResponse = await fetch('http://localhost:8080/api/tiers/public', {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                });

                if (!publicResponse.ok) {
                    throw new Error('Failed to fetch public tierlists');
                }

                const publicData: Tierlist[] = await publicResponse.json();
                // Filter out the user's own tierlists from public ones to avoid duplication
                const filteredPublicData = publicData.filter(tierlist =>
                    !tierlist.user || tierlist.user.id !== userId
                );
                setPublicTierlists(filteredPublicData);
            } catch (error) {
                console.error('Error fetching tierlists:', error);
                Alert.alert('Error', 'Failed to load tierlists');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTierlists();
    }, [userId, jwtToken]);

    const handleTierlistPress = (tierlist: Tierlist) => {
        router.push({
            pathname: '/tierlist/[id]',
            params: { id: tierlist.id.toString() }
        });
    };

    const handleCreateTierlist = () => {
        router.push({
            pathname: '/create-tierlists'
        });
    };

    const renderItem = ({ item }: { item: Tierlist }) => (
        <TierlistItem
            tierlist={item}
            onPress={handleTierlistPress}
        />
    );

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Tierlists</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateTierlist}>
                    <Text style={styles.createButtonText}>+ Create New</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my' && styles.activeTab]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                        My Tierlists ({myTierlists.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'public' && styles.activeTab]}
                    onPress={() => setActiveTab('public')}
                >
                    <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
                        Public Tierlists ({publicTierlists.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4da6ff" />
                    <Text style={styles.loadingText}>Loading tierlists...</Text>
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'my' ? myTierlists : publicTierlists}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {activeTab === 'my'
                                    ? "You don't have any tierlists yet. Create one!"
                                    : "No public tierlists available."
                                }
                            </Text>
                            {activeTab === 'my' && (
                                <TouchableOpacity
                                    style={styles.emptyCreateButton}
                                    onPress={handleCreateTierlist}
                                >
                                    <Text style={styles.emptyCreateButtonText}>Create Tierlist</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    createButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#4da6ff',
    },
    tabText: {
        color: 'white',
        fontWeight: '500',
    },
    activeTabText: {
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
    },
    tierlistItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
    },
    colorIndicator: {
        width: 10,
    },
    tierlistInfo: {
        flex: 1,
        padding: 16,
    },
    tierlistName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tierlistDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    tierlistMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tierlistOwner: {
        fontSize: 14,
        color: '#888',
    },
    publicBadge: {
        backgroundColor: '#32CD32',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    publicBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    emptyText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    emptyCreateButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    emptyCreateButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});