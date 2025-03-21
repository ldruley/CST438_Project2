import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tier, TIER_COLORS } from '@/types/tierlist';

export default function CreateTierlistScreen() {
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
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
    // Predefined tiers with standard mapping
    const [tiers] = useState<Tier[]>([
        { id: 1, name: 'S', color: TIER_COLORS['S'] },
        { id: 2, name: 'A', color: TIER_COLORS['A'] },
        { id: 3, name: 'B', color: TIER_COLORS['B'] },
        { id: 4, name: 'C', color: TIER_COLORS['C'] },
        { id: 5, name: 'D', color: TIER_COLORS['D'] },
        { id: 6, name: 'E', color: TIER_COLORS['E'] },
        { id: 7, name: 'F', color: TIER_COLORS['F'] }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleSubmit = async () => {
        console.log("Starting handleSubmit");

        if (!name.trim()) {
            console.log("Missing name - showing alert");
            Alert.alert('Error', 'Please enter a tierlist name');
            return;
        }

        if (!userId) {
            console.log("Missing userId - showing alert");
            Alert.alert('Error', 'User not authenticated');
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

            Alert.alert(
                'Success',
                'Tierlist created successfully',
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
            //Alert.alert('Error', `Failed to create tierlist: ${error.message}`);
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
                            onValueChange={setIsPublic}
                            trackColor={{ false: '#767577', true: '#4da6ff' }}
                            thumbColor={isPublic ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Tiers Information</Text>
                    <Text style={styles.tierInfo}>
                        Your tierlist will include the standard tiers: S, A, B, C, D, E, and F.
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