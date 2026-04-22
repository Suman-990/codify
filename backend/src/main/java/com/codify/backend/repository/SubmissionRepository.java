package com.codify.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.Submission;


public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Page<Submission> findByUserId(Long userId, Pageable pageable);
    Page<Submission> findByUserIdAndQuestionId(Long userId, Long questionId, Pageable pageable);
    long countByUserId(Long userId);
    long countByUserIdAndVerdict(Long userId, String string);
    long countByQuestionId(Long questionId);
    long countByQuestionIdAndVerdict(Long questionId, String string);
}
