package com.team9.tierlist.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team9.tierlist.model.User;
import com.team9.tierlist.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    //get users from DB for admin
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('')") //need to add admin role
    public ResponseEntity<List<User>> getAllUsers(Principal principal) {
        logger.info("User '{}' is requesting /user/all", principal.getName());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("User roles: {}", auth.getAuthorities());

        List<User> users = userService.getAllUsers();
        if (users.isEmpty()) {
            logger.warn("No users found in database.");
            return ResponseEntity.status(404).body(null);
        }

        logger.info("Returning {} users.", users.size());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/create")
    public boolean addUser(@RequestBody User user){
        return  userService.createUser(user);
    }

    @GetMapping("/current")
public ResponseEntity<?> getCurrentUser(Principal principal) {
    if (principal == null) {
        return new ResponseEntity<>("Not authenticated", HttpStatus.UNAUTHORIZED);
    }
    
    User user = userService.getUserByUsername(principal.getName());
    if (user != null) {
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
    return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
}

    @PatchMapping("/{id}/password")
public ResponseEntity<?> updatePassword(
        @PathVariable Long id,
        @RequestBody Map<String, String> passwordData,
        Principal principal) {
    
    // Check if user is trying to update their own password
    User user = userService.getUserByUsername(principal.getName());
    if (user == null || !user.getId().equals(id)) {
        return new ResponseEntity<>("Not authorized to update this user's password", HttpStatus.FORBIDDEN);
    }
    
    String currentPassword = passwordData.get("currentPassword");
    String newPassword = passwordData.get("newPassword");
    
    if (currentPassword == null || newPassword == null) {
        return new ResponseEntity<>("Current password and new password are required", HttpStatus.BAD_REQUEST);
    }
    
    boolean isUpdated = userService.updatePassword(id, currentPassword, newPassword);
    
    if (isUpdated) {
        return new ResponseEntity<>("Password updated successfully", HttpStatus.OK);
    } else {
        return new ResponseEntity<>("Failed to update password. Current password may be incorrect.", HttpStatus.BAD_REQUEST);
    }
}

    @GetMapping("{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/updateUser/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User userDetails) {
        User updatedUser = userService.updateUser(id, userDetails);
        if (updatedUser != null) {
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        // Validate input as needed
        User patchedUser = userService.patchUser(id, updates);

        if (patchedUser != null) {
            return new ResponseEntity<>(patchedUser, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.deleteUser(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/{userId}/activetier/{tierlistId}")
    public ResponseEntity<User> setActiveTierlist(@PathVariable Long userId, @PathVariable Long tierlistId) {
        User updatedUser = userService.setActiveTierlist(userId, tierlistId);
        if (updatedUser != null) {
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{userId}/activetier")
    public ResponseEntity<?> getActiveTierlist(@PathVariable Long userId) {
        Long activeTierlistId = userService.getActiveTierlistId(userId);
        if (activeTierlistId != null) {
            // You might want to return the actual tierlist instead of just the ID
            return new ResponseEntity<>(Map.of("activeTierlistId", activeTierlistId), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{userId}/hasactivetier")
    public ResponseEntity<?> hasActiveTierlist(@PathVariable Long userId) {
        boolean hasActive = userService.hasActiveTierlist(userId);
        return new ResponseEntity<>(Map.of("hasActiveTierlist", hasActive), HttpStatus.OK);
    }
}