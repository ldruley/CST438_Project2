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

    // Find by name containing the search term
    List<Item> findByNameContainingIgnoreCase(String name);

    // Count items in a tier
    long countByTierId(Long tierId);
}