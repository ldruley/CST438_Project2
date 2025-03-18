package com.team9.tierlist.controller;

import com.team9.tierlist.model.JwtAuthenticationResponse;
import com.team9.tierlist.model.LoginRequest;
import com.team9.tierlist.model.User;
import com.team9.tierlist.service.UserInfoService;
import com.team9.tierlist.service.UserService;
import com.team9.tierlist.utils.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/auth")
public class AuthController {

private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
private final UserService userService;
private final PasswordEncoder passwordEncoder;
private final AuthenticationManager authenticationManager;
private final JwtTokenUtil jwtTokenUtil;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtTokenUtil jwtTokenUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String jwtToken = jwtTokenUtil.generateToken(userDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("jwtToken", jwtToken);
            response.put("username", userDetails.getUsername());

            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Authentication failed: " + e.getMessage());
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
}
