package com.team9.tierlist.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

     private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;


    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) { // Inject via constructor
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    /**
     * Retrieves all users from the database.
     *
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Finds a user by their ID.
     *
     * @param id The user ID
     * @return An Optional containing the user if found, or empty if not found
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Finds a user by their username.
     *
     * @param username The username to search for
     * @return The user with the specified username, or null if not found
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }


    /**
     * Finds a user by their email address.
     *
     * @param email The email to search for
     * @return The user with the specified email, or null if not found
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Checks if a user with the given username exists.
     *
     * @param username The username to check
     * @return true if a user with the username exists, false otherwise
     */
    public boolean userExistsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Checks if a user with the given email exists.
     *
     * @param email The email to check
     * @return true if a user with the email exists, false otherwise
     */
    public boolean userExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Creates a new user.
     *
     * @param user The user entity to create
     * @return The created user with ID assigned
     */
    @Transactional
    public boolean createUser(User user) {
       try {
           userRepository.save(user);
           return true;
       } catch (Exception e) {
           return false;
       }
    }

    /**
     * Creates a default admin if one doesn't already exist.
     */
    @Transactional
    public void createDefaultAdmin() {
        // Check if an admin exists
        if (userRepository.existsByIsAdminTrue()) {
            return;  // Admin already exists
        }

        if (adminPassword == null || adminPassword.isEmpty()) {
            throw new IllegalArgumentException("Admin password not set in environment variables");
        }

        // Create the admin user
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("admin"));
        admin.setAdmin(true);

        // Save the admin user
        userRepository.save(admin);
    }

    /**
     * Updates all fields of an existing user.
     *
     * @param id The ID of the user to update
     * @param user The user entity with updated values
     * @return The updated user, or null if the user doesn't exist
     */
    @Transactional
    public User updateUser(Long id, User user) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User updatedUser = userOpt.get();
            updatedUser.setUsername(user.getUsername());
            updatedUser.setEmail(user.getEmail());
            updatedUser.setPassword(user.getPassword());
            updatedUser.setAdmin(user.isAdmin());
            return userRepository.save(updatedUser);
        }
        return null;
    }

    /**
     * Partially updates a user with only the provided fields.
     * This allows for partial updates without affecting other fields.
     *
     * @param id The ID of the user to update
     * @param updates Map containing field names and their new values
     * @return The updated user, or null if the user doesn't exist
     */
    @Transactional
    public User patchUser(Long id, Map<String, Object> updates) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Apply only the fields that are present in the updates map
            if (updates.containsKey("username")) {
                user.setUsername((String) updates.get("username"));
            }

            if (updates.containsKey("email")) {
                user.setEmail((String) updates.get("email"));
            }

            if (updates.containsKey("password")) {
                user.setPassword((String) updates.get("password"));
            }

            if (updates.containsKey("isAdmin")) {
                user.setAdmin((Boolean) updates.get("isAdmin"));
            }

            if (updates.containsKey("activeTierlistId")) {
                user.setActiveTierlistId((Long) updates.get("activeTierlistId"));
            }

            return userRepository.save(user);
        }
        return null;
    }

    /**
     * Deletes a user by their ID.
     *
     * @param id The ID of the user to delete
     * @return true if the user was successfully deleted, false if the user wasn't found
     */
    @Transactional
    public boolean deleteUser(Long id) {

        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
 * Updates a user's password after verifying the current password
 * 
 * @param id User ID
 * @param currentPassword The current password for verification
 * @param newPassword The new password to set
 * @return true if password was updated successfully, false otherwise
 */
@Transactional
public boolean updatePassword(Long id, String currentPassword, String newPassword) {
    Optional<User> userOpt = getUserById(id);
    
    if (userOpt.isEmpty()) {
        return false;
    }
    
    User user = userOpt.get();
    
    // Verify current password
    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
        return false;
    }
    
    // Set new password (encode it first)
    user.setPassword(passwordEncoder.encode(newPassword));
    
    // Save user
    try {
        userRepository.save(user);
        return true;
    } catch (Exception e) {
        return false;
    }
}

/**
 * Resets a user's password without requiring current password verification
 * This method should only be called by admins
 * 
 * @param id The user ID
 * @param newPassword The new password to set
 * @return true if password was reset successfully, false otherwise
 */
@Transactional
public boolean resetPassword(Long id, String newPassword) {
    Optional<User> userOpt = getUserById(id);
    
    if (userOpt.isEmpty()) {
        return false;
    }
    
    User user = userOpt.get();
    
    // Set new password (encode it first)
    user.setPassword(passwordEncoder.encode(newPassword));
    
    // Save user
    try {
        userRepository.save(user);
        return true;
    } catch (Exception e) {
        return false;
    }
}
    
        /**
     * Logs out a user.
     *
     * @param id The ID of the user to log out
     * @return true if the user was successfully logged out, false if the user wasn't found
     */
    @Transactional
    public boolean logoutUser(Long id) {
        
        return true;
    }

    public User setActiveTierlist(Long userId, Long tierlistId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setActiveTierlistId(tierlistId);
            return userRepository.save(user);
        }
        return null;
    }

    public Long getActiveTierlistId(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(User::getActiveTierlistId).orElse(null);
    }

    public boolean hasActiveTierlist(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.isPresent() && userOpt.get().getActiveTierlistId() != null;
    }
}