package com.team9.tierlist.controller;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.model.Item;
import com.team9.tierlist.service.ItemService;
import com.team9.tierlist.service.TierService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tiers")
public class TierController {

    private static final Logger logger = LoggerFactory.getLogger(TierController.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private TierService tierService;

    @Autowired
    private ItemService itemService;

    @GetMapping
    public ResponseEntity<List<Tier>> getAllTiers() {
        List<Tier> tiers = tierService.getAllTiers();
        return new ResponseEntity<>(tiers, HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Tier>> getTiersByUserId(@PathVariable Long userId) {
        List<Tier> tiers = tierService.getTiersByUserId(userId);
        return new ResponseEntity<>(tiers, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tier> getTierById(@PathVariable Long id) {
        Optional<Tier> tier = tierService.getTierById(id);
        return tier.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Tier>> searchTiers(@RequestParam String name) {
        List<Tier> tiers = tierService.searchTiersByName(name);
        return new ResponseEntity<>(tiers, HttpStatus.OK);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createTier(@PathVariable Long userId, @Valid @RequestBody Tier tier) {
        // Add detailed logging
        logger.info("Creating tier with name: " + tier.getName() + " for user: " + userId);

        // Check if a tier with this name already exists for this user
        if (tierService.existsByNameAndUserId(tier.getName(), userId)) {
            logger.info("Tier with name '" + tier.getName() + "' already exists for user: " + userId);
            Map<String, String> error = new HashMap<>();
            error.put("error", "A tier with name '" + tier.getName() + "' already exists for this user");
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        Tier createdTier = tierService.createTier(tier, userId);
        if (createdTier != null) {
            logger.info("Tier created successfully with ID: " + createdTier.getId() +
                    ", created at: " + (createdTier.getCreatedDate() != null ?
                    createdTier.getCreatedDate().format(DATE_FORMATTER) : "NULL"));
            return new ResponseEntity<>(createdTier, HttpStatus.CREATED);
        }
        logger.info("Failed to create tier");
        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTier(@PathVariable Long id, @Valid @RequestBody Tier tierDetails) {
        Tier updatedTier = tierService.updateTier(id, tierDetails);
        if (updatedTier != null) {
            return new ResponseEntity<>(updatedTier, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{id}/ranks")
    public ResponseEntity<?> getItemsByRank(@PathVariable Long id) {
        Map<Integer, List<Map<String, Object>>> itemsByRank = tierService.getItemsByRank(id);

        if (itemsByRank != null) {
            return new ResponseEntity<>(itemsByRank, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patchTier(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        // Check if a tier with this name already exists for this user if name is being updated
        if (updates.containsKey("name")) {
            Optional<Tier> existingTier = tierService.getTierById(id);
            if (existingTier.isPresent() &&
                    !existingTier.get().getName().equals(updates.get("name")) &&
                    tierService.existsByNameAndUserId((String) updates.get("name"), existingTier.get().getUser().getId())) {

                Map<String, String> error = new HashMap<>();
                error.put("error", "A tier with name '" + updates.get("name") + "' already exists for this user");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
        }

        Tier patchedTier = tierService.patchTier(id, updates);

        if (patchedTier != null) {
            return new ResponseEntity<>(patchedTier, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTier(@PathVariable Long id) {
        // Check if tier has items
        long itemCount = itemService.countItemsInTier(id);
        if (itemCount > 0) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Cannot delete tier with " + itemCount + " items. Move or delete items first.");
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        boolean deleted = tierService.deleteTier(id);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<?> getTierItems(@PathVariable Long id) {
        if (!tierService.getTierById(id).isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(itemService.getItemsByTierId(id), HttpStatus.OK);
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<Tier> getUserActiveTierlist(@PathVariable Long userId) {
        Optional<Tier> activeTier = tierService.getActiveTierlistForUser(userId);
        return activeTier.map(tier -> new ResponseEntity<>(tier, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/public")
    public ResponseEntity<List<Tier>> getAllPublicTiers() {
        List<Tier> publicTiers = tierService.getAllPublicTiers();
        return new ResponseEntity<>(publicTiers, HttpStatus.OK);
    }

    @GetMapping("/public/user/{userId}")
    public ResponseEntity<List<Tier>> getPublicTiersByUser(@PathVariable Long userId) {
        List<Tier> publicTiers = tierService.getPublicTiersByUserId(userId);
        return new ResponseEntity<>(publicTiers, HttpStatus.OK);
    }

    @GetMapping("/public/search")
    public ResponseEntity<List<Tier>> searchPublicTiers(@RequestParam String name) {
        List<Tier> tiers = tierService.searchPublicTiersByName(name);
        return new ResponseEntity<>(tiers, HttpStatus.OK);
    }

    @PutMapping("/{id}/visibility")
    public ResponseEntity<Tier> setTierlistVisibility(
            @PathVariable Long id,
            @RequestParam Boolean isPublic) {

        Tier updatedTier = tierService.toggleTierlistVisibility(id, isPublic);

        if (updatedTier != null) {
            return new ResponseEntity<>(updatedTier, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}