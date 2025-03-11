package com.team9.tierlist.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Item name is required")
    @Size(max = 100, message = "Item name cannot exceed 100 characters")
    private String name;

    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "tier_id")
    @JsonIgnoreProperties("items")
    private Tier tier;

    // Default constructor
    public Item() {}

    // Constructor with required fields
    public Item(String name) {
        this.name = name;
    }

    // Full constructor
    public Item(String name, String imageUrl, Tier tier) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.tier = tier;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Tier getTier() {
        return tier;
    }

    public void setTier(Tier tier) {
        this.tier = tier;
    }

    @Override
    public String toString() {
        return "Item [id=" + id + ", name=" + name + ", tier=" + (tier != null ? tier.getName() : "none") + "]";
    }
}