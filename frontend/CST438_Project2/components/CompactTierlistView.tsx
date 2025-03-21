import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { TIER_COLORS, TIER_RANKS, Item, Tier } from '@/types/tierlist';

interface TierRowProps {
  tierName: string;
  tierColor: string;
  items: Item[];
}

const TierRow: React.FC<TierRowProps> = ({ tierName, tierColor, items }) => {
  return (
    <View style={[styles.tierRow, { backgroundColor: tierColor }]}>
      <View style={styles.tierLabel}>
        <Text style={styles.tierName}>{tierName}</Text>
      </View>
      <ScrollView horizontal style={styles.itemsContainer} showsHorizontalScrollIndicator={false}>
        {items.length > 0 ? (
          items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyTier}>
            <Text style={styles.emptyTierText}>No items</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

interface CompactTierlistViewProps {
  tierlistId: number;
  jwtToken: string;
}

const CompactTierlistView: React.FC<CompactTierlistViewProps> = ({ tierlistId, jwtToken }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tierItems, setTierItems] = useState<Record<string, Item[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Standard tiers with fixed order
  const standardTiers = [
    { id: 1, name: 'S', color: TIER_COLORS['S'] },
    { id: 2, name: 'A', color: TIER_COLORS['A'] },
    { id: 3, name: 'B', color: TIER_COLORS['B'] },
    { id: 4, name: 'C', color: TIER_COLORS['C'] },
    { id: 5, name: 'D', color: TIER_COLORS['D'] },
    { id: 6, name: 'E', color: TIER_COLORS['E'] },
    { id: 7, name: 'F', color: TIER_COLORS['F'] }
  ];

  useEffect(() => {
    fetchTierlistItems();
  }, [tierlistId, jwtToken]);

  const fetchTierlistItems = async () => {
    if (!tierlistId || !jwtToken) {
      setError("Missing tierlist ID or authentication token");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/api/tiers/${tierlistId}/items`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tierlist items: ${response.statusText}`);
      }

      const items: Item[] = await response.json();

      // Organize items by tier rank
      const itemsByTier: Record<string, Item[]> = {};

      // Initialize all tiers with empty arrays
      standardTiers.forEach(tier => {
        itemsByTier[tier.name] = [];
      });

      // Populate items based on their rank
      items.forEach(item => {
        const tierName = TIER_RANKS[item.rank as keyof typeof TIER_RANKS] || 'S';
        if (!itemsByTier[tierName]) {
          itemsByTier[tierName] = [];
        }
        itemsByTier[tierName].push(item);
      });

      setTierItems(itemsByTier);
      setError(null);
    } catch (err) {
      setError(`Error loading tierlist items: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error fetching tierlist items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4da6ff" />
        <Text style={styles.loadingText}>Loading tierlist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {standardTiers.map((tier) => (
        <TierRow
          key={tier.id}
          tierName={tier.name}
          tierColor={tier.color}
          items={tierItems[tier.name] || []}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#4da6ff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    marginBottom: 4,
    height: 50,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tierLabel: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
  },
  tierName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  item: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
    marginVertical: 6,
    minWidth: 80,
    maxWidth: 120,
    justifyContent: 'center',
  },
  itemText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyTier: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyTierText: {
    color: 'white',
    fontStyle: 'italic',
  }
});

export default CompactTierlistView;