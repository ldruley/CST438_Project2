package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.Item;
import com.team9.tierlist.model.Tier;
import com.team9.tierlist.repository.ItemRepository;
import com.team9.tierlist.repository.TierRepository;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private TierRepository tierRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    public List<Item> getItemsByTierId(Long tierId) {
        return itemRepository.findByTierId(tierId);
    }

    public List<Item> searchItemsByName(String name) {
        return itemRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public Item createItem(Item item, Long tierId) {
        if (tierId != null) {
            Optional<Tier> tierOpt = tierRepository.findById(tierId);
            if (tierOpt.isPresent()) {
                item.setTier(tierOpt.get());
            }
        }
        return itemRepository.save(item);
    }

    @Transactional
    public Item updateItem(Long id, Item itemDetails) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            item.setName(itemDetails.getName());
            item.setImageUrl(itemDetails.getImageUrl());

            // Update tier if provided
            if (itemDetails.getTier() != null && itemDetails.getTier().getId() != null) {
                Optional<Tier> tierOpt = tierRepository.findById(itemDetails.getTier().getId());
                if (tierOpt.isPresent()) {
                    item.setTier(tierOpt.get());
                }
            }

            return itemRepository.save(item);
        }
        return null;
    }

    @Transactional
    public boolean deleteItem(Long id) {
        if (itemRepository.existsById(id)) {
            itemRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Item assignItemToTier(Long itemId, Long tierId) {
        Optional<Item> itemOpt = itemRepository.findById(itemId);
        Optional<Tier> tierOpt = tierRepository.findById(tierId);

        if (itemOpt.isPresent() && tierOpt.isPresent()) {
            Item item = itemOpt.get();
            item.setTier(tierOpt.get());
            return itemRepository.save(item);
        }
        return null;
    }

    public long countItemsInTier(Long tierId) {
        return itemRepository.countByTierId(tierId);
    }
}