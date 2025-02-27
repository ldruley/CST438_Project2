package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.repository.TierRepository;

@Service
public class TierService {

    @Autowired
    private TierRepository tierRepository;

    public List<Tier> getAllTiers() {
        return tierRepository.findAllByOrderByRankAsc();
    }

    public Optional<Tier> getTierById(Long id) {
        return tierRepository.findById(id);
    }

    public List<Tier> searchTiersByName(String name) {
        return tierRepository.findByNameContainingIgnoreCase(name);
    }

    public Tier getTierByRank(Integer rank) {
        return tierRepository.findByRank(rank);
    }

    @Transactional
    public Tier createTier(Tier tier) {
        // Handle rank assignment if not provided
        if (tier.getRank() == null) {
            // Find the highest rank and add 1
            long count = tierRepository.count();
            tier.setRank((int) count + 1);
        }
        return tierRepository.save(tier);
    }

    @Transactional
    public Tier updateTier(Long id, Tier tierDetails) {
        Optional<Tier> tierOpt = tierRepository.findById(id);
        if (tierOpt.isPresent()) {
            Tier tier = tierOpt.get();
            tier.setName(tierDetails.getName());
            tier.setColor(tierDetails.getColor());
            tier.setDescription(tierDetails.getDescription());

            // Handle rank changes if necessary
            if (tierDetails.getRank() != null && !tierDetails.getRank().equals(tier.getRank())) {
                tier.setRank(tierDetails.getRank());
            }

            return tierRepository.save(tier);
        }
        return null;
    }

    @Transactional
    public boolean deleteTier(Long id) {
        if (tierRepository.existsById(id)) {
            tierRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean existsByName(String name) {
        return tierRepository.existsByNameIgnoreCase(name);
    }
}