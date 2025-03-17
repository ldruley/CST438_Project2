package com.team9.tierlist.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
//import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.team9.tierlist.model.User;
import com.team9.tierlist.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.validation.Valid;
@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/create")
    public ResponseEntity<Object> createUser(@Valid @RequestBody User user) {
        // return new ResponseEntity<>(userService.createUser(user), HttpStatus.CREATED);
         try {
            User createdUser = userService.createUser(user);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED); 
        } catch (IllegalArgumentException e) {
            // Return an error response with a message if the user already exists
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.deleteUser(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}