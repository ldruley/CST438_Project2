package com.team9.tierlist.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team9.tierlist.model.Tier;

@Repository
public interface TierRepository extends JpaRepository<Tier, Long> {

    // Find tiers ordered by rank
    List<Tier> findAllByOrderByRankAsc();

    // Find by name containing the search term (case insensitive)
    List<Tier> findByNameContainingIgnoreCase(String name);

    // Find tier with a specific rank
    Tier findByRank(Integer rank);

    // Check if a tier with this name already exists
    boolean existsByNameIgnoreCase(String name);
}