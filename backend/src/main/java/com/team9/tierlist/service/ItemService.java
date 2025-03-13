package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;

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

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    public List<Item> getItemsByTierId(Long tierId) {
        return itemRepository.findByTierIdOrderByRankAsc(tierId);
    }

    public List<Item> searchItemsByName(String name) {
        return itemRepository.findByNameContainingIgnoreCase(name);
    }

    public Item getItemByTierIdAndRank(Long tierId, Integer rank) {
        return itemRepository.findByTierIdAndRank(tierId, rank);
    }

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

    @Transactional
    public boolean deleteItem(Long id) {
        if (itemRepository.existsById(id)) {
            itemRepository.deleteById(id);
            return true;
        }
        return false;
    }

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

    @Transactional
    public List<Item> reorderItems(Long tierId, Long itemId, Integer newRank) {
        Optional<Item> itemOpt = itemRepository.findById(itemId);
        if (itemOpt.isPresent() && itemOpt.get().getTier().getId().equals(tierId)) {
            Item item = itemOpt.get();
            Integer oldRank = item.getRank();

            // Get all items in this tier
            List<Item> tierItems = itemRepository.findByTierIdOrderByRankAsc(tierId);

            // Update ranks for affected items
            if (oldRank < newRank) {
                // Moving down: decrement ranks of items between old and new positions
                for (Item i : tierItems) {
                    if (i.getRank() > oldRank && i.getRank() <= newRank && !i.getId().equals(itemId)) {
                        i.setRank(i.getRank() - 1);
                        itemRepository.save(i);
                    }
                }
            } else if (oldRank > newRank) {
                // Moving up: increment ranks of items between new and old positions
                for (Item i : tierItems) {
                    if (i.getRank() >= newRank && i.getRank() < oldRank && !i.getId().equals(itemId)) {
                        i.setRank(i.getRank() + 1);
                        itemRepository.save(i);
                    }
                }
            }

            // Update the target item's rank
            item.setRank(newRank);
            itemRepository.save(item);

            // Return the updated list
            return itemRepository.findByTierIdOrderByRankAsc(tierId);
        }
        return null;
    }

    public long countItemsInTier(Long tierId) {
        return itemRepository.countByTierId(tierId);
    }
}