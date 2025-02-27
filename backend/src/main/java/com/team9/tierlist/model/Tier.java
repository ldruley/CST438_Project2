package com.team9.tierlist.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "tiers")
public class Tier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tier name is required")
    @Size(max = 50, message = "Tier name cannot exceed 50 characters")
    private String name;

    private String color;

    private Integer rank;

    private String description;

    @OneToMany(mappedBy = "tier")
    @JsonIgnoreProperties("tier")
    private List<Item> items = new ArrayList<>();

    // Default constructor
    public Tier() {
    }

    // Constructor with required fields
    public Tier(String name, Integer rank) {
        this.name = name;
        this.rank = rank;
    }

    // Full constructor
    public Tier(String name, String color, Integer rank, String description) {
        this.name = name;
        this.color = color;
        this.rank = rank;
        this.description = description;
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public void addItem(Item item) {
        items.add(item);
        item.setTier(this);
    }

    public void removeItem(Item item) {
        items.remove(item);
        item.setTier(null);
    }

    @Override
    public String toString() {
        return "Tier [id=" + id + ", name=" + name + ", rank=" + rank + ", color=" + color + "]";
    }
}