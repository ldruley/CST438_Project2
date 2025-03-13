package com.team9.tierlist.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.model.User;

@Repository
public interface TierRepository extends JpaRepository<Tier, Long> {

    // Find by name containing the search term (case insensitive)
    List<Tier> findByNameContainingIgnoreCase(String name);

    // Find tiers by user
    List<Tier> findByUser(User user);

    // Find tiers by user id
    List<Tier> findByUserId(Long userId);

    // Check if a tier with this name already exists for a specific user
    boolean existsByNameIgnoreCaseAndUserId(String name, Long userId);
}