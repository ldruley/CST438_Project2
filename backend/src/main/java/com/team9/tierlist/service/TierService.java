package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.TierRepository;
import com.team9.tierlist.repository.UserRepository;

@Service
public class TierService {

    @Autowired
    private TierRepository tierRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Tier> getAllTiers() {
        return tierRepository.findAll();
    }

    public Optional<Tier> getTierById(Long id) {
        return tierRepository.findById(id);
    }

    public List<Tier> searchTiersByName(String name) {
        return tierRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Tier> getTiersByUserId(Long userId) {
        return tierRepository.findByUserId(userId);
    }

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


    @Transactional
    public boolean deleteTier(Long id) {
        if (tierRepository.existsById(id)) {
            tierRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean existsByNameAndUserId(String name, Long userId) {
        return tierRepository.existsByNameIgnoreCaseAndUserId(name, userId);
    }
}