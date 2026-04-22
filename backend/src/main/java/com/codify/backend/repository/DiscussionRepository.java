package com.codify.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.Discussion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    Page<Discussion> findByQuestionId(Long questionId, Pageable pageable);
    long countByUserId(Long userId);
    long countByQuestionId(Long questionId);
}