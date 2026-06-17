package com.codify.backend.dto;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileDto {
    private String username;
    private String country;
    private int profilePictureId;
    private long totalSubmissions;
    private double acceptanceRate;
    private int totalSolved;
    private int easySolved;
    private int mediumSolved;
    private int hardSolved;
    private List<SubmissionPreview> recentSubmissions;
    private long sharedSolutionsCount;
    private long discussionsCount;
    private int activeDays;
    private Map<String, Integer> dailySubmissions;
    private int rankPercentage;
    private long rank;
    private LocalDate joined;
}
