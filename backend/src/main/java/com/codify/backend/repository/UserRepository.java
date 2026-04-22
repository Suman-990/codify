package com.codify.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByTotalSolvedGreaterThan(int solved);
}
