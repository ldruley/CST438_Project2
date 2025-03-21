package com.team9.tierlist.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.team9.tierlist.model.User;
import com.team9.tierlist.repository.UserRepository;
import com.team9.tierlist.service.UserService;
import com.team9.tierlist.utils.JwtTokenUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@RestController
@RequestMapping("/auth")
public class AuthController {

private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
private final UserService userService;
private final PasswordEncoder passwordEncoder;
private final AuthenticationManager authenticationManager;
private final JwtTokenUtil jwtTokenUtil;
private final UserRepository userRepository;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtTokenUtil jwtTokenUtil,UserRepository userRepository) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
        this.userRepository = userRepository;
    }


    @PostMapping("/debug-complete")
public ResponseEntity<?> debugComplete(@RequestParam String username, 
                                      @RequestParam String password) {
    System.out.println("Debug complete called for: " + username);
    
    // Check if user exists and delete it for clean test
    User existingUser = userRepository.findByUsername(username);
    if (existingUser != null) {
        userRepository.delete(existingUser);
        System.out.println("Deleted existing user");
    }
    
    // Create new user with encoded password
    String encodedPassword = passwordEncoder.encode(password);
    System.out.println("Encoded password: " + encodedPassword);
    
    User user = new User();
    user.setUsername(username);
    user.setEmail(username + "@test.com");
    user.setPassword(encodedPassword);
    user.setAdmin(false);
    
    // Save directly to repository
    userRepository.save(user);
    System.out.println("Saved user directly to repository");
    
    // Verify saved user
    User savedUser = userRepository.findByUsername(username);
    boolean passwordMatches = passwordEncoder.matches(password, savedUser.getPassword());
    System.out.println("Password matches directly: " + passwordMatches);
    
    // Try authenticating
    try {
        System.out.println("Attempting authentication");
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        System.out.println("Authentication successful!");
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "token", token,
            "passwordMatches", passwordMatches
        ));
    } catch (Exception e) {
        System.out.println("Authentication failed: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.ok(Map.of(
            "status", "failed",
            "error", e.getMessage(),
            "passwordMatches", passwordMatches
        ));
    }
}
    

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
        logger.info("User attempting to login: " + username);
        try {
            logger.info("Attempting to authenticate user: " + username);
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            logger.info("User has been authenticated: " + username);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            logger.info("User details: " + userDetails);

            String jwtToken = jwtTokenUtil.generateToken(userDetails);
            logger.info("JWT Token generated: " + jwtToken);

            // Get the user ID
            User user = userService.getUserByUsername(username);
            Long userId = user.getId();

            Map<String, Object> response = new HashMap<>();
            response.put("jwtToken", jwtToken);
            response.put("username", userDetails.getUsername());
            response.put("userId", userId);

            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {

            return ResponseEntity.status(401).body("Authentication failed: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during login: " + e.getMessage());
            return ResponseEntity.status(500).body("Error during login: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestParam String username, @RequestParam String email, @RequestParam String password){
        if(userService.getUserByUsername(username) != null || userService.getUserByEmail(email) !=null) {
            return ResponseEntity.badRequest().body("User Already Exists!");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setAdmin(false); // need to maybe change this to reflect how we actually set role

        boolean success = userService.createUser(user);

        if(success) {
             User createdUser = userService.getUserByUsername(username);
              Map<String, Object> response = new HashMap<>();
            response.put("id", createdUser.getId());
            response.put("username", createdUser.getUsername());
            response.put("email", createdUser.getEmail());
            response.put("isAdmin", createdUser.isAdmin());
            response.put("message", "User has been created successfully!");
            return ResponseEntity.ok("User has been created!");
        }else {
            return ResponseEntity.internalServerError().body("Unable to create user.");

        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response) {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        logger.info("User has been logged out");

        return ResponseEntity.ok("Successfully logged out!");

    }

    @GetMapping("/debug/auth")
    public ResponseEntity<String> debugAuthentication(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        StringBuilder debug = new StringBuilder();
        debug.append("Authorization Header: ").append(authHeader != null ? authHeader.substring(0, 20) + "..." : "null");

        debug.append("\n\nAuthentication exists: ").append(auth != null);

        if (auth != null) {
            debug.append("\nName: ").append(auth.getName());
            debug.append("\nAuthenticated: ").append(auth.isAuthenticated());
            debug.append("\nAuthorities: ").append(auth.getAuthorities());
            debug.append("\nPrincipal Type: ").append(auth.getPrincipal().getClass().getName());
        }

        return ResponseEntity.ok(debug.toString());
    }

    @GetMapping("/test-user-password")
public ResponseEntity<?> testUserPassword(@RequestParam String username, @RequestParam String password) {
    System.out.println("Testing user password for: " + username); 
    
    User user = userService.getUserByUsername(username);
    if (user == null) {
        System.out.println("User not found: " + username);
        return ResponseEntity.status(404).body("User not found");
    }
    
    System.out.println("User found in database");
    System.out.println("Stored password (encoded): " + user.getPassword());
    
    boolean matches = passwordEncoder.matches(password, user.getPassword());
    System.out.println("Password matches: " + matches);
    
    return ResponseEntity.ok(Map.of(
        "userExists", true,
        "passwordMatches", matches
    ));
}
}
