package az.ingress.oauth2.springoauth2.repository;

import az.ingress.oauth2.springoauth2.domain.User1;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User1, UUID> {

    @EntityGraph(attributePaths = "authorities")
    Optional<User1> findByUsername(String username);
}