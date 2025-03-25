import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tierlist } from '@/types/tierlist';
import TierlistCard from '@/components/TierlistCard';
import CustomAlert from '@/components/CustomAlert';
import API_CONFIG from "@/config/api";

const PublicTierlistsScreen = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [publicTierlists, setPublicTierlists] = useState<Tierlist[]>([]);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

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
            console.log('Public tierlists screen focused - refreshing data');
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

                            // Now fetch public tierlists
                            await fetchPublicTierlists(token);
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
                        router.replace('/login');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    showAlert('Error', 'Failed to fetch user data', [{ text: 'OK', onPress: () => {} }]);
                    setJwtToken(null);
                    setUserId(null);
                    setIsLoading(false);
                }
            };

            fetchUserData();
        }, [])
    );

    const fetchPublicTierlists = async (token: string) => {
        try {
            console.log(`Fetching public tierlists with token: ${token?.substring(0, 10)}...`);

            // Fetch public tierlists
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/tiers/public`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: "cors",
            });

            const responseText = await response.text();
            console.log(`Response status: ${response.status}`);
            console.log(`Response body: ${responseText.substring(0, 100)}...`);

            if (response.ok) {
                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log(`Parsed ${data.length} public tierlists`);
                    setPublicTierlists(data);
                } catch (parseError) {
                    console.error('Error parsing response as JSON:', parseError);
                    showAlert('Error', 'Failed to parse server response', [{ text: 'OK', onPress: () => {} }]);
                    setPublicTierlists([]);
                }
            } else {
                console.error('Failed to fetch public tierlists:', response.status, response.statusText);
                showAlert('Error', `Failed to fetch public tierlists: ${response.status}`, [{ text: 'OK', onPress: () => {} }]);
                setPublicTierlists([]);
            }
        } catch (error) {
            console.error('Error fetching public tierlists:', error);
            showAlert('Error', `Network error: ${error instanceof Error ? error.message : String(error)}`, [{ text: 'OK', onPress: () => {} }]);
            setPublicTierlists([]);
        } finally {
            setIsLoading(false);
        }
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
                <Text style={styles.loadingText}>Loading public tierlists...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Public Tierlists</Text>
                <View style={{width: 60}} />
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.listContainer}>
                    {publicTierlists.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No public tierlists available.</Text>
                            <Text style={styles.emptySubtext}>Check back later or create your own!</Text>
                            <TouchableOpacity
                                style={styles.emptyCreateButton}
                                onPress={() => router.push('/create-tierlists')}
                            >
                                <Text style={styles.emptyCreateButtonText}>Create Tierlist</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Using TierlistCard to display public tierlists
                        <View>
                            {publicTierlists.map(tierlist => (
                                <TierlistCard
                                    key={tierlist.id}
                                    tierlist={tierlist}
                                    onPress={() => handleViewTierlist(tierlist.id)}
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
        paddingHorizontal: 30,
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
        padding: 16,
        paddingTop: 30,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#4da6ff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 120,
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
});

export default PublicTierlistsScreen;