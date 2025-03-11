package com.team9.tierlist.repository;

import com.team9.tierlist.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    public void whenFindAll_thenReturnAllUsers() {
        // Given
        User user1 = new User();
        user1.setUsername("user1");
        user1.setEmail("user1@example.com");

        User user2 = new User();
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");

        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();

        // When
        List<User> users = userRepository.findAll();

        // Then
        assertThat(users).hasSize(2);
        assertThat(users).extracting(User::getUsername).containsExactlyInAnyOrder("user1", "user2");
    }

    @Test
    public void whenFindByUsername_thenReturnUser() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();

        // When
        User found = userRepository.findByUsername("testuser");

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    public void whenFindByNonExistentUsername_thenReturnNull() {
        // When
        User found = userRepository.findByUsername("nonexistent");

        // Then
        assertThat(found).isNull();
    }

    @Test
    public void whenFindByEmail_thenReturnUser() {
        // Given
        User user = new User();
        user.setUsername("emailuser");
        user.setEmail("specific@example.com");
        entityManager.persist(user);
        entityManager.flush();

        // When
        User found = userRepository.findByEmail("specific@example.com");

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo("emailuser");
    }

    @Test
    public void whenFindByNonExistentEmail_thenReturnNull() {
        // When
        User found = userRepository.findByEmail("nonexistent@example.com");

        // Then
        assertThat(found).isNull();
    }

    @Test
    public void whenExistsByUsername_withExistingUsername_thenReturnTrue() {
        // Given
        User user = new User();
        user.setUsername("existinguser");
        user.setEmail("existing@example.com");
        entityManager.persist(user);
        entityManager.flush();

        // When
        boolean exists = userRepository.existsByUsername("existinguser");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    public void whenExistsByUsername_withNonExistingUsername_thenReturnFalse() {
        // When
        boolean exists = userRepository.existsByUsername("nonexistinguser");

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    public void whenExistsByEmail_withExistingEmail_thenReturnTrue() {
        // Given
        User user = new User();
        user.setUsername("emailexists");
        user.setEmail("exists@example.com");
        entityManager.persist(user);
        entityManager.flush();

        // When
        boolean exists = userRepository.existsByEmail("exists@example.com");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    public void whenExistsByEmail_withNonExistingEmail_thenReturnFalse() {
        // When
        boolean exists = userRepository.existsByEmail("notexists@example.com");

        // Then
        assertThat(exists).isFalse();
    }
}