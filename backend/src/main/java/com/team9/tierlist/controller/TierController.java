package com.team9.tierlist.controller;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.team9.tierlist.model.Tier;
import com.team9.tierlist.service.ItemService;
import com.team9.tierlist.service.TierService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tiers")
public class TierController {

    @Autowired
    private TierService tierService;

    @Autowired
    private ItemService itemService;

    @GetMapping
    public ResponseEntity<List<Tier>> getAllTiers() {
        List<Tier> tiers = tierService.getAllTiers();
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

    @GetMapping("/rank/{rank}")
    public ResponseEntity<Tier> getTierByRank(@PathVariable Integer rank) {
        Tier tier = tierService.getTierByRank(rank);
        if (tier != null) {
            return new ResponseEntity<>(tier, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<?> createTier(@Valid @RequestBody Tier tier) {
        // Check if a tier with this name already exists
        if (tierService.existsByName(tier.getName())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "A tier with name '" + tier.getName() + "' already exists");
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        Tier createdTier = tierService.createTier(tier);
        return new ResponseEntity<>(createdTier, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTier(@PathVariable Long id, @Valid @RequestBody Tier tierDetails) {
        Tier updatedTier = tierService.updateTier(id, tierDetails);
        if (updatedTier != null) {
            return new ResponseEntity<>(updatedTier, HttpStatus.OK);
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
}