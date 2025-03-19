package com.team9.tierlist.service;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username);

        if(user == null) {
            return "Username was not found";
        }
        if(passwordEncoder.matches(password, user.getPassword())) {
            return "Login was successful!";
        } else {
            return "Incorrect password. Please enter correct password.";
        }
    }
}
