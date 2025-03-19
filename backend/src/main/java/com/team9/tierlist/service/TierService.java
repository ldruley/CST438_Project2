package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.model.User;
import com.team9.tierlist.model.Item;
import com.team9.tierlist.repository.TierRepository;
import com.team9.tierlist.repository.UserRepository;
import com.team9.tierlist.repository.ItemRepository;

@Service
public class TierService {

    @Autowired
    private TierRepository tierRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    /**
     * Retrieves all tiers from the database.
     *
     * @return List of all tiers
     */
    public List<Tier> getAllTiers() {
        return tierRepository.findAll();
    }

    /**
     * Finds a tier by its ID.
     *
     * @param id The tier ID
     * @return An Optional containing the tier if found, or empty if not found
     */
    public Optional<Tier> getTierById(Long id) {
        return tierRepository.findById(id);
    }

    /**
     * Searches for tiers by name (case insensitive, partial match).
     *
     * @param name The name or part of the name to search for
     * @return List of tiers matching the search criteria
     */
    public List<Tier> searchTiersByName(String name) {
        return tierRepository.findByNameContainingIgnoreCase(name);
    }

    /**
     * Retrieves all tiers created by a specific user.
     *
     * @param userId The ID of the user
     * @return List of tiers created by the specified user
     */
    public List<Tier> getTiersByUserId(Long userId) {
        return tierRepository.findByUserId(userId);
    }

    /**
     * Creates a new tier associated with a specific user.
     *
     * @param tier The tier entity to create
     * @param userId The ID of the user who will own this tier
     * @return The created tier with ID assigned, or null if the user doesn't exist
     */
    @Transactional
    public Tier createTier(Tier tier, Long userId) {
        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                tier.setUser(userOpt.get());
                return tierRepository.save(tier);
            }
        }
        return null;
    }

    /**
     * Updates all fields of an existing tier.
     *
     * @param id The ID of the tier to update
     * @param tierDetails The tier entity with updated values
     * @return The updated tier, or null if the tier doesn't exist
     */
    @Transactional
    public Tier updateTier(Long id, Tier tierDetails) {
        Optional<Tier> tierOpt = tierRepository.findById(id);
        if (tierOpt.isPresent()) {
            Tier tier = tierOpt.get();
            tier.setName(tierDetails.getName());
            tier.setColor(tierDetails.getColor());
            tier.setDescription(tierDetails.getDescription());

            return tierRepository.save(tier);
        }
        return null;
    }

    /**
     * Get a tier's items grouped by rank
     * @param tierId The ID of the tier
     * @return A map where the key is the rank and the value is a list of items with that rank
     */
    public Map<Integer, List<Map<String, Object>>> getItemsByRank(Long tierId) {
        Optional<Tier> tierOpt = tierRepository.findById(tierId);
        if (!tierOpt.isPresent()) {
            return null;
        }

        // Get all items for this tier
        List<Item> items = itemRepository.findByTierId(tierId);

        // Group items by rank
        Map<Integer, List<Map<String, Object>>> itemsByRank = new HashMap<>();

        for (Item item : items) {
            Integer rank = item.getRank();
            if (!itemsByRank.containsKey(rank)) {
                itemsByRank.put(rank, new ArrayList<>());
            }

            // Create a simplified map with just the item properties we want to return
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", item.getId());
            itemMap.put("name", item.getName());
            itemMap.put("rank", item.getRank());

            itemsByRank.get(rank).add(itemMap);
        }

        return itemsByRank;
    }

    /**
     * Partially updates a tier with only the provided fields.
     * This allows for partial updates without affecting other fields.
     *
     * @param id The ID of the tier to update
     * @param updates Map containing field names and their new values
     * @return The updated tier, or null if the tier doesn't exist
     */
    @Transactional
    public Tier patchTier(Long id, Map<String, Object> updates) {
        Optional<Tier> tierOpt = tierRepository.findById(id);
        if (tierOpt.isPresent()) {
            Tier tier = tierOpt.get();

            // Apply only the fields that are present in the updates map
            if (updates.containsKey("name")) {
                tier.setName((String) updates.get("name"));
            }

            if (updates.containsKey("color")) {
                tier.setColor((String) updates.get("color"));
            }

            if (updates.containsKey("description")) {
                tier.setDescription((String) updates.get("description"));
            }

            return tierRepository.save(tier);
        }
        return null;
    }


    /**
     * Deletes a tier by its ID.
     *
     * @param id The ID of the tier to delete
     * @return true if the tier was successfully deleted, false if the tier wasn't found
     */
    @Transactional
    public boolean deleteTier(Long id) {
        if (tierRepository.existsById(id)) {
            // Find all users who have this as their active tierlist
            List<User> users = userRepository.findByActiveTierlistId(id);

            // Update those users to not have an active tierlist
            for (User user : users) {
                user.setActiveTierlistId(null);
                userRepository.save(user);
            }

            tierRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Checks if a tier with the given name already exists for a specific user.
     *
     * @param name The tier name to check
     * @param userId The ID of the user
     * @return true if a tier with the name exists for the user, false otherwise
     */
    public boolean existsByNameAndUserId(String name, Long userId) {
        return tierRepository.existsByNameIgnoreCaseAndUserId(name, userId);
    }

    public Optional<Tier> getActiveTierlistForUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getActiveTierlistId() != null) {
            return tierRepository.findById(user.getActiveTierlistId());
        }
        return Optional.empty();
    }
}