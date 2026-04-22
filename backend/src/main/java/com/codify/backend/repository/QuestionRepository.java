package com.codify.backend.repository;

import org.apache.kafka.common.quota.ClientQuotaAlteration.Op;
import org.springframework.data.jpa.repository.JpaRepository;
import com.codify.backend.model.Question;
import java.util.Optional;
import java.util.Set;
import java.util.List;
import java.util.Map;
import com.codify.backend.model.Solution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Optional<Question> findByTitle(String title);
    Optional<Question> findByDescription(String description);
    Page<Question> findByDifficulty(String difficulty, Pageable pageable);
    Page<Question> findByTagsContaining(String tag, Pageable pageable);
    List<Question> findByIdIn(Set<Long> ids);
    Page<Question> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
