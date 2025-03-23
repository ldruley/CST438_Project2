package com.team9.tierlist.model;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

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

    private String description;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false; // Default to private

    // Add JsonFormat annotation to ensure consistent date formatting
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "tiers"})
    private User user;

    @OneToMany(mappedBy = "tier")
    @JsonIgnoreProperties("tier")
    private List<Item> items = new ArrayList<>();

    // Set creation date before persisting
    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }

    // Default constructor
    public Tier() {
    }

    // Constructor with required fields
    public Tier(String name, User user) {
        this.name = name;
        this.user = user;
    }

    // Full constructor
    public Tier(String name, String color, String description, User user, Boolean isPublic) {
        this.name = name;
        this.color = color;
        this.description = description;
        this.user = user;
        this.isPublic = isPublic != null ? isPublic : false;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    @Override
    public String toString() {
        return "Tier [id=" + id + ", name=" + name + ", color=" + color + ", user=" + (user != null ? user.getUsername() : "none") + ", createdDate=" + createdDate + "]";
    }
}