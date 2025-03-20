import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorPicker from 'react-native-wheel-color-picker';
import { Tier } from '@/types/tierlist';

// TierInput Component
interface TierInputProps {
    tier: Tier;
    index: number;
    updateTier: (index: number, tier: Tier) => void;
    removeTier: (index: number) => void;
}

const TierInput: React.FC<TierInputProps> = ({ tier, index, updateTier, removeTier }) => {
    return (
        <View style={styles.tierInputContainer}>
            <View style={styles.tierHeader}>
                <Text style={styles.tierLabel}>Tier {index + 1}</Text>
                <TouchableOpacity
                    style={styles.removeTierButton}
                    onPress={() => removeTier(index)}
                >
                    <Text style={styles.removeTierButtonText}>X</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tierInputs}>
                <TextInput
                    style={styles.tierNameInput}
                    placeholder="Tier name (e.g., S, A, B)"
                    value={tier.name}
                    onChangeText={(text) => updateTier(index, { ...tier, name: text })}
                    placeholderTextColor="#999"
                />

                <View style={[styles.colorPreview, { backgroundColor: tier.color }]} />
            </View>

            <Text style={styles.colorLabel}>Tier Color:</Text>
            <View style={styles.colorPickerContainer}>
                <ColorPicker
                    color={tier.color}
                    onColorChange={(color) => updateTier(index, { ...tier, color })}
                    thumbSize={30}
                    sliderSize={20}
                    noSnap={true}
                    row={false}
                />
            </View>
        </View>
    );
};

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
    const [tiers, setTiers] = useState<Tier[]>([
        { id: 1, name: 'S', color: '#FF5252' },
        { id: 2, name: 'A', color: '#FF9800' },
        { id: 3, name: 'B', color: '#FFEB3B' },
        { id: 4, name: 'C', color: '#8BC34A' },
        { id: 5, name: 'D', color: '#03A9F4' },
        { id: 6, name: 'F', color: '#9C27B0' }
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
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Failed to get user info:', error);
            }
        };

        getUserInfo();
    }, []);

    const updateTier = (index: number, updatedTier: Tier) => {
        const updatedTiers = [...tiers];
        updatedTiers[index] = updatedTier;
        setTiers(updatedTiers);
    };

    const addTier = () => {
        const nextId = Math.max(...tiers.map(t => t.id)) + 1;
        setTiers([...tiers, { id: nextId, name: `Tier ${tiers.length + 1}`, color: '#808080' }]);
    };

    const removeTier = (index: number) => {
        if (tiers.length <= 1) {
            Alert.alert('Error', 'You need at least one tier');
            return;
        }

        const updatedTiers = [...tiers];
        updatedTiers.splice(index, 1);
        setTiers(updatedTiers);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a tierlist name');
            return;
        }

        if (tiers.length === 0) {
            Alert.alert('Error', 'You need at least one tier');
            return;
        }

        if (!userId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setIsSubmitting(true);

        try {
            // First create the tierlist
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
                    color: tiers[0].color, // Use first tier's color as the tierlist color
                }),
            });

            if (!tierlistResponse.ok) {
                throw new Error('Failed to create tierlist');
            }

            const tierlist = await tierlistResponse.json();

            // Now create each tier
            for (const tier of tiers) {
                await fetch(`http://localhost:8080/api/tiers/${tierlist.id}/tiers`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: tier.name,
                        color: tier.color,
                    }),
                });
            }

            Alert.alert(
                'Success',
                'Tierlist created successfully',
                [
                    {
                        text: 'OK',
                        onPress: () =>           router.replace({
                            pathname: '/tierlist/[id]',
                            params: { id: tierlist.id.toString() }
                        }),
                    },
                ]
            );
        } catch (error) {
            console.error('Error creating tierlist:', error);
            Alert.alert('Error', 'Failed to create tierlist');
        } finally {
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
                    <View style={styles.tiersHeader}>
                        <Text style={styles.sectionTitle}>Tiers</Text>
                        <TouchableOpacity style={styles.addTierButton} onPress={addTier}>
                            <Text style={styles.addTierButtonText}>+ Add Tier</Text>
                        </TouchableOpacity>
                    </View>

                    {tiers.map((tier, index) => (
                        <TierInput
                            key={tier.id}
                            tier={tier}
                            index={index}
                            updateTier={updateTier}
                            removeTier={removeTier}
                        />
                    ))}
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
    tiersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addTierButton: {
        backgroundColor: '#4da6ff',
        padding: 8,
        borderRadius: 8,
    },
    addTierButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tierInputContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tierLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    removeTierButton: {
        backgroundColor: '#ff6b6b',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeTierButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tierInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    tierNameInput: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        marginRight: 16,
        fontSize: 16,
    },
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
    },
    colorLabel: {
        fontSize: 16,
        color: 'white',
        marginBottom: 8,
    },
    colorPickerContainer: {
        height: 220,
        marginBottom: 16,
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