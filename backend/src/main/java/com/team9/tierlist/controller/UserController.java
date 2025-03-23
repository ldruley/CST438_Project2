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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.team9.tierlist.model.User;
import com.team9.tierlist.service.UserService;

import jakarta.validation.Valid;

@CrossOrigin(origins = {"http://localhost:8081", "http://localhost:19006"}) 
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    // Get all users - Admin only
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        logger.info("Admin requested all users");
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
        }

    // Create a new user - Admin only
    @PutMapping
    public ResponseEntity<?> createUserByAdmin(
            @RequestParam String username,
            @RequestBody User userDetails) {
        
        logger.info("Admin creating new user: {}", username);
        
        // Set the username from the parameter
        userDetails.setUsername(username);
        
        // Check if user already exists
        if (userService.userExistsByUsername(username)) {
            return new ResponseEntity<>(
                Map.of("message", "User with username " + username + " already exists"),
                HttpStatus.CONFLICT
            );
        }
        
        boolean created = userService.createUser(userDetails);
        if (created) {
            return new ResponseEntity<>(
                Map.of("message", "User created successfully"),
                HttpStatus.CREATED
            );
        } else {
            return new ResponseEntity<>(
                Map.of("message", "Failed to create user"),
                HttpStatus.BAD_REQUEST
            );
        }
    }

    // Delete a user - Admin only
    @DeleteMapping
    public ResponseEntity<?> deleteUserByUsername(@RequestParam String username) {
        logger.info("Admin attempting to delete user: {}", username);
        
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return new ResponseEntity<>(
                Map.of("message", "User not found with username: " + username),
                HttpStatus.NOT_FOUND
            );
        }
        
        // Check if admin is trying to delete themselves
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.getName().equals(username)) {
            return new ResponseEntity<>(
                Map.of("message", "Admins cannot delete their own account through this endpoint"),
                HttpStatus.FORBIDDEN
            );
        }
        
        boolean deleted = userService.deleteUser(user.getId());
        if (deleted) {
            return new ResponseEntity<>(
                Map.of("message", "User deleted successfully"),
                HttpStatus.NO_CONTENT
            );
        } else {
            return new ResponseEntity<>(
                Map.of("message", "Failed to delete user"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Update a user - Admin only
    @PatchMapping
    public ResponseEntity<?> updateUserByUsername(
            @RequestParam String username,
            @RequestBody Map<String, Object> updates) {
        
        logger.info("Admin updating user: {}", username);
        
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return new ResponseEntity<>(
                Map.of("message", "User not found with username: " + username),
                HttpStatus.NOT_FOUND
            );
        }
        
        User updatedUser = userService.patchUser(user.getId(), updates);
        if (updatedUser != null) {
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(
                Map.of("message", "Failed to update user"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    // User registration endpoint
    @PostMapping("/create")
    public ResponseEntity<?> addUser(@RequestBody User user) {
        // Get current authentication if available
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ADMIN"));
        
        // Non-admin users cannot create admin accounts
        if (!isAdmin && user.isAdmin()) {
            return new ResponseEntity<>(
                Map.of("message", "Not authorized to create admin accounts"),
                HttpStatus.FORBIDDEN
            );
        }
        
        boolean created = userService.createUser(user);
        if (created) {
            return new ResponseEntity<>(
                Map.of("message", "User created successfully"),
                HttpStatus.CREATED
            );
        } else {
            return new ResponseEntity<>(
                Map.of("message", "Failed to create user. Username or email may already exist."),
                HttpStatus.BAD_REQUEST
            );
        }
    }

    // Get current user info
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

    // Update password endpoint
    @PatchMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData,
            Principal principal) {
        
        // Check if user is trying to update their own password
        User user = userService.getUserByUsername(principal.getName());
        if (user == null) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
        
        // Allow if it's the user's own account or if user is admin
        boolean isAdminUser = user.isAdmin();
        boolean isOwnAccount = user.getId().equals(id);
        
        if (!isOwnAccount && !isAdminUser) {
            return new ResponseEntity<>("Not authorized to update this user's password", HttpStatus.FORBIDDEN);
        }
        
        String currentPassword = passwordData.get("currentPassword");
        String newPassword = passwordData.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            return new ResponseEntity<>("Current password and new password are required", HttpStatus.BAD_REQUEST);
        }
        
        // Skip current password check for admins updating other users
        boolean isUpdated;
        if (isAdminUser && !isOwnAccount) {
            // Admin changing someone else's password
            isUpdated = userService.resetPassword(id, newPassword);
        } else {
            // User changing own password
            isUpdated = userService.updatePassword(id, currentPassword, newPassword);
        }
        
        if (isUpdated) {
            return new ResponseEntity<>("Password updated successfully", HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Failed to update password. Current password may be incorrect.", HttpStatus.BAD_REQUEST);
        }
    }

    // Get user by id - admins or own user only
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(id);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Full user update - admins or own user only
    @PutMapping("/updateUser/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User userDetails, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(id);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        // Non-admins cannot change their admin status
        if (!isAdmin && isOwnAccount && userDetails.isAdmin() != currentUser.isAdmin()) {
            userDetails.setAdmin(currentUser.isAdmin()); // Reset to original value
        }
        
        User updatedUser = userService.updateUser(id, userDetails);
        if (updatedUser != null) {
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Partial user update - admins or own user only
    @PatchMapping("/{id}")
    public ResponseEntity<?> patchUser(@PathVariable Long id, @RequestBody Map<String, Object> updates, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(id);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        // Non-admins cannot change their admin status via patch
        if (!isAdmin && isOwnAccount && updates.containsKey("admin")) {
            updates.remove("admin");
        }
        
        User patchedUser = userService.patchUser(id, updates);

        if (patchedUser != null) {
            return new ResponseEntity<>(patchedUser, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Delete user - admins or own user only
    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(id);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        if (userService.deleteUser(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Set active tierlist - admins or own user only
    @PutMapping("/{userId}/activetier/{tierlistId}")
    public ResponseEntity<User> setActiveTierlist(@PathVariable Long userId, @PathVariable Long tierlistId, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(userId);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        User updatedUser = userService.setActiveTierlist(userId, tierlistId);
        if (updatedUser != null) {
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Get active tierlist - admins or own user only
    @GetMapping("/{userId}/activetier")
    public ResponseEntity<?> getActiveTierlist(@PathVariable Long userId, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(userId);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        Long activeTierlistId = userService.getActiveTierlistId(userId);
        if (activeTierlistId != null) {
            return new ResponseEntity<>(Map.of("activeTierlistId", activeTierlistId), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Check if user has active tierlist - admins or own user only
    @GetMapping("/{userId}/hasactivetier")
    public ResponseEntity<?> hasActiveTierlist(@PathVariable Long userId, Principal principal) {
        // Check permissions
        User currentUser = userService.getUserByUsername(principal.getName());
        if (currentUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        
        boolean isAdmin = currentUser.isAdmin();
        boolean isOwnAccount = currentUser.getId().equals(userId);
        
        if (!isAdmin && !isOwnAccount) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        boolean hasActive = userService.hasActiveTierlist(userId);
        return new ResponseEntity<>(Map.of("hasActiveTierlist", hasActive), HttpStatus.OK);
    }
    
    // Check if current user is admin
    @GetMapping("/isAdmin")
    public ResponseEntity<?> isAdmin(Principal principal) {
        logger.info("isAdmin endpoint called, principal: {}", principal);
        
        if (principal == null) {
            logger.warn("Principal is null, returning isAdmin=false");
            return new ResponseEntity<>(Map.of("isAdmin", false), HttpStatus.OK);
        }
        
        logger.info("Looking up user for username: {}", principal.getName());
        User user = userService.getUserByUsername(principal.getName());
        
        if (user == null) {
            logger.warn("User not found for username: {}", principal.getName());
            return new ResponseEntity<>(Map.of("isAdmin", false), HttpStatus.OK);
        }
        
        boolean isAdmin = user.isAdmin();
        logger.info("User {} isAdmin: {}", principal.getName(), isAdmin);
        
        return new ResponseEntity<>(Map.of("isAdmin", isAdmin), HttpStatus.OK);
    }
    
    // Find user by username - Admin only
    @GetMapping("/all/find")
    public ResponseEntity<?> findUserByUsername(@RequestParam String username) {
        User user = userService.getUserByUsername(username);
        if (user != null) {
            return new ResponseEntity<>(user, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(
                Map.of("message", "User not found with username: " + username),
                HttpStatus.NOT_FOUND
            );
        }
    }
    
    // Check if username exists - Admin only
    @GetMapping("/all/exists")
    public ResponseEntity<?> checkUsernameExists(@RequestParam String username) {
        boolean exists = userService.userExistsByUsername(username);
        return new ResponseEntity<>(Map.of("exists", exists), HttpStatus.OK);
    }
}

