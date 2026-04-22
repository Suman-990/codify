package com.codify.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.Solution;

import java.util.List;
import org.springframework.data.domain.Pageable;

public interface SolutionRepository extends JpaRepository<Solution, Long> {
    List<Solution> findByLanguage(String language);
    List<Solution> findByUserId(Long userId);
    List<Solution> findByQuestionId(Long questionId);
    Page<Solution> findByQuestionId(Long questionId, Pageable pageable);
    long countByQuestionId(Long questionId);
    long countByUserId(Long userId);
}
