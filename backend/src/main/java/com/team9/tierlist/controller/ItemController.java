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

import com.team9.tierlist.model.Item;
import com.team9.tierlist.service.ItemService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        List<Item> items = itemService.getAllItems();
        return new ResponseEntity<>(items, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        Optional<Item> item = itemService.getItemById(id);
        return item.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Item>> searchItems(@RequestParam String name) {
        List<Item> items = itemService.searchItemsByName(name);
        return new ResponseEntity<>(items, HttpStatus.OK);
    }

    @GetMapping("/tier/{tierId}/rank/{rank}")
    public ResponseEntity<Item> getItemByTierAndRank(@PathVariable Long tierId, @PathVariable Integer rank) {
        Item item = itemService.getItemByTierIdAndRank(tierId, rank);
        if (item != null) {
            return new ResponseEntity<>(item, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<Item> createItem(@Valid @RequestBody Item item) {
        return new ResponseEntity<>(itemService.createItem(item,
                item.getTier() != null ? item.getTier().getId() : null),
                HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Long id, @Valid @RequestBody Item itemDetails) {
        Item updatedItem = itemService.updateItem(id, itemDetails);
        if (updatedItem != null) {
            return new ResponseEntity<>(updatedItem, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        boolean deleted = itemService.deleteItem(id);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{itemId}/tier/{tierId}")
    public ResponseEntity<?> assignToTier(@PathVariable Long itemId, @PathVariable Long tierId) {
        Item updatedItem = itemService.assignItemToTier(itemId, tierId);
        if (updatedItem != null) {
            return new ResponseEntity<>(updatedItem, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{itemId}/rank/{rank}")
    public ResponseEntity<Item> updateItemRank(@PathVariable Long itemId, @PathVariable Integer rank) {
        Item updatedItem = itemService.updateItemRank(itemId, rank);
        if (updatedItem != null) {
            return new ResponseEntity<>(updatedItem, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/tier/{tierId}/batch")
    public ResponseEntity<?> createMultipleItems(
            @PathVariable Long tierId,
            @Valid @RequestBody List<Item> items) {

        List<Item> createdItems = itemService.createMultipleItems(items, tierId);

        if (createdItems != null && !createdItems.isEmpty()) {
            return new ResponseEntity<>(createdItems, HttpStatus.CREATED);
        } else if (createdItems != null) {
            return new ResponseEntity<>(createdItems, HttpStatus.CREATED);
        }

        return new ResponseEntity<>(
                Map.of("error", "Could not create items. Tier may not exist."),
                HttpStatus.BAD_REQUEST
        );
    }
}