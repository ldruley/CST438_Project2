import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Tierlist, TIER_COLORS } from '@/types/tierlist';

interface TierlistCardProps {
    tierlist: Tierlist;
    isActive?: boolean;
    onPress: () => void;
    onSetActive?: () => void;
}

// Helper function to format date
const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';

    try {
        // Handle ISO format dates from the backend
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Unknown date';
    }
};

const TierlistCard: React.FC<TierlistCardProps> = ({
                                                       tierlist,
                                                       isActive,
                                                       onPress,
                                                       onSetActive
                                                   }) => {
    return (
        <TouchableOpacity
            style={[
                styles.tierlistCard,
                isActive && styles.activeTierlistCard
            ]}
            onPress={onPress}
        >
            <View style={styles.tierlistHeader}>
                <Text style={styles.tierlistName}>
                    {tierlist.name}
                    {isActive && <Text style={styles.activeIndicator}> (Active)</Text>}
                </Text>
                <View style={styles.badgeContainer}>

                    {tierlist.user && (
                        <View style={styles.creatorBadge}>
                            <Text style={styles.creatorText}>By: {tierlist.user.username}</Text>
                        </View>
                    )}

                    {tierlist.isPublic && (
                        <View style={styles.publicBadge}>
                            <Text style={styles.publicText}>Public</Text>
                        </View>
                    )}
                </View>
            </View>

            {tierlist.description && (
                <Text style={styles.tierlistDescription}>{tierlist.description}</Text>
            )}

            {tierlist.createdDate && (
                <Text style={styles.createdDate}>Created: {formatDate(tierlist.createdDate)}</Text>
            )}

            <View style={styles.tierPreview}>
                {Object.entries(TIER_COLORS).slice(0, 5).map(([tier, color]) => (
                    <View key={tier} style={[styles.tierDot, {backgroundColor: color}]}>
                        <Text style={styles.tierDotText}>{tier}</Text>
                    </View>
                ))}
            </View>

            {onSetActive && (
                <View style={styles.cardButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.setActiveButton,
                            isActive && styles.activeButton
                        ]}
                        onPress={onSetActive}
                        disabled={isActive}
                    >
                        <Text style={styles.setActiveButtonText}>
                            {isActive ? 'Active Tierlist' : 'Set as Active'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    tierlistCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    activeTierlistCard: {
        borderColor: '#4da6ff',
        borderWidth: 2,
        backgroundColor: 'rgba(77, 166, 255, 0.1)',
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
    activeIndicator: {
        color: '#4da6ff',
        fontStyle: 'italic',
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    publicBadge: {
        backgroundColor: '#32CD32',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    publicText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    creatorBadge: {
        backgroundColor: '#FF9800',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    creatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tierlistDescription: {
        color: '#e0e0e0',
        marginBottom: 8,
    },
    createdDate: {
        color: '#c0c0c0',
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 8,
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
    cardButtonsContainer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    setActiveButton: {
        backgroundColor: '#555555',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    activeButton: {
        backgroundColor: '#4da6ff',
    },
    setActiveButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default TierlistCard;