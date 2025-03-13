package com.team9.tierlist.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team9.tierlist.model.Item;
import com.team9.tierlist.model.Tier;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Find all items in a specific tier
    List<Item> findByTier(Tier tier);

    // Find items by tier id
    List<Item> findByTierId(Long tierId);

    // Find items by tier id ordered by rank
    List<Item> findByTierIdOrderByRankAsc(Long tierId);

    // Find by name containing the search term
    List<Item> findByNameContainingIgnoreCase(String name);

    // Count items in a tier
    long countByTierId(Long tierId);

    // Find by rank for a specific tier
    Item findByTierIdAndRank(Long tierId, Integer rank);

    // Find the maximum rank in a tier
    Integer findMaxRankByTierId(Long tierId);

    // Check if an item with this rank already exists in the tier
    boolean existsByTierIdAndRank(Long tierId, Integer rank);
}