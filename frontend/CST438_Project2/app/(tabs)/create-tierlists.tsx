import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tier, TIER_COLORS } from '@/types/tierlist';
import CustomAlert from '@/components/CustomAlert';

export default function CreateTierlistScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                }}
            />
            <CreateTierlistContent />
        </>
    );
}

const CreateTierlistContent: React.FC = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [makeActive, setMakeActive] = useState(true); // Default to setting as active
    const [hasActiveTierlist, setHasActiveTierlist] = useState(false);
    const [tiers] = useState<Tier[]>([
        { id: 1, name: 'S+', color: TIER_COLORS['S+'] },
        { id: 2, name: 'S', color: TIER_COLORS['S'] },
        { id: 3, name: 'A', color: TIER_COLORS['A'] },
        { id: 4, name: 'B', color: TIER_COLORS['B'] },
        { id: 5, name: 'C', color: TIER_COLORS['C'] },
        { id: 6, name: 'D', color: TIER_COLORS['D'] },
        { id: 7, name: 'F', color: TIER_COLORS['F'] }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [jwtToken, setJwtToken] = useState('');

    // Custom alert state
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

    // Fetch user ID, JWT token, and active tierlist status on component mount
    useEffect(() => {
        const getUserInfo = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                const token = await AsyncStorage.getItem('jwtToken');

                if (storedUserId && token) {
                    const uid = parseInt(storedUserId, 10);
                    setUserId(uid);
                    setJwtToken(token);

                    // Check if user has an active tierlist
                    try {
                        const response = await fetch(`http://localhost:8080/api/users/${uid}/hasactivetier`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        if (response.ok) {
                            const data = await response.json();
                            setHasActiveTierlist(data.hasActiveTierlist);

                            // If user already has an active tierlist, default the switch to off
                            if (data.hasActiveTierlist) {
                                setMakeActive(false);
                            }
                        }
                    } catch (err) {
                        console.error('Error checking active tierlist:', err);
                    }
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

    const handleSubmit = async () => {
        console.log("Starting handleSubmit");

        if (!name.trim()) {
            console.log("Missing name - showing alert");
            showAlert('Error', 'Please enter a tierlist name', [
                { text: 'OK', onPress: () => {} }
            ]);
            return;
        }

        if (!userId) {
            console.log("Missing userId - showing alert");
            showAlert('Error', 'User not authenticated', [
                { text: 'OK', onPress: () => {} }
            ]);
            return;
        }

        console.log("Setting isSubmitting to true");
        setIsSubmitting(true);

        try {
            console.log("Making fetch request to create tierlist");
            console.log("UserId:", userId);
            console.log("JWT Token length:", jwtToken.length);
            console.log("Request body:", JSON.stringify({
                name,
                description,
                isPublic,
                userId
            }));

            const tierlistResponse = await fetch(`http://localhost:8080/api/tiers/user/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    isPublic,
                    userId
                }),
            });

            console.log("Response status:", tierlistResponse.status);
            const responseText = await tierlistResponse.text();
            console.log("Response text:", responseText);

            if (!tierlistResponse.ok) {
                throw new Error(`Failed to create tierlist: ${responseText}`);
            }
            console.log(responseText);
            const tierlist = JSON.parse(responseText);
            console.log("Tierlist created:", tierlist);

            // If makeActive is true, set this as the active tierlist
            if (makeActive) {
                try {
                    const activeResponse = await fetch(`http://localhost:8080/api/users/${userId}/activetier/${tierlist.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!activeResponse.ok) {
                        console.warn('Failed to set as active tierlist, but tierlist was created');
                    }
                } catch (activeError) {
                    console.error('Error setting as active tierlist:', activeError);
                }
            }

            showAlert(
                'Success',
                `Tierlist created successfully${makeActive ? ' and set as active' : ''}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            console.log("Alert OK pressed, navigating to tierlist");
                            router.replace({
                                pathname: '/tierlist/[id]',
                                params: { id: tierlist.id.toString() }
                            });
                        },
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating tierlist:', error);
            showAlert(
                'Error',
                `Failed to create tierlist: ${error instanceof Error ? error.message : String(error)}`,
                [{ text: 'OK', onPress: () => {} }]
            );
        } finally {
            console.log("Setting isSubmitting to false");
            setIsSubmitting(false);
        }
    };

    return (
        <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Create Tierlist</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>New Tier</Text>

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
                            onValueChange={setIsPublic}
                            trackColor={{ false: '#767577', true: '#4da6ff' }}
                            thumbColor={isPublic ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.switchContainer}>
                        <View style={styles.switchLabelContainer}>
                            <Text style={styles.label}>Set as Active Tierlist</Text>
                            {hasActiveTierlist && (
                                <Text style={styles.helperText}>
                                    (You already have an active tierlist)
                                </Text>
                            )}
                        </View>
                        <Switch
                            value={makeActive}
                            onValueChange={setMakeActive}
                            trackColor={{ false: '#767577', true: '#32CD32' }}
                            thumbColor={makeActive ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Info</Text>
                    <Text style={styles.tierInfo}>
                        After creating the tierlist, you'll be able to add items to each tier.
                    </Text>

                    <View style={styles.tiersPreview}>
                        {tiers.map((tier) => (
                            <View key={tier.id} style={[styles.tierPreviewItem, { backgroundColor: tier.color }]}>
                                <Text style={styles.tierPreviewText}>{tier.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Creating...' : 'Create Tierlist'}
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
        padding: 16,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
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
    switchLabelContainer: {
        flex: 1,
    },
    helperText: {
        color: '#e0e0e0',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    tierInfo: {
        color: 'white',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    tiersPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    tierPreviewItem: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    tierPreviewText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    submitButton: {
        backgroundColor: '#4da6ff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    submitButtonDisabled: {
        backgroundColor: '#4da6ff80',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});