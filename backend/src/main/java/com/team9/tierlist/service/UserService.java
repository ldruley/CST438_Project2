package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean userExistsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean userExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public User createUser(User user) {
        return userRepository.save(user);
    }

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

    @Transactional
    public boolean deleteUser(Long id) {

        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
