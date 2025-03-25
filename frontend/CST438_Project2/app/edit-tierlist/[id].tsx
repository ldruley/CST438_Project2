import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tierlist } from '@/types/tierlist';
import CustomAlert from '@/components/CustomAlert';
import API_CONFIG from "@/config/api"; // Import the custom alert component

export default function EditTierlistScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <EditTierlistContent />
        </>
    );
}

const EditTierlistContent: React.FC = () => {
    const params = useLocalSearchParams();
    const tierlistId = params.id?.toString();
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingActive, setIsSettingActive] = useState(false);
    const [isActiveTierlist, setIsActiveTierlist] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [jwtToken, setJwtToken] = useState('');

    // State for custom alert
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

    // Fetch user ID and JWT token on component mount
    useEffect(() => {
        const getUserInfo = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                const token = await AsyncStorage.getItem('jwtToken');

                if (storedUserId && token) {
                    setUserId(parseInt(storedUserId));
                    setJwtToken(token);
                } else {
                    // If no user ID or token, redirect to login
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Failed to get user info:', error);
            }
        };

        getUserInfo();
    }, []);

    // Fetch tierlist data when component mounts or tierlistId changes
    useEffect(() => {
        if (!tierlistId || !jwtToken || !userId) return;

        const fetchTierlist = async () => {
            setIsLoading(true);
            try {
                // Fetch tierlist data
                const response = await fetch(`${API_CONFIG.BASE_URL}/api/tiers/${tierlistId}`, {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch tierlist');
                }

                const data: Tierlist = await response.json();
                console.log('Fetched tierlist data:', data);

                // Check if user is the owner
                if (userId && data.user && data.user.id !== userId) {
                    showAlert('Error', 'You do not have permission to edit this tierlist', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                    return;
                }

                setName(data.name);
                setDescription(data.description || '');
                // Make sure to properly initialize isPublic from the data
                setIsPublic(data.isPublic === true);
                console.log('Setting isPublic to:', data.isPublic);

                // Check if this is the active tierlist
                const activeResponse = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}/activetier`, {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                    },
                });

                if (activeResponse.ok) {
                    const activeData = await activeResponse.json();
                    if (activeData.activeTierlistId && activeData.activeTierlistId.toString() === tierlistId) {
                        setIsActiveTierlist(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching tierlist:', error);
                showAlert('Error', 'Failed to load tierlist', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTierlist();
    }, [tierlistId, jwtToken, userId]);

    // Helper function to show alerts
    const showAlert = (title: string, message: string, buttons: any[]) => {
        setAlertConfig({
            title,
            message,
            buttons,
        });
        setAlertVisible(true);
    };

    const handleSetActiveList = async () => {
        if (!userId || !tierlistId) {
            showAlert('Error', 'Unable to set active tierlist', [{ text: 'OK', onPress: () => {} }]);
            return;
        }

        setIsSettingActive(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}/activetier/${tierlistId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to set active tierlist');
            }

            setIsActiveTierlist(true);
            showAlert('Success', 'This tierlist is now your active tierlist', [{ text: 'OK', onPress: () => {} }]);
        } catch (error) {
            console.error('Error setting active tierlist:', error);
            showAlert('Error', 'Failed to set active tierlist', [{ text: 'OK', onPress: () => {} }]);
        } finally {
            setIsSettingActive(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            showAlert('Error', 'Please enter a tierlist name', [{ text: 'OK', onPress: () => {} }]);
            return;
        }

        if (!tierlistId) {
            showAlert('Error', 'Tierlist ID is missing', [{ text: 'OK', onPress: () => {} }]);
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Updating tierlist with the following data:');
            console.log('Name:', name);
            console.log('Description:', description);
            console.log('isPublic:', isPublic);

            // Update the tierlist
            const tierlistResponse = await fetch(`${API_CONFIG.BASE_URL}/api/tiers/${tierlistId}`, {
                method: 'PATCH', // Using PATCH instead of PUT to update only specific fields
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    isPublic
                }),
            });

            const responseText = await tierlistResponse.text();
            console.log('Response status:', tierlistResponse.status);
            console.log('Response body:', responseText);

            if (!tierlistResponse.ok) {
                throw new Error('Failed to update tierlist: ' + responseText);
            }

            showAlert('Success', 'Tierlist updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating tierlist:', error);
            showAlert('Error', `Failed to update tierlist: ${error instanceof Error ? error.message : String(error)}`, [
                { text: 'OK', onPress: () => {} }
            ]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = () => {
        console.log('Opening delete confirmation dialog');

        showAlert(
            'Delete Tierlist',
            'Are you sure you want to delete this tierlist? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Delete canceled')
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => performDelete()
                },
            ]
        );
    };

    const performDelete = async () => {
        if (!tierlistId || !jwtToken) {
            console.error('Missing tierlist ID or authorization');
            return;
        }

        console.log('Starting delete operation');
        setIsDeleting(true);

        try {
            console.log('Deleting tierlist with ID:', tierlistId);

            // Check if tierlist has items
            const itemsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/tiers/${tierlistId}/items`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                },
            });

            if (itemsResponse.ok) {
                const items = await itemsResponse.json();
                if (items && items.length > 0) {
                    // If there are items, we need to delete them first
                    console.log(`Tierlist has ${items.length} items. Deleting items first...`);

                    // Delete items one by one
                    for (const item of items) {
                        await fetch(`${API_CONFIG.BASE_URL}/api/items/${item.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${jwtToken}`,
                            },
                        });
                    }
                }
            }

            // Now delete the tierlist
            console.log('Sending DELETE request to endpoint...');
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/tiers/${tierlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                },
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error text from server:', errorText);
                throw new Error(errorText || 'Failed to delete tierlist');
            }

            console.log('Tierlist deleted successfully!');

            // Show success alert and redirect to tierlists page
            showAlert('Success', 'Tierlist deleted successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        console.log('Navigating to tierlists page...');
                        // Redirect to the tierlists page instead of the home page
                        router.replace('/tierlists');
                    },
                }
            ]);
        } catch (error) {
            console.error('Error deleting tierlist:', error);
            showAlert('Error', `Failed to delete tierlist: ${error instanceof Error ? error.message : String(error)}`, [
                { text: 'OK', onPress: () => {} }
            ]);
        } finally {
            setIsDeleting(false);
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

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Edit Tierlist</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <Text style={styles.label}>Tierlist Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter tierlist name"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter a description"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#999"
                    />

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Make Public</Text>
                        <Switch
                            value={isPublic}
                            onValueChange={(value) => {
                                console.log('Switching isPublic to:', value);
                                setIsPublic(value);
                            }}
                            trackColor={{ false: '#767577', true: '#4da6ff' }}
                            thumbColor={isPublic ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Set as Active Tierlist</Text>
                        <Switch
                            value={isActiveTierlist}
                            onValueChange={(value) => {
                                if (!isActiveTierlist && !isSettingActive) {
                                    handleSetActiveList();
                                }
                            }}
                            disabled={isActiveTierlist || isSettingActive}
                            trackColor={{ false: '#767577', true: '#32CD32' }}
                            thumbColor={isActiveTierlist ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                    onPress={() => {
                        console.log('Delete button pressed');
                        confirmDelete();
                    }}
                    disabled={isDeleting}
                >
                    <Text style={styles.deleteButtonText}>
                        {isDeleting ? 'Deleting...' : 'Delete Tierlist'}
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
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
    scrollView: {
        flex: 1,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 800,
        padding: 16,
    },
    formSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: 'white',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#4da6ff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    submitButtonDisabled: {
        backgroundColor: '#4da6ff80',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    deleteButtonDisabled: {
        backgroundColor: '#ff6b6b80',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});