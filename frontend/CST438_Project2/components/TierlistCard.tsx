import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Tierlist, TIER_COLORS, TIER_RANKS } from '@/types/tierlist';

interface TierlistCardProps {
    tierlist: Tierlist;
    isActive?: boolean;
    userId?: number | null;
    onPress: () => void;
    onSetActive?: () => void;
    onEdit?: () => void;
}

// Helper function to format date with relative time
const formatRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';

    try {
        const date = new Date(dateString);
        const now = new Date();

        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffYear > 0) {
            return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
        } else if (diffMonth > 0) {
            return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
        } else if (diffDay > 0) {
            return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
        } else if (diffHour > 0) {
            return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
        } else if (diffMin > 0) {
            return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
        } else {
            return 'Just now';
        }
    } catch (e) {
        return 'Unknown date';
    }
};

// Helper function to count items in each tier
const countItemsPerTier = (tierlist: Tierlist) => {
    if (!tierlist.items || tierlist.items.length === 0) {
        return {};
    }

    const counts: Record<string, number> = {};
    Object.keys(TIER_RANKS).forEach(rank => {
        counts[TIER_RANKS[rank as unknown as keyof typeof TIER_RANKS]] = 0;
    });

    tierlist.items.forEach(item => {
        const tierName = TIER_RANKS[item.rank as keyof typeof TIER_RANKS];
        if (tierName) {
            counts[tierName] = (counts[tierName] || 0) + 1;
        }
    });

    return counts;
};

const TierlistCard: React.FC<TierlistCardProps> = ({
                                                       tierlist,
                                                       isActive,
                                                       userId,
                                                       onPress,
                                                       onSetActive,
                                                       onEdit
                                                   }) => {
    const itemCounts = countItemsPerTier(tierlist);
    const totalItems = tierlist.items?.length || 0;
    const isOwner = userId && tierlist.user && tierlist.user.id === userId;

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

            <Text style={styles.itemCount}>{totalItems} Total Items</Text>

            <View style={styles.tierPreview}>
                {Object.entries(TIER_COLORS).map(([tier, color]) => {
                    const count = itemCounts[tier] || 0;
                    return (
                        <View key={tier} style={styles.tierContainer}>
                            <Text style={styles.tierNameTop}>{tier}</Text>
                            <View style={[styles.tierDot, {backgroundColor: color}]}>
                                <Text style={styles.tierCount}>{count}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={styles.bottomContainer}>
                {tierlist.createdDate && (
                    <Text style={styles.createdDate}>Created: {formatRelativeTime(tierlist.createdDate)}</Text>
                )}
                <View style={styles.buttonGroup}>
                    {isOwner && onEdit && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={onEdit}
                        >
                            <Text style={styles.buttonText}>Edit Details</Text>
                        </TouchableOpacity>
                    )}
                    {onSetActive && (
                        <TouchableOpacity
                            style={[
                                styles.setActiveButton,
                                isActive && styles.activeButton
                            ]}
                            onPress={onSetActive}
                            disabled={isActive}
                        >
                            <Text style={styles.buttonText}>
                                {isActive ? 'Active Tierlist' : 'Set as Active'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
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
    },
    tierPreview: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 12,
    },
    tierContainer: {
        alignItems: 'center',
        marginRight: 8,
    },
    tierNameTop: {
        color: 'white',
        fontSize: 10,
        marginBottom: 2,
    },
    tierDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    tierCount: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    itemCount: {
        color: '#c0c0c0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonGroup: {
        flexDirection: 'row',
    },
    setActiveButton: {
        backgroundColor: '#8BC34A',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    activeButton: {
        backgroundColor: '#4da6ff',
    },
    editButton: {
        backgroundColor: '#4da6ff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginRight: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default TierlistCard;