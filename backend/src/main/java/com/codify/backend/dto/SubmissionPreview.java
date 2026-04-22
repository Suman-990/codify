package com.codify.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionPreview {
    private Long submissionId;
    private String questionTitle;
    private String language;
    private String status; // pending,executed
    private String verdict;
}
