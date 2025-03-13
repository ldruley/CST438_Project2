package com.team9.tierlist.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.http.javanet.NetHttpTransport;
import java.util.Collections;
import java.security.GeneralSecurityException;
import java.io.IOException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(); // Hashing utility
    // Verify Google ID Token
    // public boolean verifyGoogleIdToken(String idToken) {
    //     try {
    //         GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
    //             .setAudience(Collections.singletonList(clientId))
    //             .build();
    //         GoogleIdToken token = verifier.verify(idToken);
    //         return token != null;
    //     } catch (GeneralSecurityException | IOException e) {
    //         return false;
    //     }
    // }

    // // Decode Google ID Token and get user info
    // public GoogleIdToken getGoogleIdToken(String idToken) throws GeneralSecurityException, IOException {
    //     GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
    //         .setAudience(Collections.singletonList(clientId))
    //         .build();
    //     return verifier.verify(idToken);
    // }

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
        //check if user exists
    if (userRepository.existsByUsername(user.getUsername())) {
        throw new IllegalArgumentException("Username already exists");
    }

    // Check if the email already exists
    if (userRepository.existsByEmail(user.getEmail())) {
        throw new IllegalArgumentException("Email already exists");
    }

        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Ensure new users are not admins
        user.setAdmin(false);

    // If both checks pass, save the user
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
    public boolean deleteUser(Long id) {

        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
