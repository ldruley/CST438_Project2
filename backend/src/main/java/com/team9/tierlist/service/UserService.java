package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

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
    public User createUser(User user) {
        return userRepository.save(user);
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
}
