import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Item, Tier, TIER_RANKS, TIER_COLORS } from '@/types/tierlist';
import CustomAlert from '@/components/CustomAlert';

interface TierListProps {
    tiers: Tier[];
    items?: Record<number, Item[]>;
    isEditable?: boolean;
    onItemMove?: (item: Item, direction: 'up' | 'down') => void;
    onItemDelete?: (item: Item) => void;
    onItemAdd?: (tierId: number, name: string) => void;
    onTierNameChange?: (tierId: number, name: string) => void;
}

const TierList: React.FC<TierListProps> = ({
                                               tiers,
                                               items = {},
                                               isEditable = false,
                                               onItemMove,
                                               onItemDelete,
                                               onItemAdd,
                                               onTierNameChange,
                                           }) => {
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

    // Individual item component
    const TierItem: React.FC<{
        item: Item;
        isEditable: boolean;
        onMove: (item: Item, direction: 'up' | 'down') => void;
        onDelete: (item: Item) => void;
    }> = ({ item, isEditable, onMove, onDelete }) => (
        <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            {isEditable && (
                <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => onMove(item, 'up')} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onMove(item, 'down')} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>↓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        // Show confirmation alert before deleting
                        showAlert(
                            'Confirm Delete',
                            `Are you sure you want to delete "${item.name}"?`,
                            [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => {}
                                },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => onDelete(item)
                                }
                            ]
                        );
                    }} style={styles.deleteButton}>
                        <Text style={styles.actionButtonText}>×</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // Add item input component
    const AddItemInput: React.FC<{
        tierId: number;
        onAdd: (tierId: number, name: string) => void;
    }> = ({ tierId, onAdd }) => {
        const [newItemName, setNewItemName] = useState('');

        const handleAddItem = () => {
            if (newItemName.trim()) {
                onAdd(tierId, newItemName);
                setNewItemName('');
            } else {
                showAlert('Error', 'Please enter an item name', [{ text: 'OK', onPress: () => {} }]);
            }
        };

        return (
            <View style={styles.addItemContainer}>
                <TextInput
                    style={styles.addItemInput}
                    placeholder="New item"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                    <Text style={styles.addItemButtonText}>+</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Tier row component
    const TierRow: React.FC<{
        tier: Tier;
        tierItems?: Item[];
        isEditable: boolean;
        onItemMove?: (item: Item, direction: 'up' | 'down') => void;
        onItemDelete?: (item: Item) => void;
        onItemAdd?: (tierId: number, name: string) => void;
        onTierNameChange?: (tierId: number, name: string) => void;
    }> = ({
              tier,
              tierItems = [],
              isEditable,
              onItemMove,
              onItemDelete,
              onItemAdd,
              onTierNameChange,
          }) => {
        const handleItemMove = (item: Item, direction: 'up' | 'down') => {
            if (onItemMove) {
                onItemMove(item, direction);
            }
        };

        const handleItemDelete = (item: Item) => {
            if (onItemDelete) {
                onItemDelete(item);
            }
        };

        return (
            <View style={[styles.tierRow, { backgroundColor: tier.color || TIER_COLORS[tier.name as keyof typeof TIER_COLORS] || '#333333' }]}>
                <View style={styles.tierLabel}>
                    {isEditable && onTierNameChange ? (
                        <TextInput
                            style={styles.tierNameInput}
                            value={tier.name}
                            onChangeText={(text) => onTierNameChange(tier.id, text)}
                            maxLength={5}
                        />
                    ) : (
                        <Text style={styles.tierName}>{tier.name}</Text>
                    )}
                </View>

                <ScrollView horizontal style={styles.itemsContainer}>
                    {tierItems.map((item) => (
                        <TierItem
                            key={item.id}
                            item={item}
                            isEditable={isEditable}
                            onMove={handleItemMove}
                            onDelete={handleItemDelete}
                        />
                    ))}

                    {isEditable && onItemAdd && (
                        <AddItemInput tierId={tier.id} onAdd={onItemAdd} />
                    )}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                {tiers.map((tier) => (
                    <TierRow
                        key={tier.id}
                        tier={tier}
                        tierItems={items[tier.id] || []}
                        isEditable={isEditable}
                        onItemMove={onItemMove}
                        onItemDelete={onItemDelete}
                        onItemAdd={onItemAdd}
                        onTierNameChange={onTierNameChange}
                    />
                ))}
            </ScrollView>

            {/* Custom Alert */}
            <CustomAlert
                isVisible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onBackdropPress={() => setAlertVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tierRow: {
        flexDirection: 'row',
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tierLabel: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.3)',
    },
    tierName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    tierNameInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        padding: 4,
        width: 40,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    itemsContainer: {
        flex: 1,
        padding: 10,
    },
    item: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 100,
        maxWidth: 150,
    },
    itemText: {
        color: '#333',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    actionButton: {
        backgroundColor: '#4da6ff',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 5,
        minWidth: 150,
    },
    addItemInput: {
        flex: 1,
        padding: 5,
        color: '#333',
    },
    addItemButton: {
        backgroundColor: '#32CD32',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addItemButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default TierList;