package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.Item;
import com.team9.tierlist.model.Tier;
import com.team9.tierlist.repository.ItemRepository;
import com.team9.tierlist.repository.TierRepository;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private TierRepository tierRepository;

    /**
     * Retrieves all items from the database.
     *
     * @return List of all items
     */
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    /**
     * Finds an item by its ID.
     *
     * @param id The item ID
     * @return An Optional containing the item if found, or empty if not found
     */
    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    /**
     * Retrieves all items in a specific tier, ordered by their rank.
     *
     * @param tierId The ID of the tier
     * @return List of items in the tier, ordered by rank ascending
     */
    public List<Item> getItemsByTierId(Long tierId) {
        return itemRepository.findByTierIdOrderByRankAsc(tierId);
    }

    /**
     * Searches for items by name (case insensitive, partial match).
     *
     * @param name The name or part of the name to search for
     * @return List of items matching the search criteria
     */
    public List<Item> searchItemsByName(String name) {
        return itemRepository.findByNameContainingIgnoreCase(name);
    }

    /**
     * Finds an item by its tier ID and rank.
     *
     * @param tierId The ID of the tier
     * @param rank The rank within the tier
     * @return The item at the specified rank in the tier, or null if not found
     */
    public Item getItemByTierIdAndRank(Long tierId, Integer rank) {
        return itemRepository.findByTierIdAndRank(tierId, rank);
    }

    /**
     * Creates a new item and associates it with a tier.
     * If no rank is provided, assigns the item to the end of the tier.
     *
     * @param item The item entity to create
     * @param tierId The ID of the tier to which the item will belong
     * @return The created item with ID assigned
     */
    @Transactional
    public Item createItem(Item item, Long tierId) {
        if (tierId != null) {
            Optional<Tier> tierOpt = tierRepository.findById(tierId);
            if (tierOpt.isPresent()) {
                item.setTier(tierOpt.get());

                // Handle rank assignment if not provided
                if (item.getRank() == null) {
                    // Count existing items in the tier and add 1
                    long count = itemRepository.countByTierId(tierId);
                    item.setRank((int) count + 1);
                }
            }
        }
        return itemRepository.save(item);
    }

    /**
     * Updates an existing item, handling tier changes and rank adjustments as needed.
     *
     * @param id The ID of the item to update
     * @param itemDetails The item entity with updated values
     * @return The updated item, or null if the item doesn't exist
     */
    @Transactional
    public Item updateItem(Long id, Item itemDetails) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            item.setName(itemDetails.getName());

            // Update rank if provided
            if (itemDetails.getRank() != null) {
                item.setRank(itemDetails.getRank());
            }

            // Update tier if provided
            if (itemDetails.getTier() != null && itemDetails.getTier().getId() != null) {
                Optional<Tier> tierOpt = tierRepository.findById(itemDetails.getTier().getId());
                if (tierOpt.isPresent()) {
                    // If changing tiers and no rank specified, assign to the end of the new tier
                    if (!tierOpt.get().getId().equals(item.getTier().getId()) && itemDetails.getRank() == null) {
                        long count = itemRepository.countByTierId(itemDetails.getTier().getId());
                        item.setRank((int) count + 1);
                    }
                    item.setTier(tierOpt.get());
                }
            }

            return itemRepository.save(item);
        }
        return null;
    }

    /**
     * Deletes an item by its ID.
     *
     * @param id The ID of the item to delete
     * @return true if the item was successfully deleted, false if the item wasn't found
     */
    @Transactional
    public boolean deleteItem(Long id) {
        if (itemRepository.existsById(id)) {
            itemRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Assigns an item to a different tier, updating its rank as needed.
     *
     * @param itemId The ID of the item to move
     * @param tierId The ID of the destination tier
     * @return The updated item, or null if either the item or tier doesn't exist
     */
    @Transactional
    public Item assignItemToTier(Long itemId, Long tierId) {
        Optional<Item> itemOpt = itemRepository.findById(itemId);
        Optional<Tier> tierOpt = tierRepository.findById(tierId);

        if (itemOpt.isPresent() && tierOpt.isPresent()) {
            Item item = itemOpt.get();

            // If changing tiers, assign to the end of the new tier
            if (item.getTier() == null || !item.getTier().getId().equals(tierId)) {
                long count = itemRepository.countByTierId(tierId);
                item.setRank((int) count + 1);
            }

            item.setTier(tierOpt.get());
            return itemRepository.save(item);
        }
        return null;
    }


    /**
     * Updates an item's rank within its tier.
     *
     * @param itemId The ID of the item to update
     * @param newRank The new rank to assign
     * @return The updated item, or null if the item doesn't exist
     */
    @Transactional
    public Item updateItemRank(Long itemId, Integer newRank) {
        Optional<Item> itemOpt = itemRepository.findById(itemId);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            item.setRank(newRank);
            return itemRepository.save(item);
        }
        return null;
    }

    /**
     * Creates multiple items at once and assigns them to a tier.
     * Handles rank assignment for all items in the batch.
     *
     * @param items List of item entities to create
     * @param tierId The ID of the tier to which the items will belong
     * @return List of created items with IDs assigned, or null if the tier doesn't exist
     */
    @Transactional
    public List<Item> createMultipleItems(List<Item> items, Long tierId) {
        if (tierId == null) {
            return null;
        }

        Optional<Tier> tierOpt = tierRepository.findById(tierId);
        if (!tierOpt.isPresent()) {
            return null;
        }

        Tier tier = tierOpt.get();

        // Get current count of items in this tier to start assigning ranks
        long currentCount = itemRepository.countByTierId(tierId);

        // Process all items
        List<Item> createdItems = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            Item item = items.get(i);
            item.setTier(tier);

            // Assign rank if not provided
            if (item.getRank() == null) {
                item.setRank((int)currentCount + i + 1);
            }

            createdItems.add(itemRepository.save(item));
        }

        return createdItems;
    }

    /**
     * Counts the number of items in a tier.
     *
     * @param tierId The ID of the tier
     * @return The number of items in the tier
     */
    public long countItemsInTier(Long tierId) {
        return itemRepository.countByTierId(tierId);
    }
}