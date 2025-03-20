package com.team9.tierlist.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.team9.tierlist.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find all users
    List<User> findAll();

    // Find user by username
    User findByUsername(String username);

    // Find user by email
    User findByEmail(String email);

    // Check if a user with this username already exists
    boolean existsByUsername(String username);

    // Check if a user with this email already exists
    boolean existsByEmail(String email);

    //check if an admin exists
    boolean existsByIsAdminTrue();

    // Find users by active tierlist ID
    List<User> findByActiveTierlistId(Long activeTierlistId);
}